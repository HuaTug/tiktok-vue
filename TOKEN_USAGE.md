# Token 使用说明

## 概述

本项目已经实现了完整的token认证系统，包括登录、token保存、自动请求头添加等功能。

## 主要功能

### 1. 登录功能
- 用户可以通过 `/login` 页面进行登录
- 登录成功后会自动保存token到localStorage
- 支持访问token和刷新token

### 2. Token管理
- 自动在API请求中添加Authorization头
- Token过期时自动清除并跳转到登录页
- 提供完整的token管理工具函数

### 3. 路由保护
- 需要认证的页面会自动检查登录状态
- 未登录用户会被重定向到登录页
- 已登录用户访问登录页会被重定向到视频页

## 文件结构

```
src/
├── api/
│   └── index.js          # API配置和拦截器
├── components/
│   ├── Login.vue         # 登录组件
│   └── TokenTest.vue     # Token测试组件
├── router/
│   ├── index.js          # 路由配置
│   └── utils.js          # 路由工具
└── utils/
    └── auth.js           # 认证工具函数
```

## 使用方法

### 1. 登录
访问 `/login` 页面，填写用户名、密码和邮箱，点击登录按钮。

### 2. 测试Token
访问 `/token-test` 页面可以：
- 查看当前认证状态
- 测试API调用
- 清除认证信息

### 3. 在代码中使用

```javascript
import { getToken, isLoggedIn, getUser, clearAuth } from '../utils/auth.js'

// 检查是否已登录
if (isLoggedIn()) {
  console.log('用户已登录')
}

// 获取token
const token = getToken()

// 获取用户信息
const user = getUser()

// 清除认证信息（登出）
clearAuth()
```

## API调用

登录成功后，所有API请求会自动添加Authorization头：

```
Authorization: Bearer <your_token>
```

## 后端接口

确保后端登录接口返回以下格式：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "access_token_here",
    "refresh_token": "refresh_token_here",
    "user": {
      "id": 1,
      "userName": "username",
      "email": "email@example.com"
    }
  }
}
```

## 注意事项

1. Token会自动保存在localStorage中
2. Token过期时会自动清除并跳转到登录页
3. 刷新页面后token状态会保持
4. 可以通过TokenTest页面测试token功能

## 测试步骤

1. 启动前端项目：`pnpm dev`
2. 访问 `/login` 进行登录
3. 登录成功后访问 `/token-test` 查看token状态
4. 测试API调用功能
5. 清除认证信息测试登出功能 