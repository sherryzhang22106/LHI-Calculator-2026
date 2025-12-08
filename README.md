# LHI Calculator - 恋爱健康指数评估系统

完整的全栈心理评估应用，包含前端测评系统、后端API服务、数据库和管理后台。

## 🎯 功能特性

### 用户端
- ✅ 兑换码验证系统
- ✅ 40道题目心理测评（6个维度）
- ✅ 智能评分系统（Z-score + T-score标准化）
- ✅ 依恋风格四象限分类
- ✅ 可视化结果报告（雷达图、进度条）
- ✅ 结果自动保存到数据库

### 管理后台
- ✅ 管理员登录认证（JWT）
- ✅ 数据统计仪表盘
- ✅ 兑换码批量生成与管理
- ✅ 测评结果查询与分析
- ✅ 分类和依恋风格分布统计
- ✅ 每日测评趋势图表

## 🛠️ 技术栈

### 前端
- React 19 + TypeScript
- Vite
- Tailwind CSS
- Recharts（数据可视化）

### 后端
- Node.js + Express + TypeScript
- Prisma ORM
- SQLite（可升级为PostgreSQL）
- JWT认证
- bcrypt密码加密

### 数据库模型
- Users（用户）
- AccessCodes（兑换码）
- Assessments（测评结果）
- Admins（管理员）

## 🚀 快速开始

### 前置要求
- Node.js 18+ 
- npm 或 yarn

### 一键启动（推荐）

```bash
chmod +x start.sh
./start.sh
```

### 手动启动

#### 1. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
```

#### 2. 初始化数据库

```bash
cd server
npx prisma generate
npx prisma migrate dev --name init
npm run seed
cd ..
```

#### 3. 启动服务

```bash
# 启动后端（终端1）
cd server
npm run dev

# 启动前端（终端2）
npm run dev
```

## 🌐 访问地址

- **用户测评页面**: http://localhost:3000
- **管理后台**: http://localhost:3000/admin
- **后端API**: http://localhost:5000/api

## 🔐 默认管理员账号

```
Email: admin@lhi.local
Password: admin123456
```

⚠️ **生产环境请务必修改默认密码！**

## 📁 项目结构

```
lhi-calculator/
├── App.tsx                 # 主应用组件
├── components/             # 前端组件
│   ├── WelcomeScreen.tsx   # 兑换码验证页面
│   ├── QuizScreen.tsx      # 测评问卷页面
│   └── ReportScreen.tsx    # 结果报告页面
├── admin/                  # 管理后台
│   ├── AdminApp.tsx        # 管理端主组件
│   ├── LoginPage.tsx       # 管理员登录
│   ├── Dashboard.tsx       # 数据仪表盘
│   └── services/
│       └── adminApi.ts     # 管理端API客户端
├── services/
│   ├── scoring.ts          # 评分算法
│   └── api/
│       └── client.ts       # 前端API客户端
├── server/                 # 后端服务器
│   ├── src/
│   │   ├── index.ts        # 服务器入口
│   │   ├── config/         # 数据库配置
│   │   ├── controllers/    # 控制器
│   │   ├── services/       # 业务逻辑
│   │   ├── middleware/     # 中间件（认证等）
│   │   ├── routes/         # API路由
│   │   └── utils/          # 工具函数
│   ├── prisma/
│   │   └── schema.prisma   # 数据库模型
│   └── dev.db              # SQLite数据库文件
├── constants.ts            # 问题和维度定义
├── types.ts                # TypeScript类型定义
└── package.json
```

## 📊 API文档

### 公开接口

#### 验证兑换码
```http
POST /api/access-codes/validate
Content-Type: application/json

{
  "code": "LHI12345"
}

Response: {
  "valid": true,
  "accessCodeId": "uuid"
}
```

#### 提交测评结果
```http
POST /api/assessments
Content-Type: application/json

{
  "accessCode": "LHI12345",
  "totalScore": 65,
  "category": "Average",
  "attachmentStyle": "Secure (安全型)",
  "dimensions": [...],
  "answers": {...}
}
```

### 管理员接口（需要JWT Token）

#### 登录
```http
POST /api/auth/admin/login
Content-Type: application/json

{
  "email": "admin@lhi.local",
  "password": "admin123456"
}

Response: {
  "token": "jwt_token",
  "admin": { "id": "...", "email": "...", "name": "..." }
}
```

#### 生成兑换码
```http
POST /api/access-codes/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "count": 100
}
```

#### 获取统计数据
```http
GET /api/assessments/stats
Authorization: Bearer {token}
```

## 🗄️ 数据库管理

### 查看数据库
```bash
cd server
npx prisma studio
```

### 创建迁移
```bash
cd server
npx prisma migrate dev --name your_migration_name
```

### 重置数据库
```bash
cd server
rm dev.db
npx prisma migrate dev --name init
npm run seed
```

## 🔧 环境变量配置

服务器端 `.env` 文件配置：

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@lhi.local
ADMIN_PASSWORD=admin123456
```

## 🚢 生产部署

### 1. 构建前端
```bash
npm run build
```

### 2. 构建后端
```bash
cd server
npm run build
```

### 3. 使用PostgreSQL（推荐）

修改 `server/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/lhi_db"
```

修改 `server/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

然后运行迁移：
```bash
cd server
npx prisma migrate deploy
```

### 4. 使用PM2启动（推荐）
```bash
# 安装PM2
npm install -g pm2

# 启动后端
cd server
pm2 start dist/index.js --name lhi-api

# 使用nginx代理前端静态文件
```

## 📈 评分算法说明

### Z-Score标准化
- 将原始分数转换为标准分数
- 公式：`Z = (3 - 维度平均分) / 1`
- 正值表示健康，负值表示需要关注

### T-Score转换
- 转换为易于理解的分数（30-70）
- 公式：`T = 50 + 10 * Z`
- 50为平均水平，越高越健康

### LHI总分计算
- 使用正态分布累积函数
- 范围：0-100
- 分类：
  - 0-30: 脆弱的爱
  - 31-50: 平均以下
  - 51-70: 平均水平
  - 71-100: 健康的爱

### 依恋风格分类
基于焦虑和回避两个维度：
- **安全型**: 低焦虑 + 低回避
- **焦虑型**: 高焦虑 + 低回避
- **回避型**: 低焦虑 + 高回避
- **恐惧型**: 高焦虑 + 高回避

## 🧪 测试账号

### 测试兑换码
- `LHI12345` (万能测试码)
- `LHITEST01`
- `LHITEST02`
- `LHITEST03`

可通过管理后台批量生成更多兑换码。

## 🛡️ 安全建议

1. 修改默认管理员密码
2. 更换JWT_SECRET为强随机字符串
3. 生产环境使用HTTPS
4. 配置CORS白名单
5. 定期备份数据库
6. 启用API速率限制

## 📝 License

MIT

## 🤝 贡献

欢迎提交Issue和Pull Request！

---

**开发时间**: 2024
**版本**: 1.0.0
