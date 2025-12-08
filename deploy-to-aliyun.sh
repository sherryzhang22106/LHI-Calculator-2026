#!/bin/bash

# ================================================================
# LHI Calculator 一键部署到阿里云ECS脚本
# ================================================================
# 此脚本将在你的本地Mac上运行，自动部署到远程服务器
# ================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 服务器信息
SERVER_IP="47.110.80.77"
SERVER_USER="root"
SERVER_PASSWORD="zhangli1106"
SERVER_PORT="22"

# API Key
DEEPSEEK_API_KEY="sk-448ce19cde5643e7894695332072dd58"

# 项目信息
PROJECT_DIR="/var/www/lhi-calculator"
LOCAL_DIR="/Users/a1/Downloads/001/lhi-calculator"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_info "==================== LHI Calculator 部署工具 ===================="
echo ""
log_info "目标服务器: $SERVER_IP"
log_info "操作系统: Alibaba Cloud Linux 3.2104 LTS"
log_info "配置: 2核 2GB"
echo ""

# 检查 sshpass 是否安装
if ! command -v sshpass &> /dev/null; then
    log_info "安装 sshpass..."
    if command -v brew &> /dev/null; then
        brew install hudochenkov/sshpass/sshpass
    else
        log_error "请先安装 Homebrew: https://brew.sh/"
        exit 1
    fi
fi

# 测试SSH连接
log_info "测试SSH连接..."
if sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" "echo 'SSH连接成功'" &> /dev/null; then
    log_success "SSH连接测试通过"
else
    log_error "SSH连接失败，请检查密码和网络"
    exit 1
fi

# 上传代码包
log_info "上传项目代码..."
cd "$LOCAL_DIR"
tar --exclude='node_modules' --exclude='dist' --exclude='*.db' --exclude='*.log' --exclude='.git' -czf /tmp/lhi-calculator.tar.gz .
sshpass -p "$SERVER_PASSWORD" scp -P "$SERVER_PORT" /tmp/lhi-calculator.tar.gz "$SERVER_USER@$SERVER_IP:/tmp/"
log_success "代码上传完成"

# 上传部署脚本
log_info "上传部署脚本..."
sshpass -p "$SERVER_PASSWORD" scp -P "$SERVER_PORT" "$LOCAL_DIR/deploy-aliyun.sh" "$SERVER_USER@$SERVER_IP:/tmp/"
log_success "部署脚本上传完成"

# 执行远程部署
log_info "开始远程部署..."
echo ""

sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no -p "$SERVER_PORT" "$SERVER_USER@$SERVER_IP" bash << 'ENDSSH'
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_info "==================== 服务器端部署开始 ===================="

# 1. 系统更新
log_info "1/9 更新系统..."
yum update -y > /dev/null 2>&1
yum install -y git wget curl vim > /dev/null 2>&1
log_success "系统更新完成"

# 2. 安装 Node.js 20
log_info "2/9 安装 Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    yum install -y nodejs > /dev/null 2>&1
fi
log_success "Node.js $(node -v) 已安装"

# 3. 安装 PM2
log_info "3/9 安装 PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2 > /dev/null 2>&1
fi
log_success "PM2 已安装"

# 4. 安装 Nginx
log_info "4/9 安装 Nginx..."
if ! command -v nginx &> /dev/null; then
    yum install -y nginx > /dev/null 2>&1
    systemctl enable nginx > /dev/null 2>&1
fi
log_success "Nginx 已安装"

# 5. 解压项目代码
log_info "5/9 解压项目代码..."
PROJECT_DIR="/var/www/lhi-calculator"
if [ -d "$PROJECT_DIR" ]; then
    rm -rf "${PROJECT_DIR}.old"
    mv "$PROJECT_DIR" "${PROJECT_DIR}.old"
fi
mkdir -p /var/www
cd /var/www
tar -xzf /tmp/lhi-calculator.tar.gz -C /tmp/lhi-temp && mv /tmp/lhi-temp $PROJECT_DIR || (mkdir -p $PROJECT_DIR && tar -xzf /tmp/lhi-calculator.tar.gz -C $PROJECT_DIR)
log_success "代码解压完成"

# 6. 配置环境变量
log_info "6/9 配置环境变量..."
cat > $PROJECT_DIR/server/.env << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL="file:./prod.db"
JWT_SECRET=lhi-aliyun-production-jwt-secret-2024-12-05
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@lhi.local
ADMIN_PASSWORD=Admin123456
DEEPSEEK_API_KEY=sk-448ce19cde5643e7894695332072dd58
EOF
log_success "环境变量配置完成"

# 7. 部署后端
log_info "7/9 部署后端服务..."
cd $PROJECT_DIR/server
npm install --production > /dev/null 2>&1
npx prisma generate > /dev/null 2>&1
npx prisma migrate deploy > /dev/null 2>&1
npm run build > /dev/null 2>&1
npm run seed > /dev/null 2>&1 || true

# 创建万能测试码
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
    console.log('✓ 万能测试码已创建');
  } catch (e) {
    console.log('万能测试码已存在');
  } finally {
    await prisma.$disconnect();
  }
})();
ENDNODE

pm2 delete lhi-backend 2>/dev/null || true
pm2 start dist/index.js --name lhi-backend > /dev/null 2>&1
pm2 save > /dev/null 2>&1
log_success "后端服务启动成功"

# 8. 部署前端
log_info "8/9 部署前端服务..."
cd $PROJECT_DIR
npm install > /dev/null 2>&1
VITE_API_URL=http://47.110.80.77/api npm run build > /dev/null 2>&1
rm -rf /var/www/lhi-frontend
cp -r dist /var/www/lhi-frontend
log_success "前端构建完成"

# 9. 配置 Nginx
log_info "9/9 配置 Nginx..."
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

nginx -t > /dev/null 2>&1
systemctl restart nginx > /dev/null 2>&1
log_success "Nginx 配置完成"

echo ""
log_success "==================== 部署完成！ ===================="
echo ""
echo -e "${GREEN}访问信息：${NC}"
echo "  🌐 前端: http://47.110.80.77/"
echo "  🔐 管理后台: http://47.110.80.77/admin"
echo "  🔧 API健康检查: http://47.110.80.77/api/health"
echo ""
echo -e "${GREEN}登录信息：${NC}"
echo "  📧 邮箱: admin@lhi.local"
echo "  🔑 密码: Admin123456"
echo ""
echo -e "${GREEN}测试码：${NC}"
echo "  🎫 万能码: LHI159951"
echo ""

ENDSSH

log_success "==================== 本地部署脚本执行完成 ===================="
echo ""
log_info "清理临时文件..."
rm -f /tmp/lhi-calculator.tar.gz

echo ""
log_success "🎉 部署全部完成！"
echo ""
echo "下一步："
echo "  1. 访问 http://47.110.80.77/"
echo "  2. 输入测试码 LHI159951"
echo "  3. 完成一次测评"
echo "  4. 访问 http://47.110.80.77/admin 登录管理后台"
echo ""
