// node --test stats/
import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeDaily, mergeHistory, sumReleaseDownloads, windowDays } from './collect.mjs';
import { niceMax, overviewSvg, replaceSection, repoRows, section, sparkSvg, totals, START, END } from './render.mjs';

const OWNER = { login: 'u', avatar_url: 'https://avatars.example/u/1' };
const pt = (d, count, uniques) => ({ timestamp: `${d}T00:00:00Z`, count, uniques });

const fetched = (name, over = {}) => ({
  meta: {
    name,
    html_url: `https://github.com/u/${name}`,
    description: null,
    created_at: '2026-09-01T08:00:00Z',
    pushed_at: '2026-10-20T08:00:00Z',
    archived: false,
    has_pages: false,
    stargazers_count: 2,
    forks_count: 1,
    subscribers_count: 3,
    open_issues_count: 0,
  },
  views: { count: 5, uniques: 2, views: [pt('2026-10-20', 5, 2)] },
  clones: { count: 1, uniques: 1, clones: [pt('2026-10-19', 1, 1)] },
  referrers: [],
  paths: [],
  starDates: ['2026-09-02'],
  forkDates: [],
  releaseDownloads: 7,
  ...over,
});

test('windowDays covers 14 days ending today', () => {
  const w = windowDays('2026-10-21');
  assert.equal(w.length, 14);
  assert.equal(w[0], '2026-10-08');
});

test('mergeDaily keeps history outside the window and zero-fills inside', () => {
  const out = mergeDaily({ '2026-09-01': [9, 4] }, [pt('2026-10-21', 7, 3)], '2026-10-22');
  assert.deepEqual(out['2026-09-01'], [9, 4]);
  assert.deepEqual(out['2026-10-21'], [7, 3]);
  assert.deepEqual(out['2026-10-15'], [0, 0]);
  assert.equal(out['2026-09-02'], undefined);
});

test('release downloads sum assets and fall back to the previous value', () => {
  assert.equal(sumReleaseDownloads([{ assets: [{ download_count: 3 }, { download_count: 4 }] }, { assets: [] }]), 7);
  const h1 = mergeHistory(null, OWNER, [fetched('a')], Date.parse('2026-10-21T03:00:00Z'));
  assert.equal(h1.repos.a.snapshots['2026-10-21'].releaseDownloads, 7);
  const h2 = mergeHistory(h1, OWNER, [fetched('a', { releaseDownloads: null })], Date.parse('2026-10-22T03:00:00Z'));
  assert.equal(h2.repos.a.snapshots['2026-10-22'].releaseDownloads, 7);
  assert.equal(h2.owner, 'u');
});

test('removed and hidden repos stay out of the table', () => {
  const t = Date.parse('2026-10-21T03:00:00Z');
  const h = mergeHistory(null, OWNER, [fetched('a'), fetched('b'), fetched('Yoy0o')], t);
  const h2 = mergeHistory(h, OWNER, [fetched('a'), fetched('Yoy0o')], t + 86400000);
  assert.deepEqual(repoRows(h2).map((r) => r.name), ['a']);
});

test('totals are null on days no repo observed', () => {
  const repos = [{ views: { '2026-10-01': [2, 1] } }, { views: { '2026-10-01': [3, 1], '2026-10-02': [0, 0] } }];
  assert.deepEqual(totals(repos, 'views', ['2026-09-30', '2026-10-01', '2026-10-02']), [null, 5, 0]);
});

test('niceMax rounds up to 1/2/2.5/5 steps', () => {
  assert.equal(niceMax(3), 4);
  assert.equal(niceMax(17), 20);
  assert.equal(niceMax(230), 250);
  assert.equal(niceMax(510), 1000);
});

test('charts render an empty state and valid-looking SVG', () => {
  assert.match(overviewSvg([], '2026-10-21'), /等待首次采集/);
  const h = mergeHistory(null, OWNER, [fetched('a')], Date.parse('2026-10-21T03:00:00Z'));
  const svg = overviewSvg([h.repos.a], '2026-10-21');
  assert.match(svg, /^<svg[^>]+viewBox/);
  assert.match(svg, /浏览 5/);
  assert.match(sparkSvg(h.repos.a, '2026-10-21'), /<path class="v"/);
  assert.match(sparkSvg({}, '2026-10-21'), /stroke-dasharray/);
});

test('section replaces only the marked block', () => {
  const readme = `top\n${START}\nold\n${END}\nbottom\n`;
  const h = mergeHistory(null, OWNER, [fetched('a')], Date.parse('2026-10-21T03:00:00Z'));
  const out = replaceSection(readme, section(h, repoRows(h)));
  assert.ok(out.startsWith('top\n') && out.endsWith(`${END}\nbottom\n`));
  assert.match(out, /\| \[a\]\(https:\/\/github.com\/u\/a\) \| 2 \| 1 \| 5 \/ 2 \| 1 \/ 1 \| 5 \| 7 \|/);
  assert.throws(() => replaceSection('no markers', 'x'));
});
