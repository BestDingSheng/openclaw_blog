---
title: OpenClaw 安全配置完全指南
description: 从权限控制到隔离执行，13个步骤让你的 AI 助手像专业工程师一样安全
---

# OpenClaw 安全配置完全指南

OpenClaw 的强大来自于它能直接访问你的文件系统、执行命令、控制浏览器。但这种能力也意味着风险。本指南将带你完成 13 个关键步骤，让你的 OpenClaw 部署达到生产级安全标准。

## 为什么安全配置不是可选项

2026年1月，安全研究人员发现数百个暴露在公网的 OpenClaw 实例，其中8个完全没有认证，任何人都能执行命令、查看 API 密钥。

问题的根源？跳过了 `AGENTS.md` 配置，使用了默认的开放权限。

OpenClaw 遵循"默认开放"的哲学——它信任你会正确配置。但如果你不配置，它就会信任所有人。

## 第一层防护：默认私有

### 1. 绑定到 localhost

最简单也最有效的防护：让 OpenClaw 只监听本地连接。

```json
// ~/.openclaw/openclaw.json
{
  "gateway": {
    "host": "127.0.0.1",  // 只允许本机访问
    "port": 3000
  }
}
```

这一行配置就能阻止 99% 的外部攻击。如果你需要远程访问，使用 SSH 隧道而不是直接暴露端口：

```bash
# 在本地机器上
ssh -L 3000:localhost:3000 user@your-server
```

### 2. 设置 Gateway 密码

即使绑定到 localhost，也要设置密码。防止本机上的其他进程或用户未授权访问。

```bash
openclaw gateway set-password
```

密码会加密存储在 `~/.openclaw/.env` 中。

### 3. 限制消息来源

如果你连接了 Telegram、Discord 等公共频道，必须配置白名单：

```json
{
  "channels": {
    "telegram": {
      "allowFrom": ["@your_username", "123456789"]  // 只允许这些用户
    }
  }
}
```

没有这个配置，任何能找到你 bot 的人都能让它执行命令。

## 第二层防护：最小权限原则

### 4. 按任务限制工具权限

不要给所有任务开放所有工具。使用 `AGENTS.md` 定义权限边界：

```markdown
# AGENTS.md

## 工具权限策略

### 日志分析任务
- 允许：read（只读特定目录）
- 禁止：write, exec, browser

### 报告生成任务
- 允许：read, write（仅输出目录）
- 禁止：exec, browser, web_fetch

### 研究任务
- 允许：web_search, web_fetch, read, write
- 禁止：exec, browser
```

### 5. 隔离执行环境

使用 Docker 容器运行 OpenClaw，限制它能访问的文件和系统资源：

```dockerfile
FROM node:22-alpine

# 创建非 root 用户
RUN addgroup -S openclaw && adduser -S openclaw -G openclaw

# 只挂载必要的目录
VOLUME ["/workspace", "/config"]

USER openclaw
WORKDIR /workspace

CMD ["openclaw", "gateway", "start"]
```

容器内的错误不会影响宿主机。即使 OpenClaw 被攻破，攻击者也只能访问容器内的资源。

### 6. 使用非管理员账户

永远不要用 root 或管理员账户运行 OpenClaw：

```bash
# 创建专用用户
sudo useradd -m -s /bin/bash openclaw

# 切换到该用户
sudo -u openclaw openclaw gateway start
```

如果 OpenClaw 需要执行需要 sudo 的命令，使用 `sudoers` 配置精确的权限，而不是给它完整的 sudo 访问。

## 第三层防护：凭证管理

### 7. 永远不要把密钥写在配置文件里

错误示范：

```json
{
  "providers": {
    "anthropic": {
      "apiKey": "sk-ant-api03-xxx"  // ❌ 千万别这样
    }
  }
}
```

正确做法：

```bash
# ~/.openclaw/.env
ANTHROPIC_API_KEY=sk-ant-api03-xxx
OPENAI_API_KEY=sk-proj-xxx
```

```json
{
  "providers": {
    "anthropic": {
      "apiKey": "${ANTHROPIC_API_KEY}"  // ✅ 从环境变量读取
    }
  }
}
```

### 8. 立即轮换泄露的密钥

如果你不小心把密钥提交到了 Git：

1. 立即在提供商后台撤销该密钥
2. 生成新密钥
3. 使用 `git filter-branch` 或 BFG Repo-Cleaner 从历史中删除
4. 强制推送到远程仓库

不要只是删除最新的 commit——密钥仍然在 Git 历史里。

### 9. 使用密钥管理服务

对于团队部署，考虑使用专业的密钥管理：

- **1Password CLI** - 与 1Password 集成
- **AWS Secrets Manager** - 如果部署在 AWS
- **HashiCorp Vault** - 自托管方案

```bash
# 使用 1Password CLI
export ANTHROPIC_API_KEY=$(op read "op://Private/OpenClaw/api_key")
openclaw gateway start
```

## 第四层防护：技能安全

### 10. 审查第三方技能

从 ClawHub 安装技能前，先检查它的代码：

```bash
# 下载但不安装
clawhub download skill-name

# 检查 SKILL.md 和 scripts/
cat ~/.openclaw/skills/skill-name/SKILL.md
ls -la ~/.openclaw/skills/skill-name/scripts/
```

重点检查：
- 是否请求了不必要的权限（exec, browser）
- 脚本是否访问敏感文件（~/.ssh, ~/.aws）
- 是否向外部服务器发送数据

### 11. 沙箱测试新技能

在生产环境使用前，先在隔离环境测试：

```bash
# 创建测试工作区
mkdir /tmp/openclaw-test
cd /tmp/openclaw-test

# 使用测试配置启动
openclaw gateway start --config ./test-config.json
```

观察技能的实际行为，确认它只做了文档说明的事情。

### 12. 定期审计已安装的技能

每月检查一次：

```bash
# 列出所有技能
clawhub list --installed

# 检查更新（可能包含安全修复）
clawhub update --all
```

删除不再使用的技能。每个技能都是潜在的攻击面。

## 第五层防护：监控与响应

### 13. 启用审计日志

记录所有关键操作：

```json
{
  "logging": {
    "level": "info",
    "auditLog": {
      "enabled": true,
      "path": "~/.openclaw/logs/audit.log",
      "events": ["exec", "file_write", "skill_install", "config_change"]
    }
  }
}
```

定期检查日志，寻找异常模式：

```bash
# 查看最近的 exec 命令
grep '"event":"exec"' ~/.openclaw/logs/audit.log | tail -20

# 查找失败的认证尝试
grep '"event":"auth_failed"' ~/.openclaw/logs/audit.log
```

## 安全检查清单

在部署到生产环境前，确认：

- [ ] Gateway 绑定到 localhost 或使用 SSH 隧道
- [ ] 设置了 Gateway 密码
- [ ] 所有消息频道配置了 `allowFrom` 白名单
- [ ] 使用非 root 用户运行
- [ ] API 密钥存储在 `.env` 文件中
- [ ] `.env` 已添加到 `.gitignore`
- [ ] 使用 Docker 或虚拟环境隔离
- [ ] 按任务限制了工具权限
- [ ] 审查了所有第三方技能
- [ ] 启用了审计日志
- [ ] 设置了日志监控告警

## 常见安全误区

### "我只在本地用，不需要安全配置"

错误。本地环境也有风险：
- 恶意浏览器扩展可能访问 localhost
- 本机上的其他用户或进程
- 不小心把配置同步到公共仓库

### "我信任这个技能的作者"

信任不等于安全。即使是善意的作者也可能：
- 犯错误（bug 导致的安全漏洞）
- 被攻击（账号被盗，恶意代码注入）
- 改变主意（后续更新添加遥测或广告）

始终审查代码，不要盲目信任。

### "设置太复杂了，我先跑起来再说"

这是最危险的想法。一旦 OpenClaw 暴露在公网，攻击者可以在几分钟内找到并利用它。

安全配置不是"以后再做"的事情，而是"现在就做"的事情。

## 进一步阅读

- [OpenClaw 官方安全文档](https://docs.openclaw.ai/security)
- [OWASP API 安全 Top 10](https://owasp.org/www-project-api-security/)
- [Docker 安全最佳实践](https://docs.docker.com/engine/security/)

---

安全不是一次性任务，而是持续的过程。定期审查配置，关注社区的安全公告，保持 OpenClaw 更新到最新版本。

记住：OpenClaw 的能力越强，正确配置它的责任就越大。
