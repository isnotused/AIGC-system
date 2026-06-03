# 基于AIGC的媒体新闻稿件生成系统

一个展示AIGC新闻稿件生成系统的现代化静态网站，使用Bootstrap 5构建，包含精美的数据可视化图表。

## 🚀 项目特性

- ✨ **现代化设计** - 基于Bootstrap 5的响应式设计
- 📊 **数据可视化** - 使用Chart.js展示实体分布、素材类型、相似度分析等数据
- 🎨 **美观动画** - AOS滚动动画和CSS过渡效果
- 📱 **响应式布局** - 完美适配桌面、平板和移动设备
- 🔍 **交互功能** - 数据表格筛选、图表交互等功能

## 📁 项目结构

```
aigc-news-system/
├── index.html          # 主页面
├── assets/
│   ├── css/
│   │   ├── main.css           # 主样式文件
│   │   └── chart.css          # 图表样式文件
│   ├── js/
│   │   └── main.js            # 主交互逻辑
│   ├── data/
│   │   ├── entities.json      # 实体数据
│   │   ├── materials.json     # 素材数据
│   │   └── verification.json  # 验证数据
│   └── images/                # 图片资源
└── netlify.toml        # Netlify部署配置
```

## 🎯 页面功能

### 1. Hero区域
- 系统介绍
- 核心数据统计
- 导航按钮

### 2. 数据概览区
- 实体类型分布（饼图）
- 素材类型占比（环形图）
- 统计卡片展示

### 3. 事实验证区
- 相似度分布图（柱状图）
- 验证结果统计（饼图）
- 素材验证详情表格（支持筛选）

### 4. 系统流程区
- 四步处理流程展示
- 数据趋势图（折线图）
- 模块耗时分析图（横向柱状图）

### 5. 功能特性区
- 智能实体识别
- 多源素材整合
- 事实验证保障

## 🛠️ 技术栈

- **HTML5** - 页面结构
- **Bootstrap 5.3** - UI框架
- **Chart.js 4.4** - 数据可视化
- **AOS 2.3** - 滚动动画
- **FontAwesome 6.5** - 图标库
- **Vanilla JavaScript** - 交互逻辑

## 📦 本地运行

1. 克隆或下载项目
2. 直接用浏览器打开 `index.html`
3. 或使用本地服务器：

```bash
# 使用Python
python -m http.server 8000

# 使用Node.js (http-server)
npx http-server -p 8000

# 使用PHP
php -S localhost:8000
```
然后访问 http://localhost:8000/index.html 即可查看页面。

## 🌐 部署到Netlify

### 方法一：拖拽部署（推荐）

1. 访问 [Netlify](https://app.netlify.com/)
2. 登录或注册账号
3. 进入 "Sites" 页面
4. 将 `aigc-news-system` 文件夹直接拖拽到页面中
5. 等待部署完成，获得预览链接

### 方法二：Git部署

1. 将项目推送到GitHub
2. 在Netlify中选择 "New site from Git"
3. 选择你的GitHub仓库
4. 配置构建设置：
   - Build directory: `aigc-news-system`
   - Build command: 留空（静态网站无需构建）
5. 点击 "Deploy site"

### 方法三：Netlify CLI

```bash
# 安装Netlify CLI
npm install -g netlify-cli

# 登录Netlify
netlify login

# 部署
cd aigc-news-system
netlify deploy --prod
```

## ⚙️ 自定义配置

### 修改数据

编辑 `assets/data/` 目录下的JSON文件：
- `entities.json` - 实体类型数据
- `materials.json` - 素材类型数据
- `verification.json` - 验证数据

### 修改样式

编辑 `assets/css/main.css` 文件，修改CSS变量：

```css
:root {
  --primary-color: #6366f1;
  --primary-dark: #4f46e5;
  --primary-light: #818cf8;
  /* ... 其他颜色变量 */
}
```

## 📊 数据统计

根据当前数据：
- 核心实体：7个
- 素材数量：88个（新闻文本67%、统计数据24%、知识条目9%）
- 验证通过：38个
- 有冲突但保留：7个

## 🤝 贡献

欢迎提交问题建议和改进！

## 📄 许可

MIT License

---

**项目地址**: [Netlify预览链接] (部署后更新)
**联系邮箱**: your-email@example.com