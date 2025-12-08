# 🚀 LHI Calculator 部署检查清单

## 📋 部署前准备（5分钟）

### 1. 密钥准备
```bash
# 生成 JWT Secret
openssl rand -base64 32

# 准备 DeepSeek API Key
# 访问：https://platform.deepseek.com/api_keys
```

- [ ] JWT_SECRET 已生成
- [ ] DEEPSEEK_API_KEY 已获取
- [ ] 管理员密码已设置（强密码）

---

### 2. 代码仓库准备
```bash
# 初始化 Git
git init
git add .
git commit -m "Ready for deployment"

# 推送到 GitHub
git remote add origin https://github.com/your-username/lhi-calculator.git
git push -u origin main
```

- [ ] Git 仓库已初始化
- [ ] 代码已推送到 GitHub
- [ ] `.env` 文件未被提交（已在 .gitignore）

---

## 🌟 方案一：Vercel + Railway（推荐，15分钟）

### 步骤 1：部署后端到 Railway

1. **注册并登录**
   - [ ] 访问 https://railway.app/
   - [ ] 使用 GitHub 登录

2. **创建项目**
   - [ ] 点击 "New Project"
   - [ ] 选择 "Deploy from GitHub repo"
   - [ ] 选择 `lhi-calculator` 仓库

3. **配置服务**
   - [ ] Root Directory: `server`
   - [ ] Build Command: `npm install && npm run prisma:generate && npm run build`
   - [ ] Start Command: `npm start`

4. **添加环境变量**（Settings → Variables）
   ```env
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=file:./prod.db
   JWT_SECRET=<你生成的密钥>
   JWT_EXPIRES_IN=7d
   ADMIN_EMAIL=admin@yourdomain.com
   ADMIN_PASSWORD=<强密码>
   DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxx
   ```
   - [ ] 所有环境变量已添加

5. **获取后端 URL**
   - [ ] 记录 Railway 生成的域名（如：`https://lhi-production.up.railway.app`）

---

### 步骤 2：部署前端到 Vercel

1. **注册并登录**
   - [ ] 访问 https://vercel.com/
   - [ ] 使用 GitHub 登录

2. **导入项目**
   - [ ] 点击 "Add New Project"
   - [ ] 选择 `lhi-calculator` 仓库
   - [ ] 点击 "Import"

3. **配置构建**
   - [ ] Framework: Vite（自动检测）
   - [ ] Root Directory: `./`
   - [ ] Build Command: `npm install && npm run build`
   - [ ] Output Directory: `dist`

4. **添加环境变量**（Settings → Environment Variables）
   ```env
   VITE_API_URL=https://lhi-production.up.railway.app
   ```
   - [ ] 替换为你的 Railway 后端 URL
   - [ ] 环境变量已添加

5. **部署**
   - [ ] 点击 "Deploy"
   - [ ] 等待构建完成（2-3分钟）
   - [ ] 记录前端 URL（如：`https://lhi-calculator.vercel.app`）

---

### 步骤 3：初始化数据库（Railway）

1. **打开 Railway 终端**
   - [ ] 进入项目 → 点击 "Shell" 或 "Terminal"

2. **运行命令**
   ```bash
   # 运行数据库迁移
   npx prisma migrate deploy
   
   # 创建管理员账户
   npm run seed
   ```
   - [ ] 迁移成功
   - [ ] 管理员账户创建成功

3. **创建万能测试码**（可选）
   ```bash
   node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); (async () => { await prisma.accessCode.create({ data: { code: 'LHI159951', batchId: 'MASTER_CODE' } }); console.log('✓ Master code created'); })();"
   ```
   - [ ] 万能测试码创建成功

---

### 步骤 4：测试部署

1. **测试后端**
   ```bash
   curl https://你的railway域名/api/health
   # 应该返回：{"status":"ok","timestamp":"..."}
   ```
   - [ ] 后端健康检查通过

2. **测试前端**
   - [ ] 访问 Vercel 前端 URL
   - [ ] 页面正常加载
   - [ ] 输入框显示"输入兑换码"

3. **测试完整流程**
   - [ ] 输入万能码 `LHI159951`
   - [ ] 完成 40 道问卷
   - [ ] 查看分析报告（5个维度都有内容）
   - [ ] 测试分享功能

4. **测试管理后台**
   - [ ] 访问 `/admin`
   - [ ] 使用管理员账户登录
   - [ ] 生成新兑换码（8位格式）
   - [ ] 查看统计数据

---

## 🐳 方案二：Docker 部署（20分钟）

### 步骤 1：准备环境文件

```bash
# 创建 .env.production
cat > .env.production << 'EOF'
JWT_SECRET=your-generated-secret
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-strong-password
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxx
EOF
```
- [ ] `.env.production` 已创建
- [ ] 所有密钥已填写

---

### 步骤 2：构建和启动

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```
- [ ] 镜像构建成功
- [ ] 服务启动成功
- [ ] 日志无错误

---

### 步骤 3：初始化数据库

```bash
# 运行迁移
docker-compose exec backend npx prisma migrate deploy

# 创建管理员
docker-compose exec backend npm run seed
```
- [ ] 数据库迁移成功
- [ ] 管理员账户创建成功

---

### 步骤 4：测试

```bash
# 测试后端
curl http://localhost:5000/api/health

# 测试前端
curl http://localhost:80
```
- [ ] 后端正常响应
- [ ] 前端正常访问

---

## 🖥️ 方案三：VPS 部署（30分钟）

### 步骤 1：服务器准备

```bash
# 连接服务器
ssh root@your-server-ip

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
- [ ] Node.js 已安装
- [ ] PM2 已安装
- [ ] Nginx 已安装

---

### 步骤 2：部署代码

```bash
# 克隆代码
cd /var/www
git clone https://github.com/your-username/lhi-calculator.git
cd lhi-calculator

# 部署后端
cd server
npm install
# 创建 .env 文件（见完整指南）
npx prisma generate
npx prisma migrate deploy
npm run build
npm run seed
pm2 start dist/index.js --name lhi-backend
pm2 save
pm2 startup

# 部署前端
cd ..
npm install
VITE_API_URL=https://yourdomain.com/api npm run build
cp -r dist /var/www/lhi-frontend
```
- [ ] 后端部署成功
- [ ] 前端构建成功

---

### 步骤 3：配置 Nginx

```bash
# 创建配置（见完整指南中的 nginx 配置）
nano /etc/nginx/sites-available/lhi

# 启用站点
ln -s /etc/nginx/sites-available/lhi /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```
- [ ] Nginx 配置正确
- [ ] 站点已启用

---

### 步骤 4：配置 HTTPS（推荐）

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 获取证书
certbot --nginx -d yourdomain.com
```
- [ ] SSL 证书获取成功
- [ ] HTTPS 自动配置完成

---

## ✅ 最终验证清单

### 功能测试

- [ ] **首页访问**：显示正常
- [ ] **兑换码输入**：占位符显示"输入兑换码"
- [ ] **问卷流程**：40题可以正常完成
- [ ] **AI 分析**：
  - [ ] 显示加载动画
  - [ ] 10-15秒内完成
  - [ ] 5个维度都有独立内容
  - [ ] 文本无 Markdown 符号
- [ ] **分享功能**：
  - [ ] 可以生成分享链接
  - [ ] 分享页面显示完整5个维度
  - [ ] 底部文案为"心理学评估工具"
- [ ] **管理后台**：
  - [ ] 可以登录
  - [ ] 可以生成8位兑换码
  - [ ] 统计数据显示正常

---

### 性能测试

- [ ] **首次加载**：< 3秒
- [ ] **API 响应**：< 500ms
- [ ] **AI 分析**：< 20秒
- [ ] **页面切换**：流畅无卡顿

---

### 安全检查

- [ ] **HTTPS**：已启用（生产环境）
- [ ] **强密码**：管理员密码足够强
- [ ] **API Key**：未在代码中暴露
- [ ] **环境变量**：`.env` 未被提交到 Git

---

## 🎉 部署完成！

### 你的应用信息

**前端 URL**：`_______________`  
**后端 URL**：`_______________`  
**管理后台**：`_______________/admin`

**管理员账户**：
- 邮箱：`_______________`
- 密码：`***************`（请妥善保管）

**万能测试码**：`LHI159951`

---

### 下一步

1. **测试所有功能**（使用上面的清单）
2. **配置自定义域名**（可选）
3. **设置数据库备份**
4. **配置监控告警**
5. **推广你的应用**

---

### 获取帮助

- 📖 完整部署指南：`DEPLOYMENT_GUIDE.md`
- 🐛 问题排查：查看服务日志
- 💬 技术支持：检查 GitHub Issues

---

**预计总时间**：
- Vercel + Railway：15分钟
- Docker：20分钟
- VPS：30分钟

**成本**：
- Vercel + Railway：$5-10/月
- VPS：$5-20/月

祝部署顺利！🚀
