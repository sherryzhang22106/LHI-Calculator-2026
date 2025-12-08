#!/bin/bash

# ================================================================
# LHI Calculator 阿里云 ECS 自动部署脚本
# ================================================================
# 服务器信息：
# - IP: 47.110.80.77
# - 系统: Alibaba Cloud Linux 3.2104 LTS 64位
# - 配置: 2核 2GB
# ================================================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    log_error "请使用 root 用户运行此脚本"
    exit 1
fi

log_info "开始部署 LHI Calculator 到阿里云 ECS..."

# ================================================================
# 步骤 1: 系统更新和安装基础软件
# ================================================================
log_info "步骤 1/8: 更新系统并安装基础软件..."

yum update -y
yum install -y git wget curl vim

log_success "系统更新完成"

# ================================================================
# 步骤 2: 安装 Node.js 20
# ================================================================
log_info "步骤 2/8: 安装 Node.js 20..."

if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    log_warning "Node.js 已安装: $NODE_VERSION"
else
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs
    log_success "Node.js 20 安装完成"
fi

node -v
npm -v

# ================================================================
# 步骤 3: 安装 PM2
# ================================================================
log_info "步骤 3/8: 安装 PM2..."

if command -v pm2 &> /dev/null; then
    log_warning "PM2 已安装"
else
    npm install -g pm2
    log_success "PM2 安装完成"
fi

pm2 -v

# ================================================================
# 步骤 4: 安装 Nginx
# ================================================================
log_info "步骤 4/8: 安装和配置 Nginx..."

if command -v nginx &> /dev/null; then
    log_warning "Nginx 已安装"
else
    yum install -y nginx
    systemctl enable nginx
    log_success "Nginx 安装完成"
fi

nginx -v

# ================================================================
# 步骤 5: 克隆项目代码
# ================================================================
log_info "步骤 5/8: 克隆项目代码..."

PROJECT_DIR="/var/www/lhi-calculator"

if [ -d "$PROJECT_DIR" ]; then
    log_warning "项目目录已存在，正在备份..."
    mv "$PROJECT_DIR" "${PROJECT_DIR}.backup.$(date +%Y%m%d%H%M%S)"
fi

mkdir -p /var/www
cd /var/www

# 如果是从本地上传，跳过 git clone
if [ -f "/tmp/lhi-calculator.tar.gz" ]; then
    log_info "使用本地代码包..."
    tar -xzf /tmp/lhi-calculator.tar.gz
    mv lhi-calculator $PROJECT_DIR
else
    log_warning "未找到本地代码包，请手动上传代码"
    log_info "或者提供 Git 仓库地址"
    exit 1
fi

cd $PROJECT_DIR
log_success "项目代码准备完成"

# ================================================================
# 步骤 6: 配置环境变量
# ================================================================
log_info "步骤 6/8: 配置环境变量..."

cat > server/.env << 'EOF'
# 服务器配置
NODE_ENV=production
PORT=5000

# 数据库
DATABASE_URL="file:./prod.db"

# JWT 配置
JWT_SECRET=lhi-aliyun-production-jwt-secret-2024-12-05-change-this
JWT_EXPIRES_IN=7d

# 管理员账户
ADMIN_EMAIL=admin@lhi.local
ADMIN_PASSWORD=Admin123456

# DeepSeek API
DEEPSEEK_API_KEY=sk-448ce19cde5643e7894695332072dd58
EOF

log_success "环境变量配置完成"

# ================================================================
# 步骤 7: 部署后端服务
# ================================================================
log_info "步骤 7/8: 部署后端服务..."

cd $PROJECT_DIR/server

log_info "安装后端依赖..."
npm install --production

log_info "生成 Prisma Client..."
npx prisma generate

log_info "运行数据库迁移..."
npx prisma migrate deploy

log_info "构建后端..."
npm run build

log_info "创建管理员账户..."
npm run seed || log_warning "管理员账户可能已存在"

log_info "创建万能测试码..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    await prisma.accessCode.upsert({
      where: { code: 'LHI159951' },
      update: {},
      create: { code: 'LHI159951', batchId: 'MASTER_CODE' }
    });
    console.log('✓ 万能测试码已创建: LHI159951');
  } catch (e) {
    console.log('万能测试码已存在');
  } finally {
    await prisma.\$disconnect();
  }
})();
" || log_warning "万能测试码可能已存在"

# 停止旧的后端服务（如果存在）
pm2 delete lhi-backend 2>/dev/null || true

# 启动后端服务
log_info "启动后端服务..."
pm2 start dist/index.js --name lhi-backend
pm2 save
pm2 startup

log_success "后端服务部署完成"

# ================================================================
# 步骤 8: 部署前端服务
# ================================================================
log_info "步骤 8/8: 部署前端服务..."

cd $PROJECT_DIR

log_info "安装前端依赖..."
npm install

log_info "构建前端（使用生产环境 API）..."
VITE_API_URL=http://47.110.80.77/api npm run build

log_info "复制前端文件到 Nginx 目录..."
rm -rf /var/www/lhi-frontend
cp -r dist /var/www/lhi-frontend

log_success "前端服务部署完成"

# ================================================================
# 步骤 9: 配置 Nginx
# ================================================================
log_info "配置 Nginx..."

cat > /etc/nginx/conf.d/lhi.conf << 'EOF'
server {
    listen 80;
    server_name 47.110.80.77;

    # 日志
    access_log /var/log/nginx/lhi-access.log;
    error_log /var/log/nginx/lhi-error.log;

    # 前端
    location / {
        root /var/www/lhi-frontend;
        index index.html;
        try_files $uri $uri/ /index.html;

        # 缓存控制
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
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
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

log_info "测试 Nginx 配置..."
nginx -t

log_info "重启 Nginx..."
systemctl restart nginx

log_success "Nginx 配置完成"

# ================================================================
# 步骤 10: 配置防火墙
# ================================================================
log_info "配置防火墙..."

# 阿里云安全组应该已经配置，这里只是本地防火墙
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    log_success "防火墙配置完成"
else
    log_warning "未检测到 firewalld，请确保阿里云安全组已开放 80 和 443 端口"
fi

# ================================================================
# 部署完成
# ================================================================
echo ""
echo "================================================================"
log_success "🎉 部署完成！"
echo "================================================================"
echo ""
echo -e "${GREEN}访问信息：${NC}"
echo "  前端地址: http://47.110.80.77/"
echo "  管理后台: http://47.110.80.77/admin"
echo "  后端 API: http://47.110.80.77/api/health"
echo ""
echo -e "${GREEN}管理员登录：${NC}"
echo "  邮箱: admin@lhi.local"
echo "  密码: Admin123456"
echo ""
echo -e "${GREEN}万能测试码：${NC}"
echo "  LHI159951"
echo ""
echo -e "${YELLOW}下一步：${NC}"
echo "  1. 访问 http://47.110.80.77/ 测试前端"
echo "  2. 输入测试码 LHI159951 完成一次测评"
echo "  3. 访问 /admin 登录管理后台"
echo "  4. 修改管理员密码"
echo "  5. 生成正式兑换码"
echo ""
echo -e "${YELLOW}查看服务状态：${NC}"
echo "  后端状态: pm2 status"
echo "  后端日志: pm2 logs lhi-backend"
echo "  Nginx 状态: systemctl status nginx"
echo "  Nginx 日志: tail -f /var/log/nginx/lhi-error.log"
echo ""
echo "================================================================"
