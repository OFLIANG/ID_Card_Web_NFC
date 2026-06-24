# LeongBro_IDCard · 遥感宇宙主题 NFC 名片

> 手机 NFC 触碰即达的个人数字名片 — 遥感科技风 + Three.js 3D 地球 + 流星粒子 + 自适应缩放 

---

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 🌍 **3D 地球背景** | Three.js 渲染的线框地球 + 星空 + 大气辉光，支持触摸/鼠标交互旋转 |
| 🗺️ **国家边界线** | 从 CDN 动态加载 Natural Earth TopoJSON，在地球上绘制全球国家边界轮廓 |
| 🇨🇳 **中国增强** | 中国国界线高亮（50m 高精度）+ 省级行政边界 |
| 📍 **定位标记** | 浏览器 Geolocation 定位当前位置，橙色星形标记 + 脉冲雷达圈 + 信标射线 |
| 🛰️ **卫星环绕** | 7 颗卫星均匀分布在不同轨道平面环绕地球运行 |
| ☄️ **流星粒子效果** | 鼠标/触碰轨迹产生流星尾迹粒子，背景有持续的流星划过 |
| 📲 **保存联系人** | 一键下载 `.vcf` 文件，自动添加到手机通讯录 |
| 📤 **分享名片** | 支持 Web Share API，一键分享到社交平台 |
| 🌐 **中英文切换** | 一键切换中英文界面，偏好自动保存至 localStorage |
| 📳 **触觉反馈** | 手机端支持震动反馈（点击、滚动、保存成功三种模式） |
| 🪟 **玻璃拟态 UI** | 半透明磨砂卡片 + 渐变发光效果 + 遥感数据条 |
| 🔗 **社交链接** | GitHub、抖音、网易云音乐、网球助教 四列网格一键跳转 |
| 📱 **移动端优先** | 针对 NFC 扫描场景，完美适配手机端 |
| 💚 **微信添加** | 点击弹出微信弹窗，含二维码 + 一键复制微信号 + 跳转微信 App |
| 🎾 **网球助教** | 海报展示 + 课程信息 + 二维码 + 一键拨号/微信咨询 |
| 🎨 **动态入场动画** | 卡片逐层淡入 + 扫描线覆盖层 |
| 🔍 **自由缩放** | 悬浮按钮 +/− 缩放、双指捏合缩放、Ctrl+滚轮缩放，缩放偏好自动记忆 |
| 💧 **透明度调节** | 悬浮菜单滑块控制信息卡片透明度（0%~100%），0% 时仅显示背景地球 |
| 📐 **屏幕自适应** | 自动检测设备屏幕尺寸，小屏自动缩放适配 |
| 🛰️ **智能相机** | Three.js 相机根据屏幕宽高比动态调整，确保地球在任意设备上完整可见 |
| 📊 **遥感数据条** | 顶部仿真卫星状态栏（卫星编号、高度、状态）+ 语言切换 |

## 🚀 快速开始

### 1. 修改个人信息

打开 [index.html](index.html)，替换以下内容为你自己的信息：

```html
<!-- 名字 -->
<h1 class="name-cn">你的名字</h1>
<h2 class="name-en">Your Name</h2>

<!-- 电话 -->
<a href="tel:你的电话" class="contact-item">
    <span class="item-value">你的电话</span>
</a>

<!-- 邮箱 -->
<a href="mailto:你的邮箱" class="contact-item">
    <span class="item-value">你的邮箱</span>
</a>

<!-- 微信 ID -->
<span class="wechat-id-value" id="wechatIdText">你的微信ID</span>

<!-- 头像缩写 -->
<span class="avatar-text">你的缩写</span>
```

### 2. 修改社交链接

在 [index.html](index.html) 的「数据链路」部分，替换各平台链接：

```html
<a href="https://github.com/你的用户名" target="_blank" class="social-item">
    <i class="fab fa-github"></i>
    <span>GitHub</span>
</a>
<a href="你的抖音分享链接" target="_blank" class="social-item">
    <i class="fab fa-tiktok"></i>
    <span>抖音</span>
</a>
<a href="你的网易云主页链接" target="_blank" class="social-item">
    <i class="fa-solid fa-compact-disc"></i>
    <span>网易云音乐</span>
</a>
```

### 3. 修改中英文文案

在 [main.js](main.js) 中找到 `translations` 对象，修改中文（`zh`）和英文（`en`）对应的文字：

```js
var translations = {
    zh: {
        'subtitle': '遥感 · 连接',
        'section-contact': '通信频道',
        'section-data': '数据链路',
        // ... 更多文案
    },
    en: {
        'subtitle': 'REMOTE SENSING · CONNECT',
        'section-contact': 'CONTACT',
        'section-data': 'DATA LINKS',
        // ...
    }
};
```

### 4. 修改页面标题和主题色

打开 [index.html](index.html) 修改 `<title>` 标签。

如需调整主题色，编辑 [style.css](style.css) 顶部的 CSS 变量：

```css
:root {
    --bg: #050510;            /* 深空背景色 */
    --primary: #00e5ff;       /* 青色 - 遥感主色 */
    --secondary: #3d5afe;     /* 电靛蓝 */
    --accent: #ff6d00;        /* 信号橙 */
    --surface: rgba(10, 18, 40, 0.65);  /* 玻璃表面（半透明，需 backdrop-filter 配合） */
    --surface-border: rgba(0, 229, 255, 0.12);
    --text: #c8d6e5;          /* 冷灰色 */
    --text-dim: #6b7d94;      /* 暗灰色 */
    --glow: #00e5ff;          /* 发光色 */
}
```

## 📦 部署

本项目是纯静态网站（HTML + CSS + JS + Three.js），无需任何构建工具。

### 方式一：GitHub Pages（推荐）

```bash
git init
git add .
git commit -m "初始化 NFC 名片"
git remote add origin https://github.com/yourname/nfc-card.git
git push -u origin main
```

然后在 GitHub 仓库 Settings → Pages → Source 选择 `main` 分支即可。

访问地址：`https://yourname.github.io/nfc-card/`

### 方式二：Netlify / Vercel

直接拖拽项目文件夹到 [Netlify Drop](https://app.netlify.com/drop) 或 [Vercel](https://vercel.com) 即可部署。

### 方式三：NFC 写入

部署完成后，使用 NFC 工具 App（如 `NFC Tools`）将部署后的 URL 写入你的 NFC 芯片。

写入类型选择 **URL / URI**，粘贴你的网站地址即可。

## 📁 项目结构

```
ID_Card_Web_NFC/
├── index.html      # 主页面（HTML 结构 + 联系信息 + 微信弹窗 + 网球助教弹窗）
├── style.css       # 样式（遥感科技风主题 + 玻璃拟态 + 动画 + 透明度控制）
├── main.js         # 交互逻辑（Three.js 地球 + 卫星 + 粒子 + 边界 + i18n + 缩放 + 自适应）
├── three.min.js    # Three.js 库文件
├── img/            # 图片资源（网球助教海报、微信二维码等）
└── README.md       # 说明文档
```

## 🏗️ 技术架构

### 模块划分

| 模块 | 文件位置 | 说明 |
|------|----------|------|
| **Part A** | `main.js` Part A | Three.js 3D 地球场景（线框地球、大气辉光、星空、数据点、国家边界、中国增强、定位标记、卫星轨道与卫星） |
| **Part B** | `main.js` Part B | 2D 叠加层（扫描线、轨道环） |
| **Part C** | `main.js` Part C | 流星粒子系统（鼠标轨迹 + 背景流星） |
| **Part D** | `main.js` Part D | 交互功能（vCard 下载、分享、微信弹窗、剪贴板） |
| **Part E** | `main.js` Part E | 中英文切换 + 触觉反馈 |
| **Part F** | `main.js` Part F | UI 缩放控制 + 透明度控制 + 屏幕自适应 |

### 3D 地球组件

| 组件 | 说明 |
|------|------|
| **线框球体** | `SphereGeometry(2.0, 48, 32)`，青色经纬网格 + 内部发光实体球 |
| **大气辉光** | Fresnel Shader 实现，`SphereGeometry(2.2)` 外壳，边缘发光效果 |
| **星空粒子** | 3000 颗随机分布的发光粒子，`AdditiveBlending` 混合 |
| **国家边界** | CDN 加载 Natural Earth 110m TopoJSON，`topojson-client` 转换后绘制 |
| **中国增强** | 50m 高精度国界（双层发光）+ 省级行政边界 |
| **定位标记** | Geolocation API → 橙色星形 + 脉冲环 + 信标射线，失败回退到北京 |
| **数据点** | 7 个城市坐标标记（北京、上海、广州、香港、东京、首尔、新加坡） |
| **卫星系统** | 7 颗卫星，6 个均匀倾角轨道 + 1 随机补充，高度 500-900km |

### 关键参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| 相机 FOV | 视场角，控制场景可见范围 | `50°` |
| `satMaxRadius` | 卫星轨道最大半径（含边距），用于相机自适应 | `3.4` |
| 地球半径 | 线框球体半径 | `2.0` |
| `ZOOM_MIN` / `ZOOM_MAX` | 缩放范围 | `0.3` ~ `5.0` |
| `ZOOM_STEP` | 按钮缩放步进 | `0.15` (15%) |
| 透明度范围 | 卡片透明度可调范围 | `0%` ~ `100%` |
| 自适应阈值 | 触发自动缩放的屏幕最小边宽度 | `≤ 390px` |
| `METEOR_BODY` | 流星主体颜色 | `#FF9933` |
| `SPARK_FRICTION` | 粒子摩擦力，控制拖尾长度 | `0.98` |
| `SPARK_GRAVITY` | 粒子重力，控制下落速度 | `0.1` |

## 🎨 设计灵感

- **主题**：遥感卫星 · 深空探索
- **配色**：深空黑底 + 青色（遥感信号）+ 电靛蓝 + 信号橙
- **特效**：线框地球、国家边界、大气层辉光、星空粒子、流星尾迹、卫星环绕、玻璃拟态、扫描线、遥感数据条
- **字体**：Orbitron（科幻标题）+ Noto Sans SC（中文正文）
- **图标**：Font Awesome 6.5 + 自定义 SVG（网球）

## 🎨 自定义指南

### 添加新的社交平台

1. 在 [index.html](index.html) 的 `.social-grid` 中添加新的 `<a>` 元素
2. 图标使用 [Font Awesome](https://fontawesome.com/) 的 class（如 `fab fa-twitter`）
3. 建议保持 4 列排列，如需更多可调整 CSS 中 `grid-template-columns`

### 添加自定义 SVG 图标

对于没有 Font Awesome 覆盖的平台，可以使用 SVG 图标。示例（网球图标）：

```html
<a href="javascript:void(0)" class="social-item" id="tennisLink">
    <svg class="tennis-svg-icon" viewBox="0 0 24 24" width="22" height="22">
        <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
        <path d="M12 1.5C12 1.5 7.5 7.5 7.5 12s4.5 10.5 4.5 10.5" fill="none" stroke="currentColor" stroke-width="1.1"/>
        <path d="M12 1.5C12 1.5 16.5 7.5 16.5 12s-4.5 10.5-4.5 10.5" fill="none" stroke="currentColor" stroke-width="1.1"/>
    </svg>
    <span>网球助教</span>
</a>
```

使用 `currentColor` 可让 SVG 颜色随 CSS 变量 `--primary` 自动变化，与 FA 图标保持统一色调。

### 调整透明度控制

编辑 [main.js](main.js) 中 `applyCardOpacity` 函数可修改默认透明度范围：

```js
function applyCardOpacity(val) {
    cardOpacity = Math.max(0, Math.min(100, Math.round(val)));
    // 0% = 完全透明（仅显示背景地球）
    // 100% = 完全不透明
}
```

如需调整透明度滑轨长度，编辑 [style.css](style.css) 中 `.fab-opacity-palette` 的 `width` 值（默认 200px）。

### 调整流星粒子效果

编辑 [main.js](main.js) 中流星粒子模块的参数：

| 参数 | 说明 |
|------|------|
| `METEOR_BODY` / `METEOR_TAIL` | 流星颜色渐变（主体 → 尾部） |
| `METEOR_ION` | 电离尾迹的蓝色调 |
| `SPARK_FRICTION` | 粒子摩擦力，控制拖尾长度 |
| `SPARK_GRAVITY` | 粒子重力，控制下落速度 |
| `SPARK_LIFE` | 粒子生命周期（帧数） |

### 调整震动反馈

编辑 [main.js](main.js) 中 `hapticFeedback` 函数的振动时长：

```js
case 'tap':    navigator.vibrate(10);   break;  // 轻触
case 'scroll': navigator.vibrate(5);    break;  // 滚动
case 'success':navigator.vibrate([15, 50, 15]); break;  // 成功
```

### 调整屏幕自适应阈值

编辑 [main.js](main.js) 中 `autoAdaptScale()` 函数：

```js
if (minDim <= 320) targetScale = 0.78;      // 非常小的屏幕
else if (minDim <= 360) targetScale = 0.88;  // 小屏手机
else if (minDim <= 390) targetScale = 0.95;  // 中等屏幕
else targetScale = 1.0;                       // 标准及以上
```
