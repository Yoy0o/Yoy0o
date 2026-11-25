<h1 align="center">Hi, I'm Yoy0o 👋</h1>

<p align="center">
  <b>GIS 开发者 · <a href="https://github.com/GeoVerseLabs">GeoVerse Labs</a> 主理人</b><br/>
  WebGIS · 空间计算 · 数字孪生 · AI Agent
</p>

<p align="center">
  <a href="https://geoverselabs.github.io/.github/"><img src="https://img.shields.io/badge/GeoVerse%20Labs-website-1f6feb?style=flat-square&logo=githubpages&logoColor=white" /></a>
  <a href="https://github.com/GeoVerseLabs"><img src="https://img.shields.io/badge/GeoVerseLabs-org-24292f?style=flat-square&logo=github" /></a>
  <a href="https://www.npmjs.com/org/geoverse"><img src="https://img.shields.io/badge/npm-@geoverse-cb3837?style=flat-square&logo=npm" /></a>
</p>

---

## 👨‍💻 关于我

- 🌍 做了多年 WebGIS，从 OpenLayers / Cesium 起步，现在主要做**空间应用的基础工具链**：几何存储、切片服务、地图渲染与编辑、空间计算
- 🧭 特别关注**国内坐标系**的问题（WGS84 / GCJ-02 / BD-09 / CGCS2000），希望坐标在边界上始终是 WGS-84，纠偏都留在引擎内部完成
- 🏭 在做**数字孪生**：仓储三维可视化、仓储仿真、室内路径与场景浏览
- 🤖 在做 **AI Agent 工程化**：让 Agent 安全地调度现有的业务 Web 系统
- 🛠️ 偏好能落地的方案：轻改造、易部署、性能数据能复现

---

## 🌐 GeoVerse Labs

> 面向现代 Web 的空间应用工具链，针对中国坐标系做了专门适配。每一层都能单独使用，组合起来能把空间应用从数据库一路送到浏览器，再交给 AI。
> → [官网](https://geoverselabs.github.io/.github/) · [52 秒介绍片](https://geoverselabs.github.io/.github/film/)

**产品**

| | 简介 |
| --- | --- |
| [GeoVerse SDK](https://geoverse-7yh.pages.dev/) | 基于 OpenLayers / MapLibre GL 的统一地图 API，在引擎内完成国内底图纠偏，自带编辑引擎，并提供 Vue / React 绑定 |
| [GeoVerse Live](https://geoverselabs.github.io/.github/live/) | 基于 SDK 的协同地理数据编辑平台：版本历史、专题制图、实时协同、AI 助手 |

**开源项目**

| 仓库 | 简介 | 技术 |
| --- | --- | --- |
| [geoverse-precise](https://github.com/GeoVerseLabs/geoverse-precise) | 椭球精度的浏览器端空间分析库，可直接替换 turf.js（覆盖全部 184 个导出），支持 CGCS2000 / GCJ-02 / BD-09 · [在线演示](https://geoverselabs.github.io/geoverse-precise/) | Rust · WASM |
| [geoverse-line-finder](https://github.com/GeoVerseLabs/geoverse-line-finder) | 零依赖的 GeoJSON 路网路径规划库，支持 A\* / Dijkstra / ALT 和多楼层室内路径 · [Playground](https://geoverselabs.github.io/geoverse-line-finder/) | TypeScript |
| [geoverse-map-server](https://github.com/GeoVerseLabs/geoverse-map-server) | 单个 Go 二进制，把 PostGIS / MySQL / PMTiles / GeoJSON 等数据发布为 MVT、WMTS、OGC API 和 MCP 服务 | Go |
| [geoverse-cn-coding](https://github.com/GeoVerseLabs/geoverse-cn-coding) | 轻量的中国地址编码服务，提供地址解析、正向 / 逆地理编码和坐标转换，只需一个进程加一个 SQLite 文件 | Python · SQLite |
| [geoverse-sar](https://github.com/GeoVerseLabs/geoverse-sar) | AI 原生的空间应用运行时，UI、工具调用、Agent 与 MCP 共用同一个受管控的内核（技术预览） | TypeScript |
| [mybatis-plus-geometry](https://github.com/GeoVerseLabs/mybatis-plus-geometry) | 打通 MyBatis Plus 与 JTS 几何类型的 Spring Boot Starter（MySQL / PostGIS） | Java |
| [geoverse-skills](https://github.com/GeoVerseLabs/geoverse-skills) | 面向 AI Agent 的空间技能，用来生成货架、库位、展位等确定性区域布局，附带 MCP App | TypeScript · MCP |

---

## 🧪 个人项目

| 仓库 | 简介 |
| --- | --- |
| [Baton](https://github.com/Yoy0o/Baton) | 多系统编排台：一个通用 Agent 通过能力网关调度多个 GIS 类 Web 系统。后端零改动接入，写操作先预览再确认，全程留审计 |
| [geoverse-agent-hub](https://github.com/Yoy0o/geoverse-agent-hub) | 自托管的 Agent 工作台，让各家 coding agent 自动上报任务状态、交付回执和成本；可以单容器部署，也可以部署到 Cloudflare |
| [webProj](https://github.com/Yoy0o/webProj) | 早期作品：在 OpenLayers 中扩展定义常见网络地图投影 |

**参与贡献**

- [pp129/vue-openlayers-map](https://github.com/pp129/vue-openlayers-map)：基于 OpenLayers 的 Vue 地图组件库

**也在探索**

- 🏬 Web 3D 仓库可视化：配置化生成货架 / 地堆，从 CAD 图纸还原库位
- 📦 货到人（RMFS）仓储仿真：支持多层楼面 + 提升机
- 🏔️ 在地图上框选区域，加载 Google 3D Tiles 生成小范围三维场景
- 📡 Web3D 画面推流：WebRTC / WHIP 直推，支持交互回传

---

<!-- STATS:START -->

## 📈 个人仓库数据

![个人仓库每日浏览与克隆](stats/charts/overview.svg)

| 仓库 | ★ | ⑂ | 近 14 天浏览 | 近 14 天克隆 | 累计浏览 | 下载 | 近 30 天浏览 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| [TerraView](https://github.com/Yoy0o/TerraView) | 0 | 0 | 36 / 1 | 44 / 3 | 36 | 1 | <img src="stats/charts/repo-TerraView.svg" width="120" height="28" alt="TerraView 近 30 天浏览趋势"> |
| [hydrosim-web](https://github.com/Yoy0o/hydrosim-web) | 0 | 0 | 32 / 9 | 70 / 38 | 32 | 0 | <img src="stats/charts/repo-hydrosim-web.svg" width="120" height="28" alt="hydrosim-web 近 30 天浏览趋势"> |
| [Baton](https://github.com/Yoy0o/Baton) | 0 | 0 | 20 / 1 | 70 / 31 | 20 | 0 | <img src="stats/charts/repo-Baton.svg" width="120" height="28" alt="Baton 近 30 天浏览趋势"> |
| [geoverse-agent-hub](https://github.com/Yoy0o/geoverse-agent-hub) | 0 | 0 | 3 / 1 | 21 / 18 | 3 | 0 | <img src="stats/charts/repo-geoverse-agent-hub.svg" width="120" height="28" alt="geoverse-agent-hub 近 30 天浏览趋势"> |
| [webProj](https://github.com/Yoy0o/webProj) | 0 | 0 | 1 / 1 | 3 / 2 | 1 | 0 | <img src="stats/charts/repo-webProj.svg" width="120" height="28" alt="webProj 近 30 天浏览趋势"> |

<sub>浏览 / 克隆为「次数 / 独立访客」；累计浏览自 2026-11-10 开始采集；下载为 Release 附件与 npm 下载合计。每日由 GitHub Actions 自动更新 · 最近更新 2026-11-25</sub>

<!-- STATS:END -->

---

## 🧰 技术栈

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-000000?style=flat-square&logo=rust&logoColor=white)
![WebAssembly](https://img.shields.io/badge/WebAssembly-654FF0?style=flat-square&logo=webassembly&logoColor=white)
![Go](https://img.shields.io/badge/Go-00ADD8?style=flat-square&logo=go&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![Java](https://img.shields.io/badge/Java-ED8B00?style=flat-square&logo=openjdk&logoColor=white)

![OpenLayers](https://img.shields.io/badge/OpenLayers-1F6B75?style=flat-square&logo=openlayers&logoColor=white)
![MapLibre](https://img.shields.io/badge/MapLibre%20GL-396CB2?style=flat-square&logo=maplibre&logoColor=white)
![Cesium](https://img.shields.io/badge/Cesium-6CADDF?style=flat-square&logo=cesium&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=flat-square&logo=threedotjs&logoColor=white)
![PostGIS](https://img.shields.io/badge/PostGIS-336791?style=flat-square&logo=postgresql&logoColor=white)
![GeoJSON](https://img.shields.io/badge/GeoJSON-2E7D32?style=flat-square)

![Vue](https://img.shields.io/badge/Vue-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=flat-square&logo=cloudflare&logoColor=white)
![MCP](https://img.shields.io/badge/MCP-000000?style=flat-square)

---

## 📊 GitHub 统计

<p align="center">
  <img height="160" src="https://github-readme-stats.vercel.app/api?username=Yoy0o&show_icons=true&hide_border=true&count_private=true" />
  <img height="160" src="https://github-readme-stats.vercel.app/api/top-langs/?username=Yoy0o&layout=compact&hide_border=true" />
</p>

---

## 📫 联系

- 联系人：Yoy0o
- 邮箱：[hio250@163.com](mailto:hio250@163.com)
- 问题与贡献：请到对应仓库提 issue

<p align="center"><sub>Mapping infrastructure for the modern web.</sub></p>
