---
layout: home

hero:
  name: OpenClaw
  text: 中文博客
  tagline: 开源 AI 助手网关 - 入门指南与使用技巧
  image:
    src: /logo.svg
    alt: OpenClaw
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看教程
      link: /tutorial/

features:
  - icon: 🦞
    title: 多平台支持
    details: 支持 WhatsApp、Telegram、Discord、飞书、钉钉等多种消息平台
  - icon: 🤖
    title: AI 助手集成
    details: 轻松接入 OpenAI、Claude、GLM 等主流 AI 模型
  - icon: 🛠️
    title: 灵活扩展
    details: 通过 Skills 和 Hooks 系统实现功能扩展
  - icon: 📚
    title: 中文文档
    details: 完整的中文文档和社区支持
---

## 快速了解

OpenClaw 是一个开源的 AI 助手网关，让你可以在各种消息平台上使用 AI 助手。

### 主要特性

- **多平台集成**：一次配置，多平台使用
- **模型灵活切换**：支持多种 AI 模型提供商
- **技能系统**：通过 Skills 扩展功能
- **记忆管理**：智能的上下文和记忆系统

### 开始使用

```bash
# 安装 OpenClaw
npm install -g openclaw

# 初始化配置
openclaw setup

# 启动服务
openclaw gateway start
```

### 社区资源

- [官方文档](https://docs.openclaw.ai)
- [GitHub 仓库](https://github.com/openclaw/openclaw)
- [中文社区](https://openclaw.aialiang.com)
