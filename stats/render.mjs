// Renders stats/data/history.json into SVG charts (stats/charts/) and the
// stats table between the STATS markers in the profile README.
//
//   node stats/render.mjs
//
// No dependencies; safe to run without data (writes an "awaiting first run" state).
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const DATA_FILE = join(HERE, 'data', 'history.json');
const CHART_DIR = join(HERE, 'charts');
const README = join(ROOT, 'README.md');
export const START = '<!-- STATS:START -->';
export const END = '<!-- STATS:END -->';
const OVERVIEW_DAYS = 90;
const SPARK_DAYS = 30;
// Collected but not shown in the README table (profile repo itself, placeholders).
export const HIDE = new Set(
  (process.env.STATS_HIDE ?? 'Yoy0o,blog,DIY_Cesium').split(',').map((s) => s.trim()).filter(Boolean),
);

// Validated two-series palette (light on #ffffff, dark on GitHub's #0d1117).
const STYLE = `<style>
  .t{fill:#1f2328;font:600 13px -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans SC","PingFang SC",sans-serif}
  .s{fill:#59636e;font:11px -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans SC","PingFang SC",sans-serif}
  .g{stroke:#d1d9e0;stroke-width:1}
  .v{stroke:#257de0}.vf{fill:#257de0}.c{stroke:#f47230}.cf{fill:#f47230}
  .ring{stroke:#ffffff}
  @media (prefers-color-scheme: dark){
    .t{fill:#f0f6fc}.s{fill:#9198a1}.g{stroke:#3d444d}
    .v{stroke:#338ced}.vf{fill:#338ced}.c{stroke:#e76624}.cf{fill:#e76624}
    .ring{stroke:#0d1117}
  }
</style>`;

export const day = (d) => new Date(d).toISOString().slice(0, 10);
const addDays = (d, n) => day(Date.parse(d + 'T00:00:00Z') + n * 86400000);
const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-US'));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const latest = (o = {}) => o[Object.keys(o).sort().at(-1)];

export function range(endDay, n) {
  return Array.from({ length: n }, (_, i) => addDays(endDay, i - n + 1));
}

/** Per-day totals across repos; null where no repo was observed that day. */
export function totals(repos, key, days) {
  return days.map((d) => {
    let seen = false;
    let sum = 0;
    for (const r of repos) {
      const v = r[key]?.[d];
      if (v) { seen = true; sum += v[0]; }
    }
    return seen ? sum : null;
  });
}

export function niceMax(v) {
  if (v <= 4) return 4;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

/** SVG path through non-null points; nulls break the line. */
function linePath(values, x, y) {
  let d = '';
  let pen = false;
  values.forEach((v, i) => {
    if (v == null) { pen = false; return; }
    d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
    pen = true;
  });
  return d;
}

function areaPaths(values, x, y, base) {
  const parts = [];
  let run = [];
  const flush = () => {
    if (run.length > 1) {
      const top = run.map(([i, v]) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('L');
      parts.push(`M${x(run[0][0]).toFixed(1)},${base}L${top}L${x(run.at(-1)[0]).toFixed(1)},${base}Z`);
    }
    run = [];
  };
  values.forEach((v, i) => (v == null ? flush() : run.push([i, v])));
  flush();
  return parts.join('');
}

export function overviewSvg(repos, endDay) {
  const W = 820, H = 230, L = 44, R = 92, T = 44, B = 28;
  const pw = W - L - R, ph = H - T - B;
  const firstSeen = repos.flatMap((r) => Object.keys(r.views ?? {})).sort()[0];
  if (!firstSeen) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 80" width="${W}" height="80" role="img" aria-label="等待首次采集">${STYLE}
<text class="t" x="0" y="22">个人仓库每日浏览与克隆</text>
<text class="s" x="0" y="48">等待首次采集：配置 STATS_TOKEN 后运行 Repo stats 工作流</text></svg>\n`;
  }
  let days = range(endDay, OVERVIEW_DAYS);
  if (firstSeen > days[0]) days = days.filter((d) => d >= firstSeen);
  if (days.length < 2) days = range(endDay, 2);
  const views = totals(repos, 'views', days);
  const clones = totals(repos, 'clones', days);
  const max = niceMax(Math.max(1, ...views.filter((v) => v != null), ...clones.filter((v) => v != null)));
  const x = (i) => L + (days.length === 1 ? 0 : (i / (days.length - 1)) * pw);
  const y = (v) => T + ph - (v / max) * ph;
  const base = T + ph;
  const sum = (a) => a.reduce((s, v) => s + (v ?? 0), 0);

  const grid = [0, max / 2, max]
    .map((g) => `<line class="g" x1="${L}" x2="${L + pw}" y1="${y(g)}" y2="${y(g)}"/>` +
      `<text class="s" x="${L - 8}" y="${y(g) + 4}" text-anchor="end">${fmt(g)}</text>`)
    .join('');
  const mid = Math.floor((days.length - 1) / 2);
  const xLabels = [[0, 'start'], [mid, 'middle'], [days.length - 1, 'end']]
    .map(([i, a]) => `<text class="s" x="${x(i)}" y="${H - 8}" text-anchor="${a}">${days[i].slice(5)}</text>`)
    .join('');

  // Direct end labels on the last observed point of each series, nudged apart.
  const lastIdx = (a) => a.findLastIndex((v) => v != null);
  const ends = [
    { a: views, cls: 'v', name: '浏览' },
    { a: clones, cls: 'c', name: '克隆' },
  ].map((s) => ({ ...s, i: lastIdx(s.a) })).filter((s) => s.i >= 0)
    .map((s) => ({ ...s, ly: y(s.a[s.i]) }));
  if (ends.length === 2 && Math.abs(ends[0].ly - ends[1].ly) < 14) {
    const [hi, lo] = ends[0].ly <= ends[1].ly ? ends : [ends[1], ends[0]];
    const c = (hi.ly + lo.ly) / 2;
    hi.ly = c - 7; lo.ly = c + 7;
  }
  const endMarks = ends.map((s) =>
    `<circle class="${s.cls}f ring" cx="${x(s.i)}" cy="${y(s.a[s.i])}" r="4" stroke-width="2"/>` +
    `<text class="s" x="${x(s.i) + 10}" y="${s.ly + 4}">${s.name} ${fmt(s.a[s.i])}</text>`).join('');

  const legend =
    `<rect class="vf" x="${W - 196}" y="12" width="12" height="3" rx="1.5"/><text class="s" x="${W - 178}" y="17">浏览 ${fmt(sum(views))}</text>` +
    `<rect class="cf" x="${W - 100}" y="12" width="12" height="3" rx="1.5"/><text class="s" x="${W - 82}" y="17">克隆 ${fmt(sum(clones))}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="个人仓库近 ${days.length} 天每日浏览 ${sum(views)} 次、克隆 ${sum(clones)} 次">${STYLE}
<text class="t" x="0" y="18">个人仓库每日浏览与克隆（次）</text>
<text class="s" x="0" y="34">近 ${days.length} 天 · ${days[0]} 至 ${days.at(-1)} · 断开处为未采集</text>
${legend}
${grid}
<path class="vf" opacity="0.10" d="${areaPaths(views, x, y, base)}"/>
<path class="v" fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" d="${linePath(views, x, y)}"/>
<path class="c" fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" d="${linePath(clones, x, y)}"/>
${endMarks}
${xLabels}
</svg>\n`;
}

export function sparkSvg(repo, endDay) {
  const W = 120, H = 28, P = 3;
  const days = range(endDay, SPARK_DAYS);
  const vals = days.map((d) => repo.views?.[d]?.[0] ?? null);
  const seen = vals.filter((v) => v != null);
  const head = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="近 ${SPARK_DAYS} 天浏览 ${seen.reduce((s, v) => s + v, 0)} 次">${STYLE}`;
  if (!seen.length) {
    return `${head}<line class="g" x1="${P}" x2="${W - P}" y1="${H - P}" y2="${H - P}" stroke-dasharray="3 3"/></svg>\n`;
  }
  const max = Math.max(1, ...seen);
  const x = (i) => P + (i / (days.length - 1)) * (W - 2 * P);
  const y = (v) => H - P - (v / max) * (H - 2 * P);
  const li = vals.findLastIndex((v) => v != null);
  return `${head}
<line class="g" x1="${P}" x2="${W - P}" y1="${H - P}" y2="${H - P}"/>
<path class="vf" opacity="0.12" d="${areaPaths(vals, x, y, H - P)}"/>
<path class="v" fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" d="${linePath(vals, x, y)}"/>
<circle class="vf" cx="${x(li)}" cy="${y(vals[li])}" r="2.5"/>
</svg>\n`;
}

const sumSeries = (s = {}) => Object.values(s).reduce((a, v) => a + v[0], 0);

export function repoRows(history) {
  const npmByRepo = {};
  for (const p of Object.values(history?.npm ?? {})) {
    npmByRepo[p.repo] = (npmByRepo[p.repo] ?? 0) + Object.values(p.downloads).reduce((a, n) => a + n, 0);
  }
  return Object.entries(history?.repos ?? {})
    .filter(([name, r]) => !r.removed && !HIDE.has(name))
    .map(([name, r]) => {
      const snap = latest(r.snapshots) ?? {};
      return {
        name,
        url: r.url,
        repo: r,
        stars: snap.stars ?? 0,
        forks: snap.forks ?? 0,
        views14: snap.views14 ?? [0, 0],
        clones14: snap.clones14 ?? [0, 0],
        totalViews: sumSeries(r.views),
        downloads: (snap.releaseDownloads ?? 0) + (npmByRepo[name] ?? 0),
      };
    })
    .sort((a, b) => b.views14[0] - a.views14[0] || b.stars - a.stars || a.name.localeCompare(b.name));
}

export function section(history, rows) {
  const lines = [START, '', '## 📈 个人仓库数据', '', '![个人仓库每日浏览与克隆](stats/charts/overview.svg)', ''];
  if (!rows.length) {
    lines.push('> 等待首次采集。配置好 `STATS_TOKEN` 后，数据会每天自动更新到这里。');
  } else {
    lines.push(
      '| 仓库 | ★ | ⑂ | 近 14 天浏览 | 近 14 天克隆 | 累计浏览 | 下载 | 近 30 天浏览 |',
      '| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
      ...rows.map((r) =>
        `| [${r.name}](${r.url}) | ${fmt(r.stars)} | ${fmt(r.forks)} | ${fmt(r.views14[0])} / ${fmt(r.views14[1])} | ` +
        `${fmt(r.clones14[0])} / ${fmt(r.clones14[1])} | ${fmt(r.totalViews)} | ${fmt(r.downloads)} | ` +
        `<img src="stats/charts/repo-${r.name}.svg" width="120" height="28" alt="${esc(r.name)} 近 30 天浏览趋势"> |`),
    );
    const since = rows.flatMap((r) => Object.keys(r.repo.views ?? {})).sort()[0];
    lines.push(
      '',
      `<sub>浏览 / 克隆为「次数 / 独立访客」；累计浏览自 ${since} 开始采集；下载为 Release 附件与 npm 下载合计。` +
        `每日由 GitHub Actions 自动更新 · 最近更新 ${day(history.updatedAt)}</sub>`,
    );
  }
  lines.push('', END);
  return lines.join('\n');
}

export function replaceSection(readme, body) {
  const a = readme.indexOf(START);
  const b = readme.indexOf(END);
  if (a < 0 || b < a) throw new Error(`README is missing ${START} … ${END}`);
  return readme.slice(0, a) + body + readme.slice(b + END.length);
}

async function main() {
  let history = null;
  try {
    history = JSON.parse(await readFile(DATA_FILE, 'utf8'));
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  const endDay = history ? day(history.updatedAt) : day(Date.now());
  const rows = repoRows(history);

  await mkdir(CHART_DIR, { recursive: true });
  for (const f of await readdir(CHART_DIR)) if (f.startsWith('repo-')) await rm(join(CHART_DIR, f));
  await writeFile(join(CHART_DIR, 'overview.svg'), overviewSvg(rows.map((r) => r.repo), endDay));
  for (const r of rows) await writeFile(join(CHART_DIR, `repo-${r.name}.svg`), sparkSvg(r.repo, endDay));

  const readme = await readFile(README, 'utf8');
  const next = replaceSection(readme, section(history, rows));
  if (next !== readme) await writeFile(README, next);
  console.log(`rendered ${rows.length} repos, chart end ${endDay}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
