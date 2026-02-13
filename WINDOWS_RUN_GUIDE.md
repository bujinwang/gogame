# Windows 从源码运行指南

## 环境要求

- Windows 10 或更高版本
- Node.js 18.x 或更高版本

## 安装步骤

### 1. 安装 Node.js

1. 访问 https://nodejs.org
2. 下载 LTS（长期支持）版本
3. 运行安装程序，使用默认设置即可
4. 安装完成后，**重启电脑**（或至少重启VS Code）让环境变量生效

### 2. 验证 Node.js 安装

打开命令提示符或PowerShell，输入：

```bash
node --version
npm --version
```

如果显示版本号，说明安装成功。

### 3. 在 VS Code 中打开项目

1. 打开 VS Code
2. 点击 "文件" → "打开文件夹"
3. 选择 gogame 项目目录

### 4. 安装项目依赖

在 VS Code 中打开终端：
- 点击 "终端" → "新建终端"
- 或按快捷键 `Ctrl + `` （反引号）

在终端中执行：

```bash
npm install
```

等待安装完成（可能需要几分钟）。

### 5. 运行项目

在终端中执行：

```bash
npm start
```

或使用开发模式（带开发者工具）：

```bash
npm run dev
```

## 常见问题

### 问题1：'npm' 不是内部或外部命令

**解决方案：**
- 确认 Node.js 已正确安装
- 重启 VS Code 或重启电脑
- 如果仍然不行，手动添加 Node.js 到系统环境变量 PATH

### 问题2：npm install 报错

**解决方案：**
- 尝试清除 npm 缓存：`npm cache clean --force`
- 删除 `node_modules` 文件夹后重新运行 `npm install`
- 以管理员身份运行 VS Code

### 问题3：运行后看不到窗口

**解决方案：**
- 检查任务栏是否有 Electron 图标
- 按 `Alt+Tab` 切换窗口
- 检查终端是否有错误信息

### 问题4：端口被占用

如果提示端口被占用，可以在代码中修改端口号，或关闭占用端口的程序。

## 项目结构说明

```
gogame/
├── main.js              # Electron 主进程
├── preload.js           # 预加载脚本
├── package.json         # 项目配置
├── src/
│   ├── main/            # 主进程代码
│   │   ├── game/        # 游戏逻辑
│   │   ├── ai/          # AI 玩家
│   │   └── webrtc/      # 网络通信
│   └── renderer/        # 渲染进程（界面）
│       ├── index.html   # 主页面
│       ├── js/          # JavaScript
│       └── styles/      # 样式
└── dist/                # 打包输出目录
```

## 联系支持

如有其他问题，请联系：bujin@sanyachess.studio
