#!/bin/bash
# ================================================================
# LHI Calculator - 阿里云 ECS VNC 部署脚本
# ================================================================
# 在阿里云控制台 VNC 连接中执行此脚本
# ================================================================

set -e

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

echo ""
echo "=========================================================="
echo "           LHI Calculator 自动部署脚本"
echo "=========================================================="
echo ""

# 检查root权限
if [ "$EUID" -ne 0 ]; then 
    log_error "请使用 root 用户运行"
    exit 1
fi

# 1. 系统更新
log_info "1/11 更新系统..."
yum update -y > /dev/null 2>&1
yum install -y git wget curl vim tar > /dev/null 2>&1
log_success "系统更新完成"

# 2. 安装 Node.js 20
log_info "2/11 安装 Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    yum install -y nodejs > /dev/null 2>&1
fi
log_success "Node.js $(node -v) 已安装"

# 3. 安装 PM2
log_info "3/11 安装 PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2 > /dev/null 2>&1
fi
log_success "PM2 $(pm2 -v) 已安装"

# 4. 安装 Nginx
log_info "4/11 安装 Nginx..."
if ! command -v nginx &> /dev/null; then
    yum install -y nginx > /dev/null 2>&1
    systemctl enable nginx > /dev/null 2>&1
fi
log_success "Nginx 已安装"

# 5. 下载项目代码
log_info "5/11 创建项目目录..."
PROJECT_DIR="/var/www/lhi-calculator"
if [ -d "$PROJECT_DIR" ]; then
    log_info "备份旧项目..."
    mv "$PROJECT_DIR" "${PROJECT_DIR}.backup.$(date +%Y%m%d%H%M%S)"
fi
mkdir -p "$PROJECT_DIR"

log_info "提示：请在本地执行以下命令上传代码："
echo ""
echo -e "${YELLOW}# 在本地 Mac 终端执行：${NC}"
echo "cd /Users/a1/Downloads/001/lhi-calculator"
echo "tar --exclude='node_modules' --exclude='dist' --exclude='*.db' --exclude='.git' -czf /tmp/lhi-code.tar.gz ."
echo ""
echo "# 然后上传（不需要密码，用密钥）："
echo "scp -i /Users/a1/Downloads/LHI001.pem /tmp/lhi-code.tar.gz root@47.110.80.77:/tmp/"
echo ""
echo "# 或者如果密钥不对，在阿里云控制台开启密码登录后："
echo "scp /tmp/lhi-code.tar.gz root@47.110.80.77:/tmp/"
echo ""
echo -e "${BLUE}上传完成后按回车继续...${NC}"
read

# 6. 解压代码
log_info "6/11 解压代码..."
if [ ! -f "/tmp/lhi-code.tar.gz" ]; then
    log_error "未找到代码包 /tmp/lhi-code.tar.gz"
    log_info "请先上传代码包，然后重新运行此脚本"
    exit 1
fi
cd "$PROJECT_DIR"
tar -xzf /tmp/lhi-code.tar.gz
log_success "代码解压完成"

# 7. 配置环境变量
log_info "7/11 配置环境变量..."
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
log_success "环境变量配置完成"

# 8. 部署后端
log_info "8/11 部署后端服务（这可能需要几分钟）..."
cd "$PROJECT_DIR/server"

log_info "  - 安装依赖..."
npm install --production

log_info "  - 生成 Prisma Client..."
npx prisma generate

log_info "  - 数据库迁移..."
npx prisma migrate deploy

log_info "  - 构建后端..."
npm run build

log_info "  - 创建管理员账户..."
npm run seed || log_info "管理员可能已存在"

log_info "  - 创建万能测试码..."
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
    console.log('✓ 万能测试码已存在');
  } finally {
    await prisma.$disconnect();
  }
})();
ENDNODE

log_info "  - 启动后端服务..."
pm2 delete lhi-backend 2>/dev/null || true
pm2 start dist/index.js --name lhi-backend
pm2 save
pm2 startup systemd -u root --hp /root > /dev/null 2>&1 || true

log_success "后端服务启动成功"

# 9. 部署前端
log_info "9/11 部署前端服务（这可能需要几分钟）..."
cd "$PROJECT_DIR"

log_info "  - 安装依赖..."
npm install

log_info "  - 构建前端..."
VITE_API_URL=http://47.110.80.77/api npm run build

log_info "  - 复制文件..."
rm -rf /var/www/lhi-frontend
cp -r dist /var/www/lhi-frontend

log_success "前端构建完成"

# 10. 配置 Nginx
log_info "10/11 配置 Nginx..."
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
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
EOF

nginx -t
systemctl restart nginx
log_success "Nginx 配置完成"

# 11. 配置防火墙
log_info "11/11 配置防火墙..."
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http 2>/dev/null || true
    firewall-cmd --permanent --add-service=https 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
    log_success "防火墙配置完成"
else
    log_info "未检测到防火墙，跳过"
fi

# 完成
echo ""
echo "=========================================================="
log_success "🎉 部署完成！"
echo "=========================================================="
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
echo -e "${YELLOW}下一步：${NC}"
echo "  1. 在浏览器访问 http://47.110.80.77/"
echo "  2. 输入测试码 LHI159951 进行测试"
echo "  3. 访问 /admin 登录管理后台"
echo "  4. 修改管理员密码"
echo "  5. 生成正式兑换码"
echo ""
echo -e "${YELLOW}查看服务状态：${NC}"
echo "  pm2 status           # 后端状态"
echo "  pm2 logs lhi-backend # 后端日志"
echo "  systemctl status nginx # Nginx状态"
echo ""
echo "=========================================================="
