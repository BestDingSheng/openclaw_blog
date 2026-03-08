# 快速安装

本指南将帮助你在 5 分钟内完成 OpenClaw 的安装。

## 前置准备

### 1. 安装 Node.js

OpenClaw 需要 Node.js 22 或更高版本。

**macOS（推荐使用 nvm）：**
```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装 Node.js 22
nvm install 22
nvm use 22
```

**Linux：**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 或使用 nvm（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
```

**Windows：**
- 下载安装包：https://nodejs.org/
- 或使用 WSL2 + Linux 方式

**验证安装：**
```bash
node --version  # 应该显示 v22.x.x
npm --version   # 应该显示 10.x.x
```

### 2. 准备 AI 模型 API Key

OpenClaw 需要至少一个 AI 模型的 API Key。推荐选项：

- **OpenAI**：https://platform.openai.com/api-keys
- **Anthropic (Claude)**：https://console.anthropic.com/
- **智谱 GLM**：https://open.bigmodel.cn/
- **Moonshot (Kimi)**：https://platform.moonshot.cn/

::: tip 提示
如果你还没有 API Key，可以先安装 OpenClaw，稍后再配置。
:::

## 安装 OpenClaw

### 方式 1：npm 全局安装（推荐）

```bash
npm install -g openclaw
```

安装完成后验证：
```bash
openclaw --version
```

### 方式 2：使用 npx（无需安装）

```bash
npx openclaw setup
```

::: warning 注意
使用 npx 方式每次都会下载最新版本，速度较慢。推荐使用全局安装。
:::

## 初始化配置

### 1. 运行设置向导

```bash
openclaw setup
```

这个命令会启动交互式配置向导，引导你完成：
- 选择 AI 模型提供商
- 配置 API Key
- 设置 Agent 名称和提示词
- 选择要启用的消息平台

### 2. 配置示例

```bash
? 选择 AI 模型提供商: OpenAI
? 输入 OpenAI API Key: sk-...
? 选择默认模型: gpt-4
? Agent 名称: main
? 系统提示词: 你是一个有帮助的 AI 助手
? 启用哪些消息平台: Telegram, Discord
```

### 3. 手动配置（可选）

如果你想手动编辑配置文件：

```bash
# 配置文件位置
~/.openclaw/config.yaml
```

示例配置：
```yaml
providers:
  openai:
    apiKey: sk-...
    baseURL: https://api.openai.com/v1

agents:
  main:
    model: gpt-4
    systemPrompt: 你是一个有帮助的 AI 助手
    
channels:
  telegram:
    enabled: true
    token: YOUR_BOT_TOKEN
```

## 启动 Gateway

配置完成后，启动 OpenClaw Gateway：

```bash
openclaw gateway start
```

你应该看到类似输出：
```
✓ Gateway started successfully
✓ Listening on http://localhost:3000
✓ Telegram bot connected
✓ Discord bot connected
```

::: tip 提示
Gateway 默认在前台运行。如果想后台运行，使用：
```bash
openclaw gateway start --daemon
```
:::

## 验证安装

### 1. 检查状态

```bash
openclaw status
```

应该显示：
```
Gateway: ✓ Running
Agents: 1 active
Channels: 2 connected
```

### 2. 测试 Agent

使用 CLI 测试：
```bash
openclaw message "你好，OpenClaw！"
```

应该收到 AI 的回复。

### 3. 访问 Web 界面

打开浏览器访问：http://localhost:3000

你会看到 OpenClaw 的控制面板。

## 常见问题

### 安装失败：权限错误

**问题：**
```
npm ERR! Error: EACCES: permission denied
```

**解决：**
```bash
# 方式 1：使用 nvm（推荐）
nvm install 22
nvm use 22
npm install -g openclaw

# 方式 2：修改 npm 全局目录
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Node.js 版本过低

**问题：**
```
Error: OpenClaw requires Node.js >= 22
```

**解决：**
```bash
# 使用 nvm 升级
nvm install 22
nvm use 22
nvm alias default 22
```

### Gateway 启动失败

**问题：**
```
Error: Port 3000 already in use
```

**解决：**
```bash
# 方式 1：停止占用端口的进程
lsof -ti:3000 | xargs kill -9

# 方式 2：使用其他端口
openclaw gateway start --port 3001
```

### API Key 无效

**问题：**
```
Error: Invalid API key
```

**解决：**
1. 检查 API Key 是否正确复制（没有多余空格）
2. 确认 API Key 有效且有余额
3. 重新配置：
```bash
openclaw configure
```

## 下一步

安装完成！接下来你可以：

1. [基础配置](/guide/configuration) - 深入了解配置选项
2. [连接消息平台](/tutorial/) - 配置 Telegram、Discord 等
3. [安装 Skills](/tutorial/) - 扩展 Agent 功能

## 更新 OpenClaw

```bash
# 更新到最新版本
npm update -g openclaw

# 查看更新日志
openclaw changelog
```

## 卸载

如果需要卸载：

```bash
# 卸载 OpenClaw
npm uninstall -g openclaw

# 删除配置文件（可选）
rm -rf ~/.openclaw
```

---

遇到问题？查看[故障排除](/guide/troubleshooting)或在 [GitHub Issues](https://github.com/openclaw/openclaw/issues) 提问。
