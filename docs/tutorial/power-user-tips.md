---
title: OpenClaw 进阶技巧：30个实战经验
description: 从配置基础到成本优化，这些技巧能让你的 OpenClaw 效率提升10倍
---

# OpenClaw 进阶技巧：30个实战经验

大多数人安装 OpenClaw 后，跑起来一个 agent 就觉得完成了。确实能用，但"能用"和"用得好"是两回事。这些技巧来自生产环境的实战经验，能帮你避开常见的坑，降低 API 成本，让 sub-agent 真正按你的意图工作。

## 配置基础（技巧 1-8）

### 1. AGENTS.md vs SOUL.md：sub-agent 到底看什么

OpenClaw 的文件加载有三层优先级：

```
~/.openclaw/SOUL.md   ← 全局配置
./SOUL.md             ← 项目配置
AGENTS.md + TOOLS.md  ← 会话配置（sub-agent 能看到的）
```

**关键点：sub-agent 只能看到 `AGENTS.md` 和 `TOOLS.md`**

其他文件（`SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`）对 sub-agent 完全不可见。

很多人把路由逻辑写在 `SOUL.md` 里，然后花一小时调试为什么 sub-agent 不按规则路由。答案很简单：它根本看不到那些规则。

正确做法：

```markdown
# AGENTS.md

## 路由规则
- 财务问题 → finance-agent
- 代码审查 → code-reviewer  
- 研究任务 → research-storm
```

记住：sub-agent 需要知道的东西，必须写在 `AGENTS.md` 里。

### 2. 模型字符串必须带 provider 前缀

```json
{ "model": "claude-opus-4-6" }              // ❌ 会报错
{ "model": "anthropic/claude-opus-4-6" }    // ✅ 正确
```

格式是 `provider/model-name`。没有前缀时，模型路由器可能静默失败。

2026年2月常用模型：

| 模型 | 适用场景 |
|------|---------|
| `anthropic/claude-opus-4-6` | 需要深度推理的任务 |
| `anthropic/claude-sonnet-4-6` | 日常使用，接近 Opus 质量但便宜很多 |
| `anthropic/claude-haiku-4-5` | 执行类任务，速度优先 |
| `google/gemini-3.1-pro-preview` | 长文档、多模态输入 |
| `openai/gpt-4o-mini` | 摘要、分类、格式转换 |
| `ollama/qwen2.5` | 不能联网的场景 |

设置 sub-agent 的默认模型：

```json
{
  "agents": {
    "defaults": {
      "subagents": {
        "model": "anthropic/claude-haiku-4-5"
      }
    }
  }
}
```

### 3. 超时时间要匹配任务复杂度

默认的 main session 超时太短，复杂任务会被中断。第一件事就是改这个：

```json
{
  "agents": {
    "defaults": {
      "timeoutSeconds": 600  // 10分钟
    }
  }
}
```

不同任务需要不同的超时：
- 简单查询：60秒
- 代码审查：300秒
- 深度研究：600秒
- 多步骤自动化：900秒

### 4. 使用 thinking 模式处理复杂任务

OpenClaw 支持三种 thinking 级别：

```json
{
  "agents": {
    "main": {
      "thinking": "high"  // off | low | medium | high
    }
  }
}
```

- `off`：直接回答，最快最便宜
- `low`：简单推理（默认）
- `medium`：中等复杂度任务
- `high`：需要深度思考的任务

**成本差异巨大**：high 模式的 token 消耗是 off 模式的 3-5 倍。

按需使用：
- 日常对话 → `off` 或 `low`
- 代码重构 → `medium`
- 架构设计 → `high`

### 5. 控制上下文窗口避免成本爆炸

`UnboundedChatCompletionContext` 会保留所有历史消息。长期运行的 agent 会导致 token 成本持续增长。

切换到 `BufferedChatCompletionContext`：

```json
{
  "agents": {
    "defaults": {
      "contextType": "buffered",
      "contextConfig": {
        "maxMessages": 50,
        "compactionThreshold": 40
      }
    }
  }
}
```

当消息数超过 40 条时，自动压缩旧消息为摘要。

### 6. 为不同场景创建多个 agent 配置

不要用一个配置应对所有场景。创建专用配置：

```
~/.openclaw/
├── openclaw.json          # 默认配置
├── agents/
│   ├── research.json      # 研究任务
│   ├── coding.json        # 编程任务
│   └── automation.json    # 自动化任务
```

启动时指定配置：

```bash
openclaw gateway start --config ~/.openclaw/agents/research.json
```

### 7. 使用 workspace 隔离不同项目

每个项目用独立的 workspace：

```bash
# 项目 A
openclaw gateway start --workspace ~/projects/project-a/.openclaw

# 项目 B  
openclaw gateway start --workspace ~/projects/project-b/.openclaw
```

这样 `AGENTS.md`、`TOOLS.md`、memory 文件都是项目独立的。

### 8. 善用 .openclawignore

防止 agent 读取不必要的文件：

```
# .openclawignore
node_modules/
.git/
*.log
.env
dist/
build/
```

减少 token 消耗，提高响应速度。

## 技能使用（技巧 9-14）

### 9. 技能加载优先级

OpenClaw 按以下顺序加载技能：

1. `./skills/` - 项目技能（最高优先级）
2. `~/.openclaw/skills/` - 用户技能
3. 内置技能（最低优先级）

同名技能会被高优先级的覆盖。

### 10. 创建轻量级技能

技能不需要复杂。最简单的技能只需要一个文件：

```markdown
---
name: quick-search
description: 快速搜索并总结结果
---

# Quick Search Skill

当用户要求快速搜索时：
1. 使用 web_search 工具搜索
2. 提取前3个结果
3. 生成100字摘要
4. 返回结果和来源链接
```

保存为 `skills/quick-search/SKILL.md`，重启 gateway 即可使用。

### 11. 技能可以调用其他技能

```markdown
# SKILL.md

## 工作流程

1. 使用 `github` 技能获取 issue 列表
2. 使用 `coding-agent` 技能生成修复代码
3. 使用 `github` 技能创建 PR
```

技能组合能构建复杂的自动化流程。

### 12. 使用 {baseDir} 引用技能目录

```markdown
# SKILL.md

执行脚本：
```bash
node {baseDir}/scripts/process.js
```
```

`{baseDir}` 会自动替换为技能的绝对路径。

### 13. 定期更新技能

```bash
# 检查更新
clawhub outdated

# 更新所有技能
clawhub update --all

# 更新特定技能
clawhub update skill-name
```

技能更新可能包含安全修复和性能改进。

### 14. 删除不用的技能

每个技能都会被加载到 agent 的上下文中，消耗 token。

```bash
# 列出已安装的技能
clawhub list --installed

# 删除不用的技能
clawhub uninstall skill-name
```

## Sub-Agent 架构（技巧 15-20）

### 15. 何时使用 sub-agent

使用 sub-agent 的场景：
- 并行执行多个任务
- 需要独立的上下文和 memory
- 长时间运行的后台任务
- 需要不同的模型或配置

不需要 sub-agent 的场景：
- 简单的顺序任务
- 需要共享上下文的对话
- 一次性的快速查询

### 16. Sub-agent 通信模式

**推送模式**（适合独立任务）：

```bash
sessions_spawn(
  key: "researcher",
  instruction: "研究 AI Agent 市场，30分钟后汇报",
  background: true
)
```

**拉取模式**（适合协作任务）：

```bash
# 主 agent
result = sessions_send(
  sessionKey: "researcher",
  message: "当前进度如何？"
)
```

### 17. 使用专用 workspace 隔离 sub-agent

```bash
sessions_spawn(
  key: "researcher",
  workspace: "/tmp/research-workspace",
  instruction: "..."
)
```

任务完成后可以直接删除 workspace，不留痕迹。

### 18. Sub-agent 的模型可以不同

```json
{
  "agents": {
    "main": {
      "model": "anthropic/claude-opus-4-6"
    },
    "subagents": {
      "model": "anthropic/claude-haiku-4-5"  // sub-agent 用便宜的模型
    }
  }
}
```

主 agent 负责决策，sub-agent 负责执行，成本大幅降低。

### 19. 监控 sub-agent 状态

```bash
# 列出所有 sub-agent
sessions_list()

# 检查特定 sub-agent
sessions_status(sessionKey: "researcher")

# 终止失控的 sub-agent
sessions_kill(sessionKey: "researcher")
```

### 20. Sub-agent 失败处理

```bash
try {
  result = sessions_send(sessionKey: "researcher", message: "...")
} catch {
  # 重试或降级处理
  sessions_spawn(key: "researcher-backup", ...)
}
```

## 成本控制（技巧 21-25）

### 21. 使用 Haiku 处理简单任务

Opus 4.6 的成本是 Haiku 4.5 的 15 倍。大部分任务用 Haiku 就够了。

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-haiku-4-5",
      "fallbacks": [
        "anthropic/claude-sonnet-4-6"  // 只在 Haiku 失败时用
      ]
    }
  }
}
```

### 22. 启用响应缓存

```json
{
  "providers": {
    "anthropic": {
      "caching": {
        "enabled": true,
        "ttl": 300  // 5分钟
      }
    }
  }
}
```

相同的请求会复用缓存，节省 90% 的成本。

### 23. 监控 API 使用量

```bash
# 查看今日使用量
openclaw usage today

# 查看本月使用量
openclaw usage month

# 设置预算告警
openclaw usage set-budget --monthly 100
```

### 24. 使用本地模型处理敏感数据

```json
{
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434",
      "models": ["qwen2.5:7b"]
    }
  }
}
```

敏感数据不出本地，零 API 成本。

### 25. 压缩历史消息

```bash
# 手动压缩当前会话
/compact

# 自动压缩配置
{
  "agents": {
    "defaults": {
      "autoCompact": true,
      "compactThreshold": 50  // 超过50条消息自动压缩
    }
  }
}
```

## 调试与安全（技巧 26-30）

### 26. 启用详细日志

```json
{
  "logging": {
    "level": "debug",
    "file": "~/.openclaw/logs/debug.log"
  }
}
```

出问题时，日志是第一手资料。

### 27. 使用 dry-run 模式测试

```bash
# 测试技能但不实际执行
openclaw exec --dry-run "使用 github 技能创建 issue"
```

### 28. 定期备份配置和 memory

```bash
# 备份脚本
#!/bin/bash
tar -czf openclaw-backup-$(date +%Y%m%d).tar.gz \
  ~/.openclaw/openclaw.json \
  ~/.openclaw/.env \
  ~/.openclaw/workspace/
```

### 29. 审计 exec 命令

```bash
# 查看最近执行的命令
grep '"tool":"exec"' ~/.openclaw/logs/audit.log | tail -20
```

发现异常命令立即调查。

### 30. 使用 allowlist 限制工具

```json
{
  "agents": {
    "main": {
      "tools": {
        "allowlist": ["read", "write", "web_search"],  // 只允许这些工具
        "denylist": ["exec", "browser"]  // 明确禁止这些
      }
    }
  }
}
```

## 总结

这30个技巧覆盖了从配置到生产的完整流程。记住：

1. **配置要精确** - 模型、超时、上下文都要匹配任务
2. **技能要轻量** - 简单的技能组合胜过复杂的单体
3. **Sub-agent 要隔离** - 独立的 workspace 和配置
4. **成本要监控** - Haiku 优先，缓存启用，定期审计
5. **安全要主动** - 日志、备份、权限控制

OpenClaw 的强大在于灵活性，但灵活性需要正确的配置才能发挥。花时间理解这些技巧，你的 agent 会更快、更便宜、更可靠。
