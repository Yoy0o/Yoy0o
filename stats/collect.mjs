// Collects traffic and growth stats for the owner's public (non-fork) repositories
// and merges them into stats/data/history.json, so history outlives GitHub's
// 14-day traffic window. Same data format as GeoVerseLabs/.github/stats, plus
// release asset downloads.
//
//   STATS_TOKEN=<pat> node stats/collect.mjs
//
// The token needs push access to the repos (traffic API requirement): a
// fine-grained PAT owned by the user with "Administration: read" (repository
// access "All" or "Only select", not "Public repositories"), or a classic PAT
// with `public_repo`.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const DATA_FILE = join(HERE, 'data', 'history.json');
export const OWNER = process.env.STATS_OWNER || 'Yoy0o';
export const WINDOW_DAYS = 14;
const MAX_LIST_PAGES = 10; // stargazers / forks / releases: up to 1000 each
// npm packages published from each repo; downloads are public (no token).
export const NPM_PACKAGES = {
  TerraView: ['terra-viewer'],
};
const NPM_MAX_DAYS = 540; // api.npmjs.org range limit is 18 months

export const day = (d) => new Date(d).toISOString().slice(0, 10);

export function windowDays(today, n = WINDOW_DAYS) {
  const end = Date.parse(today + 'T00:00:00Z');
  return Array.from({ length: n }, (_, i) => day(end - (n - 1 - i) * 86400000));
}

/**
 * Merge one 14-day traffic response into a {date: [count, uniques]} series.
 * Every day of the current window is written explicitly (missing = 0), so a key
 * present means "observed" and an absent key means "not tracked".
 * Newer observations win: today's partial bucket is completed by tomorrow's run.
 */
export function mergeDaily(series = {}, points = [], today) {
  const out = { ...series };
  for (const d of windowDays(today)) out[d] = [0, 0];
  for (const p of points) out[day(p.timestamp)] = [p.count, p.uniques];
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

export function sumReleaseDownloads(releases = []) {
  return releases.reduce(
    (s, r) => s + (r.assets ?? []).reduce((a, x) => a + (x.download_count ?? 0), 0),
    0,
  );
}

export function mergeRepo(prev = {}, fetched, today) {
  return {
    url: fetched.meta.html_url,
    description: fetched.meta.description ?? '',
    createdAt: day(fetched.meta.created_at),
    pushedAt: fetched.meta.pushed_at,
    archived: fetched.meta.archived,
    hasPages: fetched.meta.has_pages,
    views: mergeDaily(prev.views, fetched.views.views, today),
    clones: mergeDaily(prev.clones, fetched.clones.clones, today),
    snapshots: {
      ...prev.snapshots,
      [today]: {
        stars: fetched.meta.stargazers_count,
        forks: fetched.meta.forks_count,
        watchers: fetched.meta.subscribers_count,
        openIssues: fetched.meta.open_issues_count,
        views14: [fetched.views.count, fetched.views.uniques],
        clones14: [fetched.clones.count, fetched.clones.uniques],
        // Cumulative; falls back to the previous value when the release list
        // could not be read in full.
        releaseDownloads: fetched.releaseDownloads ?? prev.snapshots?.[latestKey(prev.snapshots)]?.releaseDownloads ?? 0,
      },
    },
    starDates: fetched.starDates ?? prev.starDates ?? [],
    forkDates: fetched.forkDates ?? prev.forkDates ?? [],
    // Referrers and paths are 14-day rolling totals; they cannot be split by day.
    referrers: fetched.referrers,
    paths: fetched.paths.map(({ path, title, count, uniques }) => ({ path, title, count, uniques })),
  };
}

const latestKey = (o = {}) => Object.keys(o).sort().at(-1);

/** npm counts settle a day or two late, so the fetched range always wins. */
export function mergeNpm(prev = {}, fetchedNpm = []) {
  const out = { ...prev };
  for (const { name, repo, downloads } of fetchedNpm) {
    const series = { ...out[name]?.downloads };
    for (const d of downloads) series[d.day] = d.downloads;
    out[name] = {
      repo,
      downloads: Object.fromEntries(Object.entries(series).sort(([a], [b]) => a.localeCompare(b))),
    };
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

export function mergeHistory(prev, owner, fetchedRepos, now, fetchedNpm = []) {
  const today = day(now);
  const repos = { ...(prev?.repos ?? {}) };
  for (const f of fetchedRepos) repos[f.meta.name] = mergeRepo(repos[f.meta.name], f, today);
  const active = new Set(fetchedRepos.map((f) => f.meta.name));
  for (const [name, r] of Object.entries(repos)) r.removed = !active.has(name) || undefined;
  return {
    schema: 1,
    owner: owner.login,
    avatar: owner.avatar_url,
    updatedAt: new Date(now).toISOString(),
    repos: Object.fromEntries(Object.entries(repos).sort(([a], [b]) => a.localeCompare(b))),
    npm: mergeNpm(prev?.npm, fetchedNpm),
  };
}

function client(token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': `${OWNER}-repo-stats`,
    Authorization: `Bearer ${token}`,
  };
  return async function gh(path, accept) {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: accept ? { ...headers, Accept: accept } : headers,
    });
    if (!res.ok) {
      const body = await res.text();
      throw Object.assign(new Error(`GET ${path} → ${res.status} ${body.slice(0, 200)}`), { status: res.status });
    }
    return { data: await res.json(), link: res.headers.get('link') ?? '' };
  };
}

// Paged lists are optional: on 401/403 or too many pages, return null and keep
// the previous value.
async function listAll(gh, path, accept) {
  const items = [];
  for (let page = 1; page <= MAX_LIST_PAGES; page++) {
    let res;
    try {
      res = await gh(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`, accept);
    } catch (e) {
      if (e.status !== 401 && e.status !== 403) throw e;
      console.log(`::warning::${path} not accessible (${e.status}); keeping previous value`);
      return null;
    }
    items.push(...res.data);
    if (!res.link.includes('rel="next"')) return items;
  }
  return null;
}

const datesOf = (items, pick) => (items ? items.map(pick).filter(Boolean).map(day).sort() : null);

async function fetchRepo(gh, full) {
  const [meta, views, clones, referrers, paths, stars, forks, releases] = await Promise.all([
    gh(`/repos/${full}`).then((r) => r.data),
    gh(`/repos/${full}/traffic/views?per=day`).then((r) => r.data),
    gh(`/repos/${full}/traffic/clones?per=day`).then((r) => r.data),
    gh(`/repos/${full}/traffic/popular/referrers`).then((r) => r.data),
    gh(`/repos/${full}/traffic/popular/paths`).then((r) => r.data),
    listAll(gh, `/repos/${full}/stargazers`, 'application/vnd.github.star+json'),
    listAll(gh, `/repos/${full}/forks?sort=oldest`),
    listAll(gh, `/repos/${full}/releases`),
  ]);
  return {
    meta, views, clones, referrers, paths,
    starDates: datesOf(stars, (s) => s.starred_at),
    forkDates: datesOf(forks, (f) => f.created_at),
    releaseDownloads: releases ? sumReleaseDownloads(releases) : null,
  };
}

export async function fetchNpm(name, repo, today) {
  const meta = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`);
  if (!meta.ok) throw new Error(`npm registry ${name} → ${meta.status}`);
  const created = day((await meta.json()).time.created);
  const floor = day(Date.parse(today) - (NPM_MAX_DAYS - 1) * 86400000);
  const start = created > floor ? created : floor;
  const res = await fetch(`https://api.npmjs.org/downloads/range/${start}:${today}/${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error(`npm downloads ${name} → ${res.status}`);
  return { name, repo, downloads: (await res.json()).downloads };
}

async function main() {
  const token = process.env.STATS_TOKEN;
  if (!token) throw new Error('STATS_TOKEN is not set');
  const gh = client(token);
  const ownerInfo = (await gh(`/users/${OWNER}`)).data;

  const repos = [];
  for (let page = 1; ; page++) {
    const { data, link } = await gh(`/users/${OWNER}/repos?type=owner&per_page=100&page=${page}`);
    repos.push(...data.filter((r) => !r.private && !r.fork));
    if (!link.includes('rel="next"')) break;
  }

  // Any failure aborts before writing: a skipped day is recovered by the next
  // run (14-day window), a half-written file is not.
  const fetched = [];
  for (const r of repos) fetched.push(await fetchRepo(gh, r.full_name));
  const today = day(Date.now());
  const npm = [];
  for (const [repo, pkgs] of Object.entries(NPM_PACKAGES)) {
    for (const p of pkgs) {
      // npm is optional: a registry hiccup or unpublished name must not cost the day's traffic.
      try {
        npm.push(await fetchNpm(p, repo, today));
      } catch (e) {
        console.log(`::warning::npm ${p} skipped: ${e.message}`);
      }
    }
  }

  let prev = null;
  try {
    prev = JSON.parse(await readFile(DATA_FILE, 'utf8'));
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  const next = mergeHistory(prev, ownerInfo, fetched, Date.now(), npm);
  await mkdir(dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(next, null, 1) + '\n');

  for (const f of fetched) {
    console.log(
      `${f.meta.name.padEnd(28)} ★${f.meta.stargazers_count} ⑂${f.meta.forks_count}` +
        ` views ${f.views.count}/${f.views.uniques} clones ${f.clones.count}/${f.clones.uniques}` +
        ` release↓${f.releaseDownloads ?? '?'}`,
    );
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
