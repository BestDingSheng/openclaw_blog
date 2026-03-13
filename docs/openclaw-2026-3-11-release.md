# OpenClaw v2026.3.11 版本解读：安全加固与体验优化

> 发布时间：2026年3月12日

OpenClaw 最新版本 v2026.3.11 带来了重要的安全修复和大量体验优化。本次更新重点关注 WebSocket 安全、多平台消息处理、以及 ACP 运行时稳定性。

## 🔒 安全更新（重要）

### WebSocket 劫持漏洞修复

本次更新修复了一个严重的跨站 WebSocket 劫持漏洞（GHSA-5wcw-8jjv-m286）：

**问题：** 在 `trusted-proxy` 模式下，浏览器发起的 WebSocket 连接未正确验证来源，可能导致未授权的来源获得 `operator.admin` 权限。

**修复：** 现在所有浏览器发起的连接都会强制执行来源验证，无论是否存在代理头。

```javascript
// 修复前：仅在有代理头时验证
if (proxyHeaders) {
  validateOrigin(request);
}

// 修复后：所有浏览器连接都验证
if (isBrowserOrigin(request)) {
  validateOrigin(request);
}
```

### 其他安全加固

- **SecretRef 遍历保护**：拒绝跨模式的 SecretRef 遍历 ID
- **沙箱文件桥接**：防止临时写入文件逃逸到允许的挂载点之外
- **配置写入权限**：强制执行 `configWrites` 权限检查，阻止跨账户配置修改
- **会话重置鉴权**：分离对话级 `/reset` 和管理员级 `sessions.reset`，防止权限提升
- **子代理权限控制**：沙箱子代理无法通过 `session_status` 检查或修改父会话状态

## 🎯 核心功能更新

### 1. Ollama 一流支持

新增完整的 Ollama 设置流程，支持本地和云端混合模式：

```yaml
# 配置示例
providers:
  ollama:
    mode: "cloud+local"  # 或 "local"
    cloudModels:
      - "llama3.2"
      - "qwen2.5-coder"
    localModels:
      - "deepseek-r1:14b"
```

**特性：**
- 浏览器内云端登录
- 精选模型推荐
- 智能跳过不必要的本地拉取

### 2. OpenCode Go 提供商

新增 OpenCode Go 提供商，与 Zen 统一为一个 OpenCode 设置：

```bash
# 配置 OpenCode（同时支持 Zen 和 Go）
openclaw config set providers.opencode.apiKey "your-key"

# 使用 Go 模型
openclaw chat --model opencode-go
```

### 3. 多模态记忆索引

支持图像和音频的多模态索引（需 Gemini `gemini-embedding-2-preview`）：

```yaml
memory:
  extraPaths:
    - "/path/to/images"
    - "/path/to/audio"
  provider: "gemini"
  model: "gemini-embedding-2-preview"
  dimensions: 768  # 可配置输出维度
```

## 📱 平台体验优化

### iOS 改进

**主屏幕重构：**
- 新增欢迎屏幕，实时显示 Agent 概览
- 浮动控制改为停靠工具栏
- 适配小屏手机
- 聊天直接打开主会话而非合成会话

**连接恢复：**
- 前台恢复时立即重连，不再等待后续唤醒路径

### macOS 改进

**聊天 UI：**
- 新增聊天模型选择器
- 持久化思考级别选择
- 加固会话模型同步

**LaunchAgent 稳定性：**
- 修复重启时服务注销问题
- 通过分离的 launchd 助手处理自重启
- 恢复配置热重载路径

### Discord 优化

**回复分块：**
- 修复长回复意外在 17 行限制处分割的问题
- 保留 `chunkMode` 配置

**自动线程：**
- 新增 `autoArchiveDuration` 配置，支持 1 小时/1 天/3 天/1 周归档

```yaml
channels:
  discord:
    guilds:
      "your-guild-id":
        channels:
          "channel-id":
            autoThread: true
            autoArchiveDuration: "1 day"
```

### Telegram 改进

**HTML 消息处理：**
- 长 HTML 消息自动分块
- 保留纯文本回退和静默发送参数
- HTML 分块失败时切换到纯文本

**预览消息优化：**
- 修复缺失归档预览导致的重复发送
- 清理过时的保留状态

### 飞书修复

**本地图片上传：**
- 修复 `mediaLocalRoots` 未传递导致本地图片无法上传的问题

```yaml
channels:
  feishu:
    mediaLocalRoots:
      - "/Users/username/Pictures"
```

## 🤖 Agent 运行时改进

### 模型回退增强

**新增回退触发条件：**
- HTTP 499（客户端关闭连接）
- Venice `402 Insufficient USD or Diem balance`
- Poe `402 You've used up your points!`
- Gemini `MALFORMED_RESPONSE`（预览模型枚举漂移）

**冷却探测优化：**
- 限制每个提供商每次回退运行只探测一次
- 避免多模型同提供商链重复停滞

**可观测性提升：**
- 结构化回退决策事件
- 包含失败模型和提供商信息
- 关联运行 ID 便于追踪

### ACP 运行时稳定性

**会话恢复：**
- `sessions_spawn` 支持 `resumeSessionId` 参数，可恢复现有 ACPX/Codex 对话
- 修复主会话别名 `main` 的规范化问题

**工具流式传输：**
- 丰富 `tool_call` 和 `tool_call_update` 事件
- 包含文本内容和文件位置提示

**错误处理：**
- 会话恢复和提示完成在失败时优雅降级
- 强制执行有界工具位置遍历

## 🛠️ 开发者工具

### 记忆搜索改进

**Gemini 嵌入支持：**
- 支持 `gemini-embedding-2-preview`
- 可配置输出维度
- 维度变更时自动重新索引

### CLI 改进

**JSON 输出清理：**
```bash
# 现在输出干净的 JSON，无 ANSI 控制字符
openclaw skills list --json
openclaw skills info skill-name --json
```

**表格渲染：**
- Windows 传统控制台使用 ASCII 边框
- 现代终端使用 Unicode 边框
- 修复 GBK/936 控制台乱码

### 插件系统

**模型认证：**
- 暴露 `runtime.modelAuth` API
- 插件可通过正常认证管道解析 API 密钥

**钩子上下文：**
- `llm_input`、`agent_end`、`llm_output` 钩子接收完整元数据
- 包含 `trigger` 和 `channelId`

## 📊 性能与可靠性

### 记忆管理

**CLI 清理：**
- 关闭缓存的记忆搜索/索引管理器
- 防止 CLI 运行在输出完成后保持活动

### 嵌入式运行器

**压缩重试：**
- 限制压缩重试等待时间
- SIGUSR1 重启时排空嵌入式运行
- 会话通道恢复而非阻塞

### 日志改进

**结构化观测事件：**
- 生命周期和回退事件
- 清理和过滤友好
- 抑制探测警告，保留错误输出

## 🔧 配置与模式

### 严格配置验证

修复多个配置模式问题：

```yaml
# 现在正确接受这些配置
channels:
  signal:
    accountUuid: "..."
  telegram:
    actions:
      editMessage: true
      createForumTopic: true
  discord:
    guilds:
      "guild-id":
        channels:
          "channel-id":
            autoThread: true
```

### 会话重置

**模型重新计算：**
- 清除过时的运行时模型元数据
- 重置时选择当前默认值和显式覆盖

## 📚 文档改进

- **Telegram 文档**：澄清 `groups` 与 `groupAllowFrom` 的区别
- **Discord 配置**：暴露通道级 `autoThread` 类型
- **Ollama 设置**：新增完整的设置指南

## 🚀 升级建议

### 立即升级（安全原因）

如果你在使用 `trusted-proxy` 模式，强烈建议立即升级以修复 WebSocket 劫持漏洞。

### 配置迁移

**Cron 作业：**
```bash
# 运行 doctor 修复旧版 cron 存储
openclaw doctor --fix
```

**LaunchAgent（macOS）：**
```bash
# 重新安装 LaunchAgent 以修复权限
openclaw gateway stop
openclaw gateway start
```

### 破坏性变更

**Cron 隔离：**
- Cron 作业不再能通过临时 agent 发送或回退主会话摘要通知
- 使用 `openclaw doctor --fix` 迁移旧版 cron 存储

## 🎉 社区贡献

感谢以下贡献者（部分列表）：

- @ping-Toven - OpenRouter Hunter/Healer Alpha 模型
- @ngutman - iOS 主屏幕重构和 TestFlight 流程
- @ImLukeF - macOS 聊天 UI 和 OpenCode Go
- @BruceMacD - Ollama 一流支持
- @gumadeiras - 多模态记忆索引
- @davidguttman - Discord 自动线程配置
- 以及更多...

## 📖 相关资源

- [完整更新日志](https://github.com/openclaw/openclaw/releases/tag/v2026.3.11)
- [安全公告 GHSA-5wcw-8jjv-m286](https://github.com/openclaw/openclaw/security/advisories/GHSA-5wcw-8jjv-m286)
- [OpenClaw 文档](https://docs.openclaw.ai)
- [社区 Discord](https://discord.com/invite/clawd)

---

**升级命令：**

```bash
npm install -g openclaw@latest
openclaw gateway restart
```
