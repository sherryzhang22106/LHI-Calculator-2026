#!/usr/bin/expect -f

# ================================================================
# LHI Calculator 自动部署脚本 (使用 expect)
# ================================================================

set timeout 600
set server_ip "47.110.80.77"
set server_user "root"
set server_password "zhangli1106"
set server_port "22"
set local_dir "/Users/a1/Downloads/001/lhi-calculator"

puts "\n==================== LHI Calculator 部署开始 ====================\n"
puts "目标服务器: $server_ip"
puts "操作系统: Alibaba Cloud Linux 3.2104 LTS\n"

# 1. 打包代码
puts "正在打包代码..."
cd $local_dir
exec tar --exclude='node_modules' --exclude='dist' --exclude='*.db' --exclude='*.log' --exclude='.git' -czf /tmp/lhi-calculator.tar.gz .
puts "✓ 代码打包完成\n"

# 2. 上传代码包
puts "正在上传代码..."
spawn scp -P $server_port /tmp/lhi-calculator.tar.gz $server_user@$server_ip:/tmp/
expect {
    "Are you sure you want to continue connecting" {
        send "yes\r"
        exp_continue
    }
    "password:" {
        send "$server_password\r"
    }
}
expect eof
puts "✓ 代码上传完成\n"

# 3. 连接服务器并部署
puts "连接到服务器执行部署...\n"
spawn ssh -p $server_port $server_user@$server_ip
expect {
    "Are you sure you want to continue connecting" {
        send "yes\r"
        exp_continue
    }
    "password:" {
        send "$server_password\r"
    }
}

expect "#"

# 开始部署命令
send "echo '==================== 服务器端部署开始 ===================='\r"
expect "#"

# 1. 更新系统
send "echo '1/9 更新系统...'\r"
expect "#"
send "yum update -y >/dev/null 2>&1 && yum install -y git wget curl vim >/dev/null 2>&1\r"
expect "#"
send "echo '✓ 系统更新完成'\r"
expect "#"

# 2. 安装 Node.js
send "echo '2/9 安装 Node.js 20...'\r"
expect "#"
send "if ! command -v node &> /dev/null; then curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - >/dev/null 2>&1 && yum install -y nodejs >/dev/null 2>&1; fi\r"
expect -timeout 180 "#"
send "echo \"✓ Node.js \$(node -v) 已安装\"\r"
expect "#"

# 3. 安装 PM2
send "echo '3/9 安装 PM2...'\r"
expect "#"
send "if ! command -v pm2 &> /dev/null; then npm install -g pm2 >/dev/null 2>&1; fi\r"
expect -timeout 120 "#"
send "echo '✓ PM2 已安装'\r"
expect "#"

# 4. 安装 Nginx
send "echo '4/9 安装 Nginx...'\r"
expect "#"
send "if ! command -v nginx &> /dev/null; then yum install -y nginx >/dev/null 2>&1 && systemctl enable nginx >/dev/null 2>&1; fi\r"
expect "#"
send "echo '✓ Nginx 已安装'\r"
expect "#"

# 5. 解压代码
send "echo '5/9 解压项目代码...'\r"
expect "#"
send "PROJECT_DIR=/var/www/lhi-calculator\r"
expect "#"
send "if \[ -d \"\$PROJECT_DIR\" \]; then rm -rf \${PROJECT_DIR}.old && mv \$PROJECT_DIR \${PROJECT_DIR}.old; fi\r"
expect "#"
send "mkdir -p /var/www && cd /var/www\r"
expect "#"
send "mkdir -p lhi-calculator && cd lhi-calculator && tar -xzf /tmp/lhi-calculator.tar.gz\r"
expect "#"
send "echo '✓ 代码解压完成'\r"
expect "#"

# 6. 配置环境变量
send "echo '6/9 配置环境变量...'\r"
expect "#"
send "cat > /var/www/lhi-calculator/server/.env << 'EOFENV'\r"
send "NODE_ENV=production\r"
send "PORT=5000\r"
send "DATABASE_URL=\"file:./prod.db\"\r"
send "JWT_SECRET=lhi-aliyun-production-jwt-secret-2024-12-05\r"
send "JWT_EXPIRES_IN=7d\r"
send "ADMIN_EMAIL=admin@lhi.local\r"
send "ADMIN_PASSWORD=Admin123456\r"
send "DEEPSEEK_API_KEY=sk-448ce19cde5643e7894695332072dd58\r"
send "EOFENV\r"
expect "#"
send "echo '✓ 环境变量配置完成'\r"
expect "#"

# 7. 部署后端
send "echo '7/9 部署后端服务...'\r"
expect "#"
send "cd /var/www/lhi-calculator/server\r"
expect "#"
send "npm install --production >/dev/null 2>&1\r"
expect -timeout 180 "#"
send "npx prisma generate >/dev/null 2>&1\r"
expect -timeout 60 "#"
send "npx prisma migrate deploy >/dev/null 2>&1\r"
expect "#"
send "npm run build >/dev/null 2>&1\r"
expect -timeout 60 "#"
send "npm run seed >/dev/null 2>&1 || true\r"
expect "#"

# 创建万能测试码
send "node -e \"const \{ PrismaClient \} = require\('@prisma/client'\); const prisma = new PrismaClient\(\); \(async \(\) => \{ try \{ await prisma.accessCode.upsert\(\{ where: \{ code: 'LHI159951' \}, update: \{\}, create: \{ code: 'LHI159951', batchId: 'MASTER_CODE', isUsed: false \} \}\); console.log\('✓ 万能测试码已创建'\); \} catch \(e\) \{ console.log\('万能测试码已存在'\); \} finally \{ await prisma.\\\$disconnect\(\); \} \}\)\(\);\"\r"
expect "#"

send "pm2 delete lhi-backend 2>/dev/null || true\r"
expect "#"
send "pm2 start dist/index.js --name lhi-backend >/dev/null 2>&1\r"
expect "#"
send "pm2 save >/dev/null 2>&1\r"
expect "#"
send "echo '✓ 后端服务启动成功'\r"
expect "#"

# 8. 部署前端
send "echo '8/9 部署前端服务...'\r"
expect "#"
send "cd /var/www/lhi-calculator\r"
expect "#"
send "npm install >/dev/null 2>&1\r"
expect -timeout 180 "#"
send "VITE_API_URL=http://47.110.80.77/api npm run build >/dev/null 2>&1\r"
expect -timeout 120 "#"
send "rm -rf /var/www/lhi-frontend\r"
expect "#"
send "cp -r dist /var/www/lhi-frontend\r"
expect "#"
send "echo '✓ 前端构建完成'\r"
expect "#"

# 9. 配置 Nginx
send "echo '9/9 配置 Nginx...'\r"
expect "#"
send "cat > /etc/nginx/conf.d/lhi.conf << 'EOFNGINX'\r"
send "server \{\r"
send "    listen 80;\r"
send "    server_name 47.110.80.77;\r"
send "    access_log /var/log/nginx/lhi-access.log;\r"
send "    error_log /var/log/nginx/lhi-error.log;\r"
send "    location / \{\r"
send "        root /var/www/lhi-frontend;\r"
send "        index index.html;\r"
send "        try_files \\\$uri \\\$uri/ /index.html;\r"
send "    \}\r"
send "    location /api \{\r"
send "        proxy_pass http://localhost:5000;\r"
send "        proxy_http_version 1.1;\r"
send "        proxy_set_header Upgrade \\\$http_upgrade;\r"
send "        proxy_set_header Connection 'upgrade';\r"
send "        proxy_set_header Host \\\$host;\r"
send "        proxy_cache_bypass \\\$http_upgrade;\r"
send "        proxy_set_header X-Real-IP \\\$remote_addr;\r"
send "        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;\r"
send "    \}\r"
send "    gzip on;\r"
send "    gzip_types text/plain text/css application/json application/javascript;\r"
send "\}\r"
send "EOFNGINX\r"
expect "#"
send "nginx -t\r"
expect "#"
send "systemctl restart nginx\r"
expect "#"
send "echo '✓ Nginx 配置完成'\r"
expect "#"

# 完成
send "echo ''\r"
expect "#"
send "echo '==================== 部署完成！ ===================='\r"
expect "#"
send "echo ''\r"
expect "#"
send "echo '访问信息：'\r"
expect "#"
send "echo '  🌐 前端: http://47.110.80.77/'\r"
expect "#"
send "echo '  🔐 管理后台: http://47.110.80.77/admin'\r"
expect "#"
send "echo '  🔧 API: http://47.110.80.77/api/health'\r"
expect "#"
send "echo ''\r"
expect "#"
send "echo '登录信息：'\r"
expect "#"
send "echo '  📧 邮箱: admin@lhi.local'\r"
expect "#"
send "echo '  🔑 密码: Admin123456'\r"
expect "#"
send "echo ''\r"
expect "#"
send "echo '测试码：LHI159951'\r"
expect "#"
send "echo ''\r"
expect "#"

send "exit\r"
expect eof

puts "\n✓ 部署完成！\n"
puts "访问 http://47.110.80.77/ 查看应用\n"
