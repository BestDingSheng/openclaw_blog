# OpenClaw 入门指南

欢迎来到 OpenClaw 的世界！这篇指南将帮助你快速了解 OpenClaw 是什么，以及如何开始使用它。

## 什么是 OpenClaw？

OpenClaw 是一个开源的 AI 助手网关（Gateway），它的核心理念是：**让你在任何消息平台上都能使用 AI 助手**。

想象一下：
- 在 WhatsApp 上和 Claude 聊天
- 在 Telegram 群组里召唤 GPT-4
- 在飞书工作群中使用 AI 助手协作
- 在 Discord 服务器里部署自己的 AI 机器人

这就是 OpenClaw 能做到的事情。

## 核心概念

### 1. Gateway（网关）

Gateway 是 OpenClaw 的核心服务，它负责：
- 连接各种消息平台（WhatsApp、Telegram、Discord 等）
- 管理 AI 模型的调用（OpenAI、Anthropic、GLM 等）
- 处理消息路由和会话管理
- 提供统一的配置和管理界面

可以把 Gateway 理解为一个"翻译官"，它把消息平台的语言翻译成 AI 模型能理解的格式，再把 AI 的回复翻译回消息平台。

### 2. Agent（代理）

Agent 是你的 AI 助手实例。每个 Agent 可以有：
- 独立的系统提示词（System Prompt）
- 专属的记忆系统
- 自定义的技能（Skills）
- 特定的模型配置

你可以创建多个 Agent，比如：
- `main`：你的主要助手
- `coder`：专门写代码的助手
- `translator`：翻译助手

### 3. Skills（技能）

Skills 是 OpenClaw 的扩展系统，让 Agent 能做更多事情：
- 搜索网络（Tavily、Exa）
- 操作浏览器（BrowserWing）
- 读取文档（飞书、Notion）
- 调用 API（GitHub、天气等）

Skills 就像给 AI 装上了"手脚"，让它不只能聊天，还能真正帮你做事。

### 4. Channels（渠道）

Channels 是消息平台的连接器：
- WhatsApp
- Telegram
- Discord
- 飞书（Feishu）
- 钉钉（DingTalk）
- 企业微信（WeCom）
- Signal、iMessage 等

每个 Channel 都是独立配置的，你可以选择启用哪些平台。

## 为什么选择 OpenClaw？

### 1. 真正的隐私保护

- **本地运行**：所有数据都在你的设备上
- **自主控制**：你决定数据存储在哪里
- **开源透明**：代码完全开源，可审计

### 2. 灵活的模型选择

- 支持多家 AI 提供商
- 可以随时切换模型
- 支持本地模型（Ollama）
- 模型故障自动转移

### 3. 强大的扩展性

- Skills 系统让功能无限扩展
- Hooks 机制实现深度定制
- 支持自定义插件开发

### 4. 多平台统一体验

- 一次配置，多平台使用
- 统一的记忆和上下文管理
- 跨平台的会话同步

## 适用场景

### 个人使用

- **日常助手**：在常用的聊天软件里随时咨询 AI
- **学习伴侣**：用 AI 辅助学习、翻译、总结
- **效率工具**：自动化日常任务（提醒、搜索、记录）

### 团队协作

- **工作群助手**：在飞书/钉钉群里部署 AI 助手
- **知识管理**：自动整理和检索团队知识
- **代码审查**：在 GitHub 上自动审查 PR

### 开发者

- **API 网关**：统一管理多个 AI 模型的调用
- **原型开发**：快速测试 AI 功能
- **自动化脚本**：用 AI 辅助写代码和调试

## 系统要求

### 最低配置

- **操作系统**：macOS、Linux、Windows（WSL2）
- **Node.js**：>= 22.0.0
- **内存**：至少 2GB 可用内存
- **存储**：至少 500MB 可用空间

### 推荐配置

- **操作系统**：macOS 或 Linux
- **Node.js**：22.x LTS
- **内存**：4GB 以上
- **存储**：1GB 以上

## 下一步

现在你已经了解了 OpenClaw 的基本概念，接下来可以：

1. [快速安装](/guide/installation) - 安装 OpenClaw
2. [基础配置](/guide/configuration) - 配置你的第一个 Agent
3. [查看教程](/tutorial/) - 学习更多使用技巧

## 常见问题

### OpenClaw 是免费的吗？

是的，OpenClaw 本身是完全免费的开源软件。但你需要自己准备 AI 模型的 API Key（如 OpenAI、Anthropic 等），这些服务可能需要付费。

### 需要编程基础吗？

基础使用不需要编程基础，跟着文档配置即可。如果想开发自定义 Skills 或深度定制，需要一些 JavaScript/TypeScript 知识。

### 数据安全吗？

OpenClaw 本地运行，所有配置和记忆数据都存储在你的设备上。与 AI 模型的通信遵循各提供商的隐私政策。

### 可以商用吗？

可以，OpenClaw 使用 MIT 许可证，允许商业使用。

## 获取帮助

- **官方文档**：https://docs.openclaw.ai
- **GitHub Issues**：https://github.com/openclaw/openclaw/issues
- **中文社区**：https://openclaw.aialiang.com
- **Discord**：https://discord.com/invite/clawd

---

准备好了吗？让我们开始[安装 OpenClaw](/guide/installation)！
