# LHI Calculator 云端部署指南

## 📋 目录

1. [部署前准备](#部署前准备)
2. [方案选择](#方案选择)
3. [Vercel + Railway 部署（推荐）](#vercel--railway-部署推荐)
4. [Docker 部署](#docker-部署)
5. [服务器部署（VPS）](#服务器部署vps)
6. [环境变量配置](#环境变量配置)
7. [数据库迁移](#数据库迁移)
8. [域名配置](#域名配置)

---

## 🎯 部署前准备

### 1. 检查清单

- [ ] 项目在本地运行正常
- [ ] 所有测试通过
- [ ] DeepSeek API Key 已准备
- [ ] 数据库方案已选择
- [ ] 域名已准备（可选）
- [ ] 管理员密码已修改

### 2. 需要准备的密钥

```bash
# DeepSeek API Key
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxx

# JWT Secret（生成强密码）
JWT_SECRET=$(openssl rand -base64 32)

# 管理员密码（修改默认密码）
ADMIN_PASSWORD=your-strong-password
```

### 3. 安全检查

```bash
# 确保这些文件不会被提交到 Git
.env
dev.db
*.log
node_modules/
dist/
```

---

## 🚀 方案选择

### 方案 1：Vercel + Railway（推荐）✨

**优点**：
- ✅ 零配置，自动部署
- ✅ 免费额度充足
- ✅ HTTPS 自动配置
- ✅ 全球 CDN 加速
- ✅ 自动域名

**成本**：
- Vercel：免费（前端）
- Railway：$5/月起（后端 + 数据库）

**适合**：
- 个人项目、小型应用
- 快速上线、原型验证

---

### 方案 2：Docker 部署

**优点**：
- ✅ 环境一致性
- ✅ 易于迁移
- ✅ 适合自己的服务器

**成本**：
- 服务器费用（$5-20/月）

**适合**：
- 有服务器资源
- 需要完全控制

---

### 方案 3：VPS 直接部署

**优点**：
- ✅ 完全控制
- ✅ 灵活配置
- ✅ 成本可控

**成本**：
- VPS：$5-20/月

**适合**：
- 有运维经验
- 长期运营

---

## 🌟 Vercel + Railway 部署（推荐）

### 步骤 1：准备代码仓库

```bash
# 初始化 Git（如果还没有）
cd /Users/a1/Downloads/001/lhi-calculator
git init
git add .
git commit -m "Initial commit"

# 推送到 GitHub
git remote add origin https://github.com/your-username/lhi-calculator.git
git branch -M main
git push -u origin main
```

---

### 步骤 2：部署后端到 Railway

1. **注册 Railway**
   - 访问 https://railway.app/
   - 使用 GitHub 账号登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择 `lhi-calculator` 仓库

3. **配置后端服务**

   **Root Directory**:
   ```
   server
   ```

   **Build Command**:
   ```bash
   npm install && npm run prisma:generate && npm run build
   ```

   **Start Command**:
   ```bash
   npm start
   ```

4. **添加环境变量**

   在 Railway 项目设置中添加：

   ```env
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=file:./prod.db
   JWT_SECRET=<生成的强密码>
   JWT_EXPIRES_IN=7d
   ADMIN_EMAIL=admin@yourdomain.com
   ADMIN_PASSWORD=<强密码>
   DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxx
   ```

5. **获取后端 URL**
   - Railway 会自动生成域名，如：`https://lhi-calculator-production.up.railway.app`
   - 记下这个 URL，后面配置前端需要用

---

### 步骤 3：部署前端到 Vercel

1. **注册 Vercel**
   - 访问 https://vercel.com/
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "Add New Project"
   - 选择 `lhi-calculator` 仓库
   - 点击 "Import"

3. **配置构建设置**

   **Framework Preset**: Vite

   **Root Directory**: `./` (默认)

   **Build Command**:
   ```bash
   npm install && npm run build
   ```

   **Output Directory**:
   ```
   dist
   ```

4. **添加环境变量**

   在 Vercel 项目设置的 "Environment Variables" 中添加：

   ```env
   VITE_API_URL=https://lhi-calculator-production.up.railway.app
   ```

   > **重要**：替换为你在 Railway 获得的后端 URL

5. **部署**
   - 点击 "Deploy"
   - 等待构建完成（约 2-3 分钟）
   - 获得前端 URL，如：`https://lhi-calculator.vercel.app`

---

### 步骤 4：更新前端 API 配置

修改 `services/api/client.ts`：

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
```

提交并推送：

```bash
git add .
git commit -m "Update API URL for production"
git push
```

Vercel 会自动重新部署。

---

### 步骤 5：初始化数据库

1. **在 Railway 中打开终端**
   - 进入你的 Railway 项目
   - 点击 "Terminal" 或 "Shell"

2. **运行迁移**
   ```bash
   npx prisma migrate deploy
   ```

3. **创建管理员账户**
   ```bash
   npm run seed
   ```

4. **创建万能测试码**
   ```bash
   node -e "
   const { PrismaClient } = require('@prisma/client');
   const prisma = new PrismaClient();
   (async () => {
     await prisma.accessCode.create({
       data: { code: 'LHI159951', batchId: 'MASTER_CODE' }
     });
     console.log('Master code created');
   })();
   "
   ```

---

## 🐳 Docker 部署

### 步骤 1：创建 Dockerfile

**后端 Dockerfile** (`server/Dockerfile`):

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
```

**前端 Dockerfile** (`Dockerfile`):

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

### 步骤 2：创建 docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: ./server
    container_name: lhi-backend
    restart: always
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      PORT: 5000
      DATABASE_URL: file:/data/prod.db
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 7d
      ADMIN_EMAIL: ${ADMIN_EMAIL}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      DEEPSEEK_API_KEY: ${DEEPSEEK_API_KEY}
    volumes:
      - backend-data:/data
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: .
    container_name: lhi-frontend
    restart: always
    ports:
      - "80:80"
    environment:
      VITE_API_URL: http://backend:5000
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  backend-data:
    driver: local
```

---

### 步骤 3：创建 .env 文件

```bash
# 在项目根目录创建 .env.production
JWT_SECRET=your-super-secret-jwt-key-production
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-strong-password
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxx
```

---

### 步骤 4：部署

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 初始化数据库
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run seed
```

---

## 🖥️ 服务器部署（VPS）

### 步骤 1：服务器准备

```bash
# 连接服务器
ssh root@your-server-ip

# 更新系统
apt update && apt upgrade -y

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 安装 PM2
npm install -g pm2

# 安装 Nginx
apt install -y nginx

# 安装 Git
apt install -y git
```

---

### 步骤 2：克隆项目

```bash
# 创建项目目录
mkdir -p /var/www
cd /var/www

# 克隆代码
git clone https://github.com/your-username/lhi-calculator.git
cd lhi-calculator
```

---

### 步骤 3：配置后端

```bash
cd /var/www/lhi-calculator/server

# 安装依赖
npm install

# 创建 .env 文件
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL="file:./prod.db"
JWT_SECRET=your-super-secret-jwt-key-production
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-strong-password
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxx
EOF

# 生成 Prisma Client
npx prisma generate

# 运行数据库迁移
npx prisma migrate deploy

# 构建
npm run build

# 初始化数据
npm run seed

# 使用 PM2 启动
pm2 start dist/index.js --name lhi-backend
pm2 save
pm2 startup
```

---

### 步骤 4：配置前端

```bash
cd /var/www/lhi-calculator

# 安装依赖
npm install

# 构建（使用生产环境 API URL）
VITE_API_URL=https://yourdomain.com/api npm run build

# 复制到 Nginx 目录
cp -r dist /var/www/lhi-frontend
```

---

### 步骤 5：配置 Nginx

```bash
cat > /etc/nginx/sites-available/lhi << 'EOF'
server {
    listen 80;
    server_name yourdomain.com;

    # 前端
    location / {
        root /var/www/lhi-frontend;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

# 启用站点
ln -s /etc/nginx/sites-available/lhi /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```

---

### 步骤 6：配置 HTTPS（可选但推荐）

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书
certbot --nginx -d yourdomain.com

# 自动续期
certbot renew --dry-run
```

---

## 🔐 环境变量配置

### 必需的环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `NODE_ENV` | 环境 | `production` |
| `PORT` | 后端端口 | `5000` |
| `DATABASE_URL` | 数据库连接 | `file:./prod.db` |
| `JWT_SECRET` | JWT 密钥 | `<随机强密码>` |
| `JWT_EXPIRES_IN` | Token 过期时间 | `7d` |
| `ADMIN_EMAIL` | 管理员邮箱 | `admin@yourdomain.com` |
| `ADMIN_PASSWORD` | 管理员密码 | `<强密码>` |
| `DEEPSEEK_API_KEY` | DeepSeek API | `sk-xxxxx` |

### 前端环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `VITE_API_URL` | 后端 API 地址 | `https://api.yourdomain.com` |

---

## 💾 数据库迁移

### SQLite → PostgreSQL（推荐生产环境）

1. **在 Railway 创建 PostgreSQL 数据库**

2. **更新 DATABASE_URL**
   ```
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   ```

3. **更新 Prisma Schema**
   ```prisma
   datasource db {
     provider = "postgresql"  // 改为 postgresql
     url      = env("DATABASE_URL")
   }
   ```

4. **运行迁移**
   ```bash
   npx prisma migrate deploy
   ```

---

## 🌐 域名配置

### 方案 1：使用 Vercel 和 Railway 的默认域名

**Vercel 域名**：
```
https://lhi-calculator.vercel.app
```

**Railway 域名**：
```
https://lhi-calculator-production.up.railway.app
```

---

### 方案 2：自定义域名

#### Vercel 配置

1. 在 Vercel 项目设置中点击 "Domains"
2. 添加你的域名：`yourdomain.com`
3. 按照提示配置 DNS 记录：
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   ```

#### Railway 配置

1. 在 Railway 项目设置中点击 "Settings"
2. 添加自定义域名：`api.yourdomain.com`
3. 配置 DNS 记录：
   ```
   Type: CNAME
   Name: api
   Value: <railway-domain>
   ```

---

## ✅ 部署检查清单

### 部署前

- [ ] 本地测试通过
- [ ] 环境变量已准备
- [ ] 数据库方案已选择
- [ ] API Key 已获取
- [ ] 强密码已设置

### 部署后

- [ ] 前端可以访问
- [ ] 后端 API 正常
- [ ] 管理后台可以登录
- [ ] 兑换码生成正常
- [ ] AI 分析功能正常
- [ ] 数据库连接正常
- [ ] HTTPS 证书配置（如果需要）

### 测试流程

```bash
# 1. 测试后端健康检查
curl https://api.yourdomain.com/api/health

# 2. 测试前端访问
curl https://yourdomain.com

# 3. 测试完整流程
# - 访问前端
# - 输入万能码 LHI159951
# - 完成问卷
# - 查看报告
# - 测试分享功能

# 4. 测试管理后台
# - 访问 /admin
# - 登录
# - 生成兑换码
# - 查看统计数据
```

---

## 🔧 故障排查

### 前端无法连接后端

**检查**：
```bash
# 查看前端环境变量
echo $VITE_API_URL

# 查看浏览器控制台错误
# F12 → Console → Network
```

**解决**：
- 确保 `VITE_API_URL` 指向正确的后端地址
- 检查后端是否启用了 CORS
- 确认后端 URL 是 HTTPS（如果前端是 HTTPS）

---

### 数据库连接失败

**检查**：
```bash
# 查看后端日志
pm2 logs lhi-backend

# 或 Railway 日志
railway logs
```

**解决**：
- 确认 `DATABASE_URL` 格式正确
- 检查数据库文件权限
- 运行 `npx prisma migrate deploy`

---

### DeepSeek API 调用失败

**检查**：
```bash
# 测试 API Key
curl -X POST https://api.deepseek.com/v1/chat/completions \
  -H "Authorization: Bearer $DEEPSEEK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"hi"}]}'
```

**解决**：
- 确认 API Key 有效
- 检查账户余额
- 查看 API 调用限制

---

## 📊 性能优化

### 1. CDN 配置

Vercel 和 Railway 自动提供 CDN。

### 2. 缓存策略

在 `vite.config.ts` 中：

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
});
```

### 3. 压缩

Nginx 配置：

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

---

## 🔒 安全建议

### 1. 环境变量

- ✅ 使用强密码
- ✅ 定期更换 JWT_SECRET
- ✅ 不要在代码中硬编码密钥

### 2. HTTPS

- ✅ 生产环境必须使用 HTTPS
- ✅ 配置 SSL 证书
- ✅ 强制 HTTPS 重定向

### 3. 数据库

- ✅ 定期备份
- ✅ 限制访问权限
- ✅ 使用生产级数据库（PostgreSQL）

### 4. API 限流

在后端添加：

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制100次请求
});

app.use('/api/', limiter);
```

---

## 📈 监控和日志

### Railway 监控

- 内置监控面板
- 自动日志收集
- 性能指标

### PM2 监控

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs

# 监控
pm2 monit
```

### 第三方监控（可选）

- Sentry（错误追踪）
- DataDog（性能监控）
- Uptime Robot（可用性监控）

---

## 💰 成本估算

### Vercel + Railway

| 服务 | 费用 | 说明 |
|------|------|------|
| Vercel | $0 | 前端托管（免费版） |
| Railway | $5-10/月 | 后端 + 数据库 |
| **总计** | **$5-10/月** | |

### VPS

| 服务 | 费用 | 说明 |
|------|------|------|
| DigitalOcean | $6/月 | 1GB RAM |
| Linode | $5/月 | 1GB RAM |
| Vultr | $6/月 | 1GB RAM |
| **总计** | **$5-6/月** | |

---

## 🎉 部署完成

恭喜！你的 LHI Calculator 已经成功部署到云端。

**下一步**：
1. 测试所有功能
2. 配置域名（可选）
3. 设置监控
4. 备份数据库
5. 推广应用

**获取帮助**：
- [Vercel 文档](https://vercel.com/docs)
- [Railway 文档](https://docs.railway.app/)
- [PM2 文档](https://pm2.keymetrics.io/docs/)

---

**部署时间**: 2025-12-05  
**文档版本**: v1.0  
**维护者**: LHI Team
