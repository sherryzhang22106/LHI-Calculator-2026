# 阿里云 ECS 手动部署指南

## 🔐 服务器登录配置

你的服务器**禁用了密码登录**，只允许**密钥登录**。

### 方式 1：使用密钥登录（推荐）

1. **下载密钥文件**
   - 登录阿里云控制台
   - 找到你的 ECS 实例
   - 点击「更多」→「密钥对」→「查看/下载密钥」
   - 下载 `.pem` 文件到本地

2. **设置密钥权限**
   ```bash
   chmod 400 ~/Downloads/your-key.pem
   ```

3. **使用密钥连接**
   ```bash
   ssh -i ~/Downloads/your-key.pem root@47.110.80.77
   ```

---

### 方式 2：开启密码登录

1. **登录阿里云控制台**
   - https://ecs.console.aliyun.com/

2. **找到你的实例**
   - 华东1（杭州）
   - 47.110.80.77

3. **重置密码并开启密码登录**
   - 点击「更多」→「密码/密钥」→「重置实例密码」
   - 重启实例

4. **修改 SSH 配置**
   连接到服务器后：
   ```bash
   vi /etc/ssh/sshd_config
   # 找到并修改这一行：
   PasswordAuthentication yes
   
   # 重启 SSH 服务
   systemctl restart sshd
   ```

---

## 🚀 手动部署步骤（推荐）

### 步骤 1：连接到服务器

使用密钥或密码连接：
```bash
# 方式A：使用密钥
ssh -i ~/Downloads/your-key.pem root@47.110.80.77

# 方式B：使用密码（如果已开启）
ssh root@47.110.80.77
# 输入密码：zhangli1106
```

---

### 步骤 2：在服务器上执行以下命令

连接成功后，**复制粘贴下面的完整脚本**，一次性执行：

```bash
#!/bin/bash
set -e

echo "==================== LHI Calculator 部署开始 ===================="

# 1. 更新系统
echo "1/9 更新系统..."
yum update -y
yum install -y git wget curl vim

# 2. 安装 Node.js 20
echo "2/9 安装 Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs
fi
echo "✓ Node.js $(node -v) 已安装"

# 3. 安装 PM2
echo "3/9 安装 PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi
echo "✓ PM2 已安装"

# 4. 安装 Nginx
echo "4/9 安装 Nginx..."
if ! command -v nginx &> /dev/null; then
    yum install -y nginx
    systemctl enable nginx
fi
echo "✓ Nginx 已安装"

# 5. 创建项目目录
echo "5/9 创建项目目录..."
PROJECT_DIR="/var/www/lhi-calculator"
if [ -d "$PROJECT_DIR" ]; then
    rm -rf "${PROJECT_DIR}.old"
    mv "$PROJECT_DIR" "${PROJECT_DIR}.old"
fi
mkdir -p $PROJECT_DIR

echo "✓ 项目目录创建完成"
echo ""
echo "==================== 请上传代码 ===================="
echo "在本地 Mac 终端新开一个窗口，执行："
echo ""
echo "cd /Users/a1/Downloads/001/lhi-calculator"
echo "tar --exclude='node_modules' --exclude='dist' --exclude='*.db' --exclude='.git' -czf /tmp/lhi-code.tar.gz ."
echo ""
echo "然后上传到服务器（使用密钥）："
echo "scp -i ~/Downloads/your-key.pem /tmp/lhi-code.tar.gz root@47.110.80.77:/tmp/"
echo ""
echo "或者使用密码方式："
echo "scp /tmp/lhi-code.tar.gz root@47.110.80.77:/tmp/"
echo ""
echo "上传完成后，按回车继续..."
read

# 6. 解压代码
echo "6/9 解压代码..."
cd $PROJECT_DIR
tar -xzf /tmp/lhi-code.tar.gz
echo "✓ 代码解压完成"

# 7. 配置环境变量
echo "7/9 配置环境变量..."
cat > server/.env << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL="file:./prod.db"
JWT_SECRET=lhi-aliyun-production-jwt-secret-2024-12-05
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@lhi.local
ADMIN_PASSWORD=Admin123456
DEEPSEEK_API_KEY=sk-448ce19cde5643e7894695332072dd58
EOF
echo "✓ 环境变量配置完成"

# 8. 部署后端
echo "8/9 部署后端..."
cd server
echo "  - 安装依赖..."
npm install --production
echo "  - 生成 Prisma Client..."
npx prisma generate
echo "  - 数据库迁移..."
npx prisma migrate deploy
echo "  - 构建后端..."
npm run build
echo "  - 创建管理员账户..."
npm run seed || true
echo "  - 创建万能测试码..."
node << 'ENDNODE'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    await prisma.accessCode.upsert({
      where: { code: 'LHI159951' },
      update: {},
      create: { code: 'LHI159951', batchId: 'MASTER_CODE', isUsed: false }
    });
    console.log('✓ 万能测试码已创建: LHI159951');
  } catch (e) {
    console.log('万能测试码已存在');
  } finally {
    await prisma.$disconnect();
  }
})();
ENDNODE

echo "  - 启动后端服务..."
pm2 delete lhi-backend 2>/dev/null || true
pm2 start dist/index.js --name lhi-backend
pm2 save
pm2 startup
echo "✓ 后端服务启动成功"

# 9. 部署前端
echo "9/9 部署前端..."
cd $PROJECT_DIR
echo "  - 安装依赖..."
npm install
echo "  - 构建前端..."
VITE_API_URL=http://47.110.80.77/api npm run build
echo "  - 复制文件..."
rm -rf /var/www/lhi-frontend
cp -r dist /var/www/lhi-frontend
echo "✓ 前端构建完成"

# 10. 配置 Nginx
echo "10/10 配置 Nginx..."
cat > /etc/nginx/conf.d/lhi.conf << 'EOF'
server {
    listen 80;
    server_name 47.110.80.77;

    access_log /var/log/nginx/lhi-access.log;
    error_log /var/log/nginx/lhi-error.log;

    location / {
        root /var/www/lhi-frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

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

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
EOF

nginx -t
systemctl restart nginx
echo "✓ Nginx 配置完成"

echo ""
echo "==================== 部署完成！ ===================="
echo ""
echo "访问信息："
echo "  🌐 前端: http://47.110.80.77/"
echo "  🔐 管理后台: http://47.110.80.77/admin"
echo "  🔧 API: http://47.110.80.77/api/health"
echo ""
echo "登录信息："
echo "  📧 邮箱: admin@lhi.local"
echo "  🔑 密码: Admin123456"
echo ""
echo "测试码：LHI159951"
echo ""
```

---

## 📤 代码上传命令（在本地Mac执行）

在本地打开**新的终端窗口**，执行：

```bash
# 1. 打包代码
cd /Users/a1/Downloads/001/lhi-calculator
tar --exclude='node_modules' --exclude='dist' --exclude='*.db' --exclude='.git' -czf /tmp/lhi-code.tar.gz .

# 2. 上传到服务器（使用密钥）
scp -i ~/Downloads/your-key.pem /tmp/lhi-code.tar.gz root@47.110.80.77:/tmp/

# 或使用密码方式（如果已开启）
scp /tmp/lhi-code.tar.gz root@47.110.80.77:/tmp/
# 输入密码：zhangli1106
```

---

## ✅ 验证部署

### 1. 测试后端
```bash
curl http://47.110.80.77/api/health
# 应该返回：{"status":"ok","timestamp":"..."}
```

### 2. 测试前端
在浏览器访问：
```
http://47.110.80.77/
```

### 3. 完整测试流程
1. 访问 http://47.110.80.77/
2. 输入测试码：LHI159951
3. 完成40道问卷
4. 查看AI分析报告
5. 测试分享功能

### 4. 测试管理后台
1. 访问 http://47.110.80.77/admin
2. 邮箱：admin@lhi.local
3. 密码：Admin123456
4. 生成新兑换码
5. 查看统计数据

---

## 🔧 常用命令

### 查看服务状态
```bash
# 后端状态
pm2 status
pm2 logs lhi-backend

# Nginx 状态
systemctl status nginx
tail -f /var/log/nginx/lhi-error.log
```

### 重启服务
```bash
# 重启后端
pm2 restart lhi-backend

# 重启 Nginx
systemctl restart nginx
```

### 更新代码
```bash
# 1. 在本地打包新代码
cd /Users/a1/Downloads/001/lhi-calculator
tar --exclude='node_modules' --exclude='dist' --exclude='*.db' --exclude='.git' -czf /tmp/lhi-code.tar.gz .

# 2. 上传到服务器
scp -i ~/Downloads/your-key.pem /tmp/lhi-code.tar.gz root@47.110.80.77:/tmp/

# 3. 在服务器上执行
cd /var/www/lhi-calculator
tar -xzf /tmp/lhi-code.tar.gz

# 4. 重新构建
cd server && npm run build && pm2 restart lhi-backend
cd .. && npm run build && cp -r dist /var/www/lhi-frontend
```

---

## 🆘 常见问题

### 问题1：无法连接服务器
**解决**：
1. 检查阿里云安全组是否开放22端口
2. 确认使用正确的密钥文件
3. 确认密钥权限：`chmod 400 your-key.pem`

### 问题2：端口80被占用
**解决**：
```bash
# 查看80端口占用
lsof -i:80

# 停止占用的服务
systemctl stop httpd  # 如果是 Apache
```

### 问题3：Nginx 配置错误
**解决**：
```bash
# 测试配置
nginx -t

# 查看错误日志
tail -50 /var/log/nginx/error.log
```

---

## 📞 下一步

1. **连接到服务器**
   - 使用密钥或密码
   
2. **复制粘贴部署脚本**
   - 一次性执行完整脚本
   
3. **上传代码包**
   - 在本地执行 scp 命令
   
4. **继续部署**
   - 在服务器按回车继续
   
5. **测试验证**
   - 访问 http://47.110.80.77/

---

预计时间：15-20分钟  
难度：⭐⭐☆☆☆
