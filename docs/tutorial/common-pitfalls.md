---
title: OpenClaw 新手避坑指南
description: 这些是新手最容易踩的坑，提前知道能省下几天的调试时间
---

# OpenClaw 新手避坑指南

OpenClaw 在 2026 年 3 月达到了 25 万 GitHub stars，成为史上增长最快的开源项目。但快速增长也意味着大量新手在摸索中踩坑。这篇指南总结了最常见的 10 个坑，以及如何避开它们。

## 坑 1：暴露 Gateway 到公网

**症状**：你在 VPS 上安装了 OpenClaw，配置了 Telegram bot，然后发现陌生人也能给你的 bot 发消息并执行命令。

**原因**：默认配置下，Gateway 监听 `0.0.0.0`，意味着任何人都能访问。

**解决方案**：

```json
// ~/.openclaw/openclaw.json
{
  "gateway": {
    "host": "127.0.0.1",  // 只监听本地
    "port": 3000
  },
  "channels": {
    "telegram": {
      "allowFrom": ["@your_username"]  // 白名单
    }
  }
}
```

如果需要远程访问，使用 SSH 隧道：

```bash
ssh -L 3000:localhost:3000 user@your-vps
```

**教训**：安全配置不是"以后再说"，而是"现在就做"。

## 坑 2：API 密钥提交到 Git

**症状**：你把 `openclaw.json` 提交到 GitHub，第二天收到 Anthropic 的账单告警邮件。

**原因**：API 密钥写在配置文件里，被公开到了 GitHub。自动化脚本会扫描公开仓库，几分钟内就能找到并滥用你的密钥。

**解决方案**：

1. 立即在 Anthropic 后台撤销该密钥
2. 生成新密钥
3. 使用环境变量：

```bash
# ~/.openclaw/.env
ANTHROPIC_API_KEY=sk-ant-api03-xxx
OPENAI_API_KEY=sk-proj-xxx
```

```json
// openclaw.json
{
  "providers": {
    "anthropic": {
      "apiKey": "${ANTHROPIC_API_KEY}"
    }
  }
}
```

4. 添加到 `.gitignore`：

```
.env
openclaw.json  # 如果包含敏感信息
```

5. 从 Git 历史中删除：

```bash
# 使用 BFG Repo-Cleaner
bfg --delete-files openclaw.json
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

**教训**：密钥永远不要写在代码里，即使是"私有"仓库。

## 坑 3：Sub-agent 看不到 SOUL.md

**症状**：你在 `SOUL.md` 里写了详细的路由规则，但 sub-agent 完全不按规则执行。

**原因**：Sub-agent 只能看到 `AGENTS.md` 和 `TOOLS.md`，其他文件对它不可见。

**解决方案**：

把 sub-agent 需要的指令移到 `AGENTS.md`：

```markdown
# AGENTS.md

## Sub-Agent 路由规则

### 任务分类
- 代码相关 → coding-agent
- 研究任务 → research-agent
- 数据分析 → data-agent

### 执行原则
- 每个 sub-agent 独立工作
- 完成后向 main agent 汇报
- 失败时自动重试一次
```

**教训**：理解文件加载优先级，把指令放在正确的位置。

## 坑 4：模型字符串格式错误

**症状**：配置了模型但一直报错，或者静默失败使用了错误的模型。

**原因**：模型字符串缺少 provider 前缀。

**错误示范**：

```json
{
  "model": "claude-opus-4-6"  // ❌
}
```

**正确格式**：

```json
{
  "model": "anthropic/claude-opus-4-6"  // ✅
}
```

**常用模型列表**：

```json
{
  "models": {
    "main": "anthropic/claude-opus-4-6",
    "subagent": "anthropic/claude-haiku-4-5",
    "fallback": "openai/gpt-4o",
 ": "ollama/qwen2.5:7b"
  }
}
```

**教训**：模型字符串格式是 `provider/model-name`，不要省略 provider。

## 坑 5：超时设置太短

**症状**：复杂任务执行到一半就中断了，没有任何错误提示。

**原因**：默认超时是 60 秒，很多任务需要更长时间。

**解决方案**：

```json
{
  "agents": {
    "defaults": {
      "timeoutSeconds": 600  // 10分钟
    },
    "main": {
      "timeoutSeconds": 900  // 主 agent 15分钟
    }
  }
}
```

按任务类型设置：
- 简单查询：60 秒
- 代码审查：300 秒
- 深度研究：600 秒
- 多步骤自动化：900 秒

**教训**：超时要匹配任务复杂度，不要用默认值。

## 坑 6：上下文窗口爆炸

**症状**：OpenClaw 运行几天后，每次响应都很慢，API 账单暴涨。

**原因**：使用了 `UnboundedChatCompletionContext`，所有历史消息都被保留，token 消耗持续增长。

**解决方案**：

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

或者定期手动压缩：

```bash
/compact
```

**成本对比**：

| 上下文类型 | 100 条消息 | 1000 条消息 | 10000 条消息 |
|-----------|-----------|------------|-------------|
| Unbounded | $0.50 | $5.00 | $50.00 |
| Buffered  | $0.50 | $0.50 | $0.50 |

**教训**：长期运行的 agent 必须启用上下文压缩。

## 坑 7：技能权限过大

**症状**：安装了一个"天气查询"技能，结果它能读取你的 SSH 密钥。

**原因**：技能请求了不必要的权限，而你没有审查就安装了。

**解决方案**：

安装前先审查：

```bash
# 下载但不安装
clawhub download weather-skill

# 检查代码
cat ~/.openclaw/skills/weather-skill/SKILL.md
ls -la ~/.openclaw/skills/weather-skill/scripts/
```

重点检查：
- 是否请求 `exec` 权限
- 是否访问 `~/.ssh`、`~/.aws` 等敏感目录
- 是否向外部服务器发送数据

在沙箱环境测试：

```bash
# 创建测试环境
docker run -it --rm \
  -v $(pwd)/test-workspace:/workspace \
  openclaw/openclaw:latest

# 测试技能
clawhub install weather-skill
openclaw exec "查询天气"
```

**教训**：永远不要盲目信任第三方技能，审查代码是必须的。

## 坑 8：Heartbeat 和 Cron 混淆

**症状**：你想让 agent 每天早上 8 点发送日报，但它有时 8:05 发，有时 8:15 发。

**原因**：用了 Heartbeat 而不是 Cron。Heartbeat 是轮询机制，时间不精确。

**何时用 Heartbeat**：
- 批量检查（邮件 + 日历 + 通知）
- 可以容忍时间漂移
- 需要对话上下文

**何时用 Cron**：
- 精确时间（"每天 8:00"）
- 独立任务，不需要上下文
- 一次性提醒

**Heartbeat 示例**：

```markdown
# HEARTBEAT.md

## 每 30 分钟检查
- 未读邮件（重要的）
- 今天的日历事件
- GitHub 通知
```

**Cron 示例**：

```bash
# 每天 8:00 发送日报
openclaw cron add "0 8 * * *" "生成昨天的工作总结并发送到 Telegram"

# 20 分钟后提醒
openclaw cron add-once "now + 20 minutes" "提醒：会议开始"
```

**教训**：精确时间用 Cron，批量检查用 Heartbeat。

## 坑 9：本地模型性能预期过高

**症状**：你用 Ollama 跑了个 7B 模型，发现它经常理解错指令，生成的代码有 bug。

**原因**：2026 年的本地模型在复杂任务上仍然落后于 Claude Opus、GPT-4 等云端模型。

**现实情况**：

| 任务类型 | 本地模型 (7B-13B) | 云端模型 (Opus/GPT-4) |
|---------|------------------|---------------------|
| 简单问答 | ✅ 可用 | ✅ 优秀 |
| 代码生成 | ⚠️ 基础可用 | ✅ 优秀 |
| 复杂推理 | ❌ 不可靠 | ✅ 优秀 |
| 多步骤任务 | ❌ 经常失败 | ✅ 可靠 |

**合理使用本地模型**：

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-6",  // 主模型
      "fallbacks": [
        "ollama/qwen2.5:7b"  // 仅作为离线备份
      ]
    }
  }
}
```

或者按任务分配：

```markdown
# AGENTS.md

## 模型选择策略
- 简单查询、格式转换 → ollama/qwen2.5:7b
- 代码生成、复杂推理 → anthropic/claude-opus-4-6
- 敏感数据处理 → ollama/qwen2.5:7b（不出本地）
```

**教训**：本地模型适合隐私保护和成本控制，不适合复杂任务。

## 坑 10：忽略日志和监控

**症状**：OpenClaw 突然不工作了，你不知道是哪里出了问题。

**原因**：没有启用日志，出问题时无从排查。

**解决方案**：

启用详细日志：

```json
{
  "logging": {
    "level": "info",  // 生产环境用 info，调试用 debug
    "file": "~/.openclaw/logs/openclaw.log",
    "auditLog": {
      "enabled": true,
      "path": "~/.openclaw/logs/audit.log",
      "events": ["exec", "file_write", "skill_install"]
    }
  }
}
```

定期检查日志：

```bash
# 查看最近的错误
grep "ERROR" ~/.openclaw/logs/openclaw.log | tail -20

# 查看执行的命令
grep '"event":"exec"' ~/.openclaw/logs/audit.log | tail -20

# 实时监控
tail -f ~/.openclaw/logs/openclaw.log
```

设置告警：

```bash
# 使用 logwatch 或类似工具
# 当日志中出现 "ERROR" 或 "CRITICAL" 时发送通知
```

**教训**：日志是排查问题的第一手资料，必须启用。

## 避坑检查清单

在正式使用 OpenClaw 前，确认：

- [ ] Gateway 绑定到 localhost 或配置了白名单
- [ ] API 密钥存储在 `.env` 文件中
- [ ] `.env` 已添加到 `.gitignore`
- [ ] 模型字符串使用了正确的格式（`provider/model-name`）
- [ ] 超时时间匹配任务复杂度
- [ ] 启用了上下文压缩（长期运行的 agent）
- [ ] 审查了所有第三方技能
- [ ] 理解了 Heartbeat 和 Cron 的区别
- [ ] 对本地模型有合理预期
- [ ] 启用了日志和审计

## 遇到问题怎么办

1. **查看日志**：`~/.openclaw/logs/openclaw.log`
2. **检查配置**：`openclaw config validate`
3. **查看官方文档**：https://docs.openclaw.ai
4. **搜索社区**：Discord、GitHub Issues
5. **提问时提供**：
   - OpenClaw 版本（`openclaw --version`）
   - 错误日志
   - 配置文件（删除敏感信息）
   - 复现步骤

## 总结

这 10 个坑覆盖了新手最常遇到的问题。记住：

1. **安全第一** - 不要暴露 Gateway，不要泄露密钥
2. **理解机制** - 文件加载、模型格式、超时设置
3. **控制成本** - 上下文压缩、模型选择
4. **审查代码** - 第三方技能不可盲目信任
5. **启用日志** - 出问题时有据可查

OpenClaw 很强大，但需要正确配置。花时间理解这些坑，能省下几天的调试时间。

---

遇到其他问题？欢迎在 [GitHub Discussions](https://github.com/openclaw/opendiscussions) 提问。
