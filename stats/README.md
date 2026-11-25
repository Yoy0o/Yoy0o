# Repo stats

个人账号 Yoy0o 下公开仓库（不含 fork）的流量、增长与下载数据，每天自动采集，并渲染到主页 README 的「📈 个人仓库数据」一节。
数据格式与 [GeoVerseLabs/.github/stats](https://github.com/GeoVerseLabs/.github/tree/main/stats) 一致，另外加了 Release 附件下载数。

- 数据：[`data/history.json`](data/history.json)，由 [Repo stats](../.github/workflows/repo-stats.yml) 工作流每天 02:43 UTC（北京时间 10:43）追加
- 采集：[`collect.mjs`](collect.mjs)；渲染：[`render.mjs`](render.mjs)（Node ≥ 20，无依赖）；测试：`node --test stats/stats.test.mjs`
- 图表：[`charts/`](charts)，`overview.svg` 是全部展示仓库的每日浏览 / 克隆合计（近 90 天），`repo-*.svg` 是各仓库近 30 天浏览走势；跟随 GitHub 浅色 / 深色主题

GitHub 的浏览 / 克隆数据只保留 14 天，历史从第一次采集开始累积；中断不超过 14 天的，下一次成功运行会自动补齐。

## 配置

1. 创建一个 fine-grained personal access token（Settings → Developer settings → Fine-grained tokens）：
   - Resource owner 选 **Yoy0o**；
   - Repository access 选 **All repositories** 或 **Only select repositories**，不要选「Public repositories」（只读，带不了下面的权限，流量接口会返回 403）；
   - Repository permissions → **Administration: Read-only**（Metadata: Read-only 会自动带上）。

   也可以用 classic token，勾选 `public_repo`。
2. 在本仓库 Settings → Secrets and variables → Actions 新建 secret，名称 `STATS_TOKEN`。
3. 到 Actions → Repo stats → Run workflow 手动运行一次，生成首批数据。

token 到期后工作流会报 `401`，换新 token 更新 secret 即可。

## 调整

- 不在表格里展示的仓库：`render.mjs` 里的 `HIDE`（默认隐藏本主页仓库、`blog`、`DIY_Cesium`，数据照常采集），也可以用环境变量 `STATS_HIDE` 覆盖
- 统计 npm 下载：在 `collect.mjs` 的 `NPM_PACKAGES` 里写上 `仓库名: [包名]`

## 数据格式

```text
repos.<name>.views / clones   { "YYYY-MM-DD": [count, uniques] }  有 key = 当天已采集
repos.<name>.snapshots        { "YYYY-MM-DD": { stars, forks, watchers, openIssues, views14, clones14, releaseDownloads } }
repos.<name>.starDates        各 stargazer 的 star 日期（无权限时保留上次结果）
repos.<name>.forkDates        各 fork 的创建日期
repos.<name>.referrers/paths  最近 14 天来源 / 热门页面合计
npm.<package>.downloads       { "YYYY-MM-DD": n }
```
