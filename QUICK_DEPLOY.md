# 🚀 5分钟快速部署指南

## 方案：Vercel + Railway（最简单）

### 1️⃣ 准备密钥（2分钟）

```bash
# 生成 JWT Secret
openssl rand -base64 32
# 复制输出，稍后使用

# 获取 DeepSeek API Key
# 访问：https://platform.deepseek.com/api_keys
# 创建并复制 API Key
```

---

### 2️⃣ 推送代码到 GitHub（1分钟）

```bash
cd /Users/a1/Downloads/001/lhi-calculator

# 初始化 Git
git init
git add .
git commit -m "Initial commit"

# 推送到 GitHub（替换为你的仓库地址）
git remote add origin https://github.com/your-username/lhi-calculator.git
git branch -M main
git push -u origin main
```

---

### 3️⃣ 部署后端到 Railway（3分钟）

1. **访问** https://railway.app/
2. **登录** 使用 GitHub 账号
3. **New Project** → **Deploy from GitHub repo**
4. **选择** `lhi-calculator` 仓库
5. **配置服务**：
   - Root Directory: `server`
   - Build Command: `npm install && npm run prisma:generate && npm run build`
   - Start Command: `npm start`

6. **添加环境变量**（Settings → Variables）：
   ```env
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=file:./prod.db
   JWT_SECRET=<步骤1生成的密钥>
   JWT_EXPIRES_IN=7d
   ADMIN_EMAIL=admin@yourdomain.com
   ADMIN_PASSWORD=Admin123456!
   DEEPSEEK_API_KEY=<你的DeepSeek API Key>
   ```

7. **记录 URL**：Railway 生成的域名（如：`https://xxx.up.railway.app`）

---

### 4️⃣ 部署前端到 Vercel（3分钟）

1. **访问** https://vercel.com/
2. **登录** 使用 GitHub 账号
3. **Add New Project**
4. **选择** `lhi-calculator` 仓库
5. **Import**
6. **添加环境变量**（Settings → Environment Variables）：
   ```env
   VITE_API_URL=<步骤3的Railway URL>
   ```
7. **Deploy**
8. **记录 URL**：Vercel 生成的域名（如：`https://xxx.vercel.app`）

---

### 5️⃣ 初始化数据库（1分钟）

在 Railway 项目中打开 Shell：

```bash
# 运行数据库迁移
npx prisma migrate deploy

# 创建管理员账户
npm run seed
```

---

### 6️⃣ 测试（1分钟）

1. **访问前端**：打开 Vercel 的 URL
2. **输入万能码**：`LHI159951`
3. **完成问卷**
4. **查看报告**

---

## ✅ 完成！

**你的应用已上线**：
- 前端：https://xxx.vercel.app
- 后端：https://xxx.up.railway.app
- 管理后台：https://xxx.vercel.app/admin

**管理员登录**：
- 邮箱：admin@yourdomain.com
- 密码：Admin123456!

---

## 🔧 常见问题

### 前端连接不到后端
**解决**：确保 Vercel 的 `VITE_API_URL` 环境变量正确设置为 Railway 的 URL

### 数据库未初始化
**解决**：在 Railway Shell 中运行：
```bash
npx prisma migrate deploy
npm run seed
```

### AI 分析失败
**解决**：检查 `DEEPSEEK_API_KEY` 是否正确，账户是否有余额

---

## 📝 下一步

1. **修改管理员密码**：登录管理后台后修改
2. **生成兑换码**：在管理后台生成正式兑换码
3. **配置自定义域名**（可选）：在 Vercel 和 Railway 设置

---

**预计总时间**：10分钟  
**成本**：$5-10/月  
**难度**：⭐⭐☆☆☆
