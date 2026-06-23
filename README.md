# �️ LeongBro_IDCard · 遥感宇宙主题 NFC 名片

> 手机 NFC 触碰即达的个人数字名片 — 遥感科技风 + Three.js 3D 地球

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 🌍 **3D 地球背景** | Three.js 渲染的线框地球 + 星空 + 大气辉光，支持触摸/鼠标交互 |
| 📲 **保存联系人** | 一键下载 `.vcf` 文件，自动添加到手机通讯录 |
| 📤 **分享名片** | 支持 Web Share API，一键分享到社交平台 |
| 🪟 **玻璃拟态 UI** | 半透明磨砂卡片 + 渐变发光效果 + 遥感数据条 |
| 🔗 **社交链接** | GitHub、抖音、网易云音乐一键跳转 |
| 📱 **移动端优先** | 针对 NFC 扫描场景，完美适配手机端 |
| 💚 **微信添加** | 点击自动复制微信号并尝试跳转微信 App |
| 🎨 **动态入场动画** | 卡片逐层淡入 + 3D 地球持续旋转 |

## 🚀 快速开始

### 1. 修改个人信息

打开 [index.html](index.html)，替换以下内容为你自己的信息：

```html
<!-- 名字 -->
<h1 class="name">你的名字</h1>

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
```

### 2. 修改社交链接

在 `index.html` 的「数据链路」部分，替换各平台链接：

```html
<a href="https://github.com/你的用户名" target="_blank" class="social-item">...</a>
<a href="你的抖音分享链接" target="_blank" class="social-item">...</a>
<a href="你的网易云主页链接" target="_blank" class="social-item">...</a>
```

### 3. 修改页面标题和主题色

打开 [index.html](index.html) 修改 `<title>` 标签。

如需调整主题色，编辑 [style.css](style.css) 顶部的 CSS 变量：

```css
:root {
    --bg: #050510;            /* 深空背景色 */
    --primary: #00e5ff;       /* 青色 - 遥感主色 */
    --secondary: #3d5afe;     /* 电靛蓝 */
    --accent: #ff6d00;        /* 信号橙 */
    --surface: rgba(10, 18, 40, 0.65);  /* 玻璃表面 */
}
```

### 4. 替换头像

修改 [index.html](index.html) 中 `.avatar-text` 的文字内容：

```html
<span class="avatar-text">你的缩写</span>
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
├── index.html      # 主页面（HTML 结构 + 联系信息）
├── style.css       # 样式（遥感科技风主题）
├── main.js         # Three.js 3D 地球 + 交互逻辑
├── three.min.js    # Three.js 库文件
└── README.md       # 说明文档
```

## 🎨 设计灵感

- **主题**：遥感卫星 · 深空探索
- **配色**：深空黑底 + 青色（遥感信号）+ 电靛蓝 + 信号橙
- **特效**：线框地球、星空粒子、玻璃拟态、扫描线覆盖层、卫星遥感数据条
- **字体**：Orbitron（科幻标题）+ Noto Sans SC（中文正文）
```

## 🎨 自定义指南

### 添加新的社交平台

1. 在 [main.js](main.js) 的 `CONFIG.social` 中添加新字段
2. 在 [index.html](index.html) 的 `.social-grid` 中添加新的 `<a>` 元素
3. 如需新颜色，在 [style.css](style.css) 中添加对应的 `.social-item__icon--xxx` 样式

### 调整粒子效果

编辑 [main.js](main.js) 中 `initParticles()` 函数的参数：

| 参数 | 位置 | 说明 |
|------|------|------|
| 粒子数量 | `count` 计算行 | 公式中 `12000` 越小粒子越多 |
| 连线距离 | `drawLines()` 中 `maxDist` | 控制粒子间连线的最大距离 |
| 粒子速度 | `Particle` 类 `speedX/speedY` | 控制粒子移动速度 |
| 粒子颜色 | `Particle` 类 `draw()` 方法 | 修改 `rgba` 值 |

## 📋 浏览器兼容性

| 功能 | Chrome | Safari | Firefox | Edge |
|------|--------|--------|---------|------|
| 粒子动效 | ✅ | ✅ | ✅ | ✅ |
| vCard 下载 | ✅ | ✅ | ✅ | ✅ |
| Web Share API | ✅ | ✅ | ❌ (降级复制) | ✅ |
| Clipboard API | ✅ | ✅ | ✅ | ✅ |

## 📄 License

MIT License - 自由使用和修改。
