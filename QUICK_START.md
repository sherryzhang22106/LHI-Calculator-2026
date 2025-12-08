# ⚡ 快速开始指南

## 🚀 5分钟启动项目

### 第一步：安装Node.js

如果还没有安装Node.js，请先安装：

**macOS (使用Homebrew)**
```bash
brew install node
```

**或访问官网下载**: https://nodejs.org/ (推荐LTS版本)

验证安装：
```bash
node --version  # 应该显示 v18.x.x 或更高
npm --version   # 应该显示 9.x.x 或更高
```

### 第二步：安装依赖

在项目根目录执行：

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
cd ..
```

### 第三步：初始化数据库

```bash
cd server
npx prisma generate
npx prisma migrate dev --name init
npm run seed
cd ..
```

看到 ✅ 表示成功！

### 第四步：启动服务

**方式A: 一键启动（推荐）**
```bash
./start.sh
```

**方式B: 分别启动**

终端1（后端）:
```bash
cd server
npm run dev
```

终端2（前端）:
```bash
npm run dev
```

### 第五步：访问应用

打开浏览器访问：

1. **用户测评**: http://localhost:3000
   - 输入测试码: `LHI12345`
   
2. **管理后台**: http://localhost:3000/admin
   - 账号: `admin@lhi.local`
   - 密码: `admin123456`

## ✅ 功能测试

### 测试用户测评流程

1. 访问 http://localhost:3000
2. 输入兑换码 `LHI12345`
3. 点击"开始测评"
4. 完成40道题目（分6页）
5. 查看结果报告

### 测试管理后台

1. 访问 http://localhost:3000/admin
2. 使用默认管理员账号登录
3. 查看概览页面的统计数据
4. 切换到"Access Codes"标签
5. 生成10个新兑换码
6. 切换到"Assessments"查看所有测评记录

## 🐛 常见问题快速解决

### ❌ 错误：npm command not found

**解决**: 安装Node.js（见第一步）

### ❌ 错误：端口被占用

**解决**: 
```bash
# 杀死占用5000端口的进程
kill -9 $(lsof -ti:5000)

# 杀死占用3000端口的进程
kill -9 $(lsof -ti:3000)
```

### ❌ 错误：无法连接数据库

**解决**: 
```bash
cd server
rm dev.db
rm -rf prisma/migrations
npx prisma migrate dev --name init
npm run seed
```

### ❌ 错误：前端无法调用后端API

**检查**:
1. 后端是否在运行？访问 http://localhost:5000/api/health
2. 如果返回 `{"status":"ok",...}` 说明后端正常
3. 检查浏览器控制台是否有CORS错误

### ❌ 管理后台登录失败

**确认**:
1. 数据库是否初始化？检查 `server/dev.db` 是否存在
2. 是否运行了种子脚本？`cd server && npm run seed`
3. 默认账号: `admin@lhi.local` / `admin123456`

## 📱 使用示例

### 生成更多兑换码

在管理后台：
1. 登录管理后台
2. 点击"Access Codes"标签
3. 输入数量（如100）
4. 点击"Generate Codes"
5. 新码将自动添加到列表

### 查看测评统计

在管理后台"Overview"页面可以看到：
- 总测评数量
- 平均分数
- 分类分布图
- 依恋风格分布图
- 最近10条测评记录

## 🔄 重启服务

如果需要重启：

1. 按 `Ctrl+C` 停止当前服务
2. 重新运行 `./start.sh` 或分别启动前后端

## 📦 数据库管理

### 查看数据库内容

```bash
cd server
npx prisma studio
```

会打开网页版数据库管理界面。

### 备份数据库

```bash
cp server/dev.db server/dev.db.backup
```

### 恢复数据库

```bash
cp server/dev.db.backup server/dev.db
```

## 🎯 下一步

- 📖 阅读完整文档: [README.md](README.md)
- 🚢 部署到生产: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- 📊 查看项目总结: [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

## 🆘 获取帮助

如果遇到问题：

1. 查看 [SETUP_GUIDE.md](SETUP_GUIDE.md) 详细安装说明
2. 检查终端错误日志
3. 确认Node.js版本 >= 18
4. 确认端口3000和5000未被占用

---

**提示**: 首次启动可能需要2-3分钟下载依赖，请耐心等待！
