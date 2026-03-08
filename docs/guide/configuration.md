# 基础配置

完成安装后，让我们深入了解 OpenClaw 的配置系统。

## 配置文件位置

OpenClaw 的配置文件存储在：

```bash
~/.openclaw/
├── config.yaml          # 主配置文件
├── agents/              # Agent 配置
│   └── main.yaml
├── channels/            # 渠道配置
│   ├── telegram.yaml
│   └── discord.yaml
└── workspace/           # 工作区
    ├── AGENTS.md
    ├── MEMORY.md
    └── memory/
```

## 主配置文件

`~/.openclaw/config.yaml` 是核心配置文件：

```yaml
# AI 模型提供商配置
providers:
  openai:
    apiKey: sk-...
    baseURL: https://api.openai.com/v1
    models:
      - gpt-4
      - gpt-3.5-turbo
  
  anthropic:
    apiKey: sk-ant-...
    models:
      - claude-3-5-sonnet-20241022
      - claude-3-opus-20240229

# Gateway 配置
gateway:
  port: 3000
  host: localhost
  logLevel: info

# 默认 Agent
defaultAgent: main
```

## Agent 配置

每个 Agent 都有独立的配置文件。

### 创建新 Agent

```bash
openclaw agent create coder
```

### Agent 配置示例

`~/.openclaw/agents/coder.yaml`：

```yaml
name: coder
model: gpt-4
provider: openai

systemPrompt: |
  你是一个专业的编程助手。
  - 擅长多种编程语言
  - 代码简洁高效
  - 注重最佳实践

temperature: 0.7
maxTokens: 4000

# 启用的 Skills
skills:
  - github
  - browser
  - search

# 记忆配置
memory:
  enabled: true
  maxMessages: 50
```

### 系统提示词（System Prompt）

系统提示词定义了 Agent 的"人格"和行为方式。

**好的提示词示例：**

```yaml
systemPrompt: |
  你是一个有帮助的 AI 助手，名叫 Kiro。
  
  你的特点：
  - 简洁直接，不废话
  - 实用主义，先行动后汇报
  - 像一个靠谱的技术合伙人
  
  你的能力：
  - 可以搜索网络获取最新信息
  - 可以操作浏览器
  - 可以读写文件
  
  你的原则：
  - 外部操作前先确认
  - 记住上下文，避免重复
  - 持续学习和进化
```

## 模型配置

### 选择模型

不同任务适合不同模型：

| 任务类型 | 推荐模型 | 原因 |
|---------|---------|------|
| 日常对话 | GPT-4, Claude 3.5 Sonnet | 平衡性能和成本 |
| 代码编写 | GPT-4, Claude 3.5 Sonnet | 代码能力强 |
| 快速响应 | GPT-3.5 Turbo, GLM-4 | 速度快，成本低 |
| 长文本处理 | Claude 3.5 Sonnet | 上下文窗口大 |

### 模型参数

```yaml
model: gpt-4
temperature: 0.7      # 创造性 (0-2)
maxTokens: 4000       # 最大输出长度
topP: 1.0             # 采样参数
frequencyPenalty: 0   # 重复惩罚
presencePenalty: 0    # 主题惩罚
```

**参数说明：**

- **temperature**：控制随机性
  - 0.0-0.3：精确、确定性强（适合代码、翻译）
  - 0.7-1.0：平衡（适合对话）
  - 1.5-2.0：创造性强（适合创作）

- **maxTokens**：限制输出长度
  - 建议设置合理值避免超额费用

## 渠道配置

### Telegram

```yaml
# ~/.openclaw/channels/telegram.yaml
enabled: true
token: YOUR_BOT_TOKEN
allowedUsers:
  - 123456789
  - 987654321
defaultAgent: main
```

**获取 Bot Token：**
1. 在 Telegram 搜索 @BotFather
2. 发送 `/newbot`
3. 按提示创建 Bot
4. 复制 Token

### Discord

```yaml
# ~/.openclaw/channels/discord.yaml
enabled: true
token: YOUR_BOT_TOKEN
clientId: YOUR_CLIENT_ID
guildId: YOUR_GUILD_ID
defaultAgent: main
```

### 飞书

```yaml
# ~/.openclaw/channels/feishu.yaml
enabled: true
appId: YOUR_APP_ID
appSecret: YOUR_APP_SECRET
verificationToken: YOUR_TOKEN
encryptKey: YOUR_KEY
```

## Skills 配置

Skills 扩展 Agent 的能力。

### 安装 Skill

```bash
# 搜索可用 Skills
openclaw skills search

# 安装 Skill
openclaw skills install github
openclaw skills install tavily-search
```

### 配置 Skill

某些 Skills 需要额外配置：

```yaml
# ~/.openclaw/skills/github.yaml
token: ghp_...
defaultRepo: BestDingSheng/openclaw_blog
```

### 常用 Skills

| Skill | 功能 | 配置要求 |
|-------|------|---------|
| tavily-search | 网络搜索 | Tavily API Key |
| github | GitHub 操作 | GitHub Token |
| browser | 浏览器自动化 | 无 |
| feishu-doc | 飞书文档 | 飞书 App 凭证 |

## 记忆系统

OpenClaw 的记忆系统让 Agent 能记住对话历史。

### 配置记忆

```yaml
memory:
  enabled: true
  maxMessages: 50        # 保留最近 50 条消息
  compaction: true       # 自动压缩旧消息
  persistPath: ~/.openclaw/workspace/memory
```

### 记忆文件

- `MEMORY.md`：长期记忆（手动维护）
- `memory/YYYY-MM-DD.md`：每日记录（自动生成）

## 高级配置

### 模型故障转移

当主模型不可用时自动切换：

```yaml
agents:
  main:
    model: gpt-4
    fallbackModels:
      - claude-3-5-sonnet-20241022
      - gpt-3.5-turbo
```

### 成本控制

```yaml
costControl:
  dailyLimit: 10.0      # 每日最高 $10
  warningThreshold: 8.0 # $8 时警告
  provider: openai
```

### 日志配置

```yaml
logging:
  level: info           # debug, info, warn, error
  file: ~/.openclaw/logs/gateway.log
  maxSize: 10M
  maxFiles: 5
```

## 配置管理命令

```bash
# 查看当前配置
openclaw config show

# 编辑配置
openclaw config edit

# 验证配置
openclaw config validate

# 重置配置
openclaw config reset

# 备份配置
openclaw config backup

# 恢复配置
openclaw config restore backup-2024-03-08.tar.gz
```

## 环境变量

某些配置可以通过环境变量覆盖：

```bash
# API Keys
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...

# Gateway 配置
export OPENCLAW_PORT=3000
export OPENCLAW_LOG_LEVEL=debug

# 启动
openclaw gateway start
```

## 配置最佳实践

### 1. 安全性

- ❌ 不要把 API Key 提交到 Git
- ✅ 使用环境变量或加密存储
- ✅ 定期轮换 API Key

### 2. 成本优化

- 为不同任务使用不同模型
- 设置合理的 maxTokens
- 启用成本控制和警告

### 3. 性能优化

- 启用记忆压缩
- 合理设置 maxMessages
- 使用本地模型处理简单任务

## 下一步

配置完成！接下来可以：

1. [连接消息平台](/tutorial/) - 配置 Telegram、Discord 等
2. [安装 Skills](/tutorial/) - 扩展功能
3. [自定义 Agent](/tutorial/) - 创建专属助手

---

需要帮助？查看常见问题或访问[社区论坛](https://openclaw.aialiang.com)。
