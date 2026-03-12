---
title: OpenClaw 生产环境部署指南
description: 从 VPS 选择到 Docker 容器化，让你的 AI 助手稳定运行 24/7
---

# OpenClaw 生产环境部署指南

在本地跑 OpenClaw 很简单，但要让它在生产环境稳定运行 24/7，需要考虑更多因素：服务器选择、容器化、监控、备份、安全加固。这篇指南会带你完成完整的生产部署流程。

## 第一步：选择合适的服务器

### VPS 配置建议

**最低配置**（单 agent，轻度使用）：
- CPU：2 核
- 内存：2GB
- 存储：20GB SSD
- 带宽：1TB/月
- 成本：$5-10/月

**推荐配置**（多 agent，中度使用）：
- CPU：4 核
- 内存：4GB
- 存储：40GB SSD
- 带宽：2TB/月
- 成本：$15-25/月

**高性能配置**（本地模型 + 多 agent）：
- CPU：8 核
- 内存：16GB
- 存储：100GB SSD
- 带宽：5TB/月
- 成本：$50-80/月

### 服务商选择

**推荐服务商**（2026年2月）：

| 服务商 | 优势 | 劣势 | 适合场景 |
|--------|------|------|---------|
| DigitalOcean | 简单易用，文档完善 | 价格略高 | 新手首选 |
| Vultr | 性价比高，全球节点多 | 稳定性一般 | 预算有限 |
| Linode | 性能稳定，支持好 | 节点较少 | 生产环境 |
| Hetzner | 价格最低，性能强 | 仅欧美节点 | 欧美用户 |
| AWS Lightsail | 与 AWS 生态集成 | 配置复杂 | 已用 AWS |

**避免使用**：
- 共享主机（性能不稳定）
- 免费 VPS（随时可能关停）
- 国内未备案服务器（访问不稳定）

### 操作系统选择

推荐 **Ubuntu 22.04 LTS** 或 **Debian 12**：
- 长期支持（5年安全更新）
- 软件包丰富
- 社区文档完善
- Docker 支持好

不推荐：
- CentOS（已停止维护）
- Windows Server（资源占用高）
- 非 LTS 版本（支持周期短）

## 第二步：服务器初始化

### 1. 创建非 root 用户

```bash
# SSH 登录服务器
ssh root@your-server-ip

# 创建用户
adduser openclaw
usermod -aG sudo openclaw

# 配置 SSH 密钥登录
mkdir -p /home/openclaw/.ssh
cp ~/.ssh/authorized_keys /home/openclaw/.ssh/
chown -R openclaw:openclaw /home/openclaw/.ssh
chmod 700 /home/openclaw/.ssh
chmod 600 /home/openclaw/.ssh/authorized_keys

# 切换到新用户
su - openclaw
```

### 2. 配置防火墙

```bash
# 安装 ufw
sudo apt update
sudo apt install ufw

# 默认规则：拒绝所有入站，允许所有出站
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 允许 SSH
sudo ufw allow 22/tcp

# 如果需要 HTTPS（反向代理）
sudo ufw allow 443/tcp

# 启用防火墙
sudo ufw enable

# 检查状态
sudo ufw status
```

### 3. 禁用 root SSH 登录

```bash
sudo nano /etc/ssh/sshd_config
```

修改以下配置：

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

重启 SSH：

```bash
sudo systemctl restart sshd
```

### 4. 配置自动安全更新

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 第三步：安装 OpenClaw

### 使用 Docker（推荐）

**优势**：
- 隔离环境，不污染系统
- 易于备份和迁移
- 资源限制和监控
- 一键回滚

**安装 Docker**：

```bash
# 安装依赖
sudo apt update
sudo apt install ca-certificates curl gnupg

# 添加 Docker 官方 GPG 密钥
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 添加 Docker 仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://dowoad.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 添加当前用户到 docker 组
sudo usermod -aG docker $USER
newgrp docker

# 验证安装
docker --version
```

**创建 Dockerfile**：

```dockerfile
FROM node:22-alpine

# 安装系统依赖
RUN apk add --no-cache \
    bash \
    git \
    curl \
    python3 \
    py3-pip

# 创建非 root 用户
RUN addgroup -S openclaw && adduser -S openclaw -G ope# 设置工作目录
WORKDIR /home/openclaw

# 安装 OpenClaw
RUN npm install -g openclaw

# 切换到非 root 用户
USER openclaw

# 暴露端口（仅内部使用）
EXPOSE 3000

# 启动命令
CMD ["openclaw", "gateway", "start"]
```

**创建 docker-compose.yml**：

```yaml
version: '3.8'

services:
  openclaw:
    build: .
    container_name: openclaw
    restart: unless-stopped
    volumes:
      - ./config:/home/openclaw/.openclaw
      - ./workspace:/home/openclaw/workspace
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    networks:
      - openclaw-net
    mem_limit: 2g
    cpus: 2
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  openclaw-net:
    driver: bridge
```

**启动容器**：

```bash
# 构建镜像
docker compose build

# 启动服务
docker compose up -d

# 查看日志
docker compose logs -f

# 查看状态
docker compose ps
```

### 直接安装（备选方案）

如果不想用 Docker：

```bash
# 安装 Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 OpenClaw
npm install -g openclaw

# 初始化配置
openclaw onboard

# 使用 systemd 管理服务
sudo nano /etc/systemd/system/openclaw.service
```

**systemd 服务配置**：

```ini
[Unit]
Description=OpenClaw Gateway
After=network.target

[Service]
Type=simple
User=openclaw
WorkingDirectory=/home/openclaw
ExecStart=/usr/bin/openclaw gateway start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**启动服务**：

```bash
sudo systemctl daemon-reload
sudo systemctl enable openclaw
sudo systemctl start openclaw
sudo systemctl status openclaw
```

## 第四步：配置反向代理（可选）

如果需要通过 HTTPS 访问 OpenClaw Web UI：

### 使用 Caddy（最简单）

```bash
# 安装 Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# 配置 Caddyfile
sudo nano /etc/caddy/Caddyfile
```

**Caddyfile 配置**：

```
openclaw.yourdomain.com {
    reverse_proxy localhost:3000
    
    # 基础认证
    basicauth {
        admin $2a$14$hashed_password
    }
    
    # 限制访问 IP（可选）
    @allowed {
        remote_ip 1.2.3.4 5.6.7.8
    }
    handle @allowed {
        reverse_proxy localhost:3000
    }
    handle {
        abort
    }
}
```

**重启 Caddy**：

```bash
sudo systemctl restart caddy
```

Caddy 会自动申请和续期 Let's Encrypt 证书。

## 第五步：监控和告警

### 1. 系统监控

使用 **Netdata**（实时监控）：

```bash
# 安装 Netdata
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# 访问 http://your-server-ip:19999
```

### 2. OpenClaw 监控

创建健康检查脚本：

```bash
#!/bin/bash
# ~/healthcheck.sh

# 检查 Gateway 是否运行
if ! curl -s http://localhost:3000/health > /dev/null; then
    echo "OpenClaw Gateway is down!"
    # 发送告警（Telegram/Email）
    curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
        -d "chat_id=$CHAT_ID" \
        -d "text=⚠️ OpenClaw Gateway is down on $(hostname)"
    
    # 尝试重启
    docker compose restart openclaw
fi

# 检查磁盘空间
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "Disk usage is above 80%: ${DISK_USAGE}%"
    # 发送告警
fi

# 检查内存使用
MEM_USAGE=$(free | grep Mem | awk '{print ($3/$2) * 100.0}' | cut -d. -f1)
if [ $MEM_USAGE -gt 90 ]; then
    echo "Memory usage is above 90%: ${MEM_USAGE}%"
    # 发送告警
fi
```

**添加到 crontab**：

```bash
chmod +x ~/healthcheck.sh
crontab -e
```

```
# 每 5 分钟检查一次
*/5 * * * * /home/openclaw/healthcheck.sh >> /home/openclaw/healthcheck.log 2>&1
```

### 3. 日志监控

使用 **Loki + Promtail**（可选，适合多服务器）：

```yaml
# docker-compose.yml 添加
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yaml:/etc/loki/local-config.yaml
    command: -config.file=/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log
      - ./promtail-config.yaml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=your_password
```

## 第六步：备份策略

### 1. 自动备份脚本

```bash
#!/bin/bash
# ~/backup.sh

BACKUP_DIR="/home/openclaw/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="openclaw_backup_$DATE.tar.gz"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份配置和数据
tar -czf $BACKUP_DIR/$BACKUP_FILE \
    ~/.openclaw/openclaw.json \
    ~/.openclaw/.env \
    ~/.openclaw/workspace/ \
    ~/.openclaw/skills/

# 保留最近 7 天的备份
find $BACKUP_DIR -name "openclaw_backup_*.tar.gz" -mtime +7 -delete

# 上传到云存储（可选）
# rclone copy $BACKUP_DIR/$BACKUP_FILE remote:openclaw-backups/

echo "Backup completed: $BACKUP_FILE"
```

**添加到 crontab**：

```bash
chmod +x ~/backup.sh
crontab -e
```

```
# 每天凌晨 2 点备份
0 2 * * * /home/openclaw/backup.sh >> /home/openclaw/backup.log 2>&1
```

### 2. 使用 rclone 同步到云存储

```bash
# 安装 rclone
curl https://rclone.org/install.sh | sudo bash

# 配置云存储
rclone config

# 测试上传
rclone copy ~/backups/ remote:openclaw-backups/

# 自动同步（添加到 backup.sh）
rclone sync ~/backups/ remote:openclaw-backups/ --max-age 7d
```

## 第七步：性能优化

### 1. 启用 HTTP/2 和压缩

如果使用 Caddy，默认已启用。

### 2. 配置 swap（内存不足时）

```bash
# 创建 2GB swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永久启用
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 3. 优化 Docker 资源限制

```yaml
# docker-compose.yml
services:
  openclaw:
    mem_limit: 2g
    mem_reservation: 1g
    cpus: 2
    pids_limit: 200
```

### 4. 启用 OpenClaw 缓存

```json
{
  "providers": {
    "anthropic": {
      "caching": {
        "enabled": true,
        "ttl": 300
      }
    }
  }
}
```

## 生产环境检查清单

部署前确认：

- [ ] 使用非 root 用户运行
- [ ] 配置了防火墙（ufw）
- [ ] 禁用了 root SSH 登录
- [ ] 启用了自动安全更新
- [ ] 使用 Docker 隔离环境
- [ ] 配置了资源限制（CPU/内存）
- [ ] 设置了反向代理和 HTTPS（如需要）
- [ ] 启用了健康检查和告警
- [ ] 配置了自动备份
- [ ] 测试了备份恢复流程
- [ ] 启用了日志轮转
- [ ] 配置了监控面板
- [ ] 文档化了部署流程

## 故障排查

### Gateway 无法启动

```bash
# 检查日志
docker compose logs openclaw

# 检查端口占用
sudo netstat -tulpn | grep 3000

# 检查配置文件
openclaw config validate
```

### 内存不足

```bash
# 查看内存使用
free -h
docker stats

# 增加 swap
sudo fallocate -l 4G /swapfile

# 限制容器内存
docker update --memory 1g openclaw
```

### 磁盘空间不足

```bash
# 清理 Docker
docker system prune -a

# 清理日志
sudo journalctl --vacuum-time=7d

# 清理旧备份
find ~/backups -mtime +30 -delete
```

## 总结

生产环境部署的关键：

1. **安全第一** - 防火墙、非 root 用户、HTTPS
2. **隔离运行** - Docker 容器化
3. **持续监控** - 健康检查、日志、告警
4. **定期备份** - 自动备份 + 云存储
5. **资源限制** - CPU/内存限制，防止失控
6. **文档化** - 记录部署流程和配置

OpenClaw 在生产环境运行需要更多的准备工作，但一旦配置正确，它能稳定运行数月甚至数年。

---

需要帮助？加入 [OpenClaw Discord 社区](https://discord.com/invite/clawd)。
