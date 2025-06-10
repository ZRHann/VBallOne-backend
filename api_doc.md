# VBallOne API 文档

## 基础信息
- 基础URL: `https://vballone.zrhan.top`
- 所有请求和响应均使用 JSON 格式
- 需要认证的API需要在请求头中包含 `Authorization: Bearer <token>`

## 认证相关

### 注册
- 方法: `POST`
- 路径: `/api/register`
- 描述: 创建新用户账号
- 请求体:
  ```json
  {
    "username": "string", // 4-20位，只能包含字母、数字和下划线
    "password": "string"  // 最少6位
  }
  ```
- 响应:
  ```json
  {
    "success": true,
    "message": "注册成功",
    "userId": 123
  }
  ```

### 登录
- 方法: `POST`
- 路径: `/api/login`
- 描述: 用户登录并获取认证令牌
- 请求体:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- 响应:
  ```json
  {
    "success": true,
    "message": "登录成功",
    "token": "jwt_token",
    "user": {
      "id": 123,
      "username": "string"
    }
  }
  ```

### 获取个人信息
- 方法: `GET`
- 路径: `/api/users/me`
- 描述: 获取当前登录用户信息
- 需要认证: 是
- 响应:
  ```json
  {
    "success": true,
    "user": {
      "id": 123,
      "username": "string",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
  ```

## 比赛相关

### 获取比赛列表
- 方法: `GET`
- 路径: `/api/matches`
- 描述: 获取所有比赛信息
- 需要认证: 否
- 响应:
  ```json
  [
    {
      "id": 123,
      "name": "string",
      "location": "string",
      "match_date": "2024-01-01T00:00:00Z",
      "referee": "string",
      "status": "NOT_STARTED"
    }
  ]
  ```

### 创建比赛
- 方法: `POST`
- 路径: `/api/matches`
- 描述: 创建新的比赛
- 需要认证: 是
- 请求体:
  ```json
  {
    "name": "string",
    "location": "string",
    "match_date": "2024-01-01T00:00:00Z",
    "referee_username": "string"
  }
  ```
- 响应:
  ```json
  {
    "success": true,
    "message": "比赛创建成功",
    "match_id": 123
  }
  ```

### 更新比赛
- 方法: `PUT`
- 路径: `/api/matches/:id`
- 描述: 更新比赛信息（仅比赛创建者可修改）
- 需要认证: 是
- 请求体:
  ```json
  {
    "name": "string",          // 可选
    "location": "string",      // 可选
    "match_date": "string",    // 可选
    "status": "string"         // 可选，枚举值：NOT_STARTED/IN_PROGRESS/FINISHED
  }
  ```
- 响应:
  ```json
  {
    "success": true,
    "message": "比赛信息更新成功",
    "match": {
      "id": 123,
      "name": "string",
      "location": "string",
      "matchDate": "2024-01-01T00:00:00Z",
      "status": "NOT_STARTED"
    }
  }
  ```

## 比赛轮次相关

### 获取比赛轮次
- 方法: `GET`
- 路径: `/api/matches/:matchId/sets`
- 描述: 获取某场比赛的所有轮次信息
- 需要认证: 否
- 响应:
  ```json
  {
    "success": true,
    "sets": [
      {
        "id": 1,
        "round": 1,
        "scoreA": 25,
        "scoreB": 23,
        "isPaused": false,
        "matchId": 123,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
  ```

### 创建比赛轮次
- 方法: `POST`
- 路径: `/api/matches/:matchId/sets`
- 描述: 创建新的比赛轮次（仅比赛裁判可操作）
- 需要认证: 是
- 请求体:
  ```json
  {
    "round": 1,        // 必填，轮次号
    "scoreA": 25,      // 必填，A方比分
    "scoreB": 23,      // 必填，B方比分
    "isPaused": false  // 可选，是否暂停，默认false
  }
  ```
- 响应:
  ```json
  {
    "success": true,
    "message": "轮次创建成功",
    "set": {
      "id": 1,
      "round": 1,
      "scoreA": 25,
      "scoreB": 23,
      "isPaused": false,
      "matchId": 123,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
  ```

## 比赛状态说明

比赛状态（status）有三种可能的值：
- `NOT_STARTED`: 未开始（默认状态）
- `IN_PROGRESS`: 进行中
- `FINISHED`: 已结束

## 错误响应
所有API在发生错误时会返回相应的HTTP状态码和错误信息：
```json
{
  "error": "错误描述信息"
}
```

常见状态码：
- 400: 请求参数错误
- 401: 未认证
- 403: 无权限
- 404: 资源不存在
- 409: 资源冲突（如用户名已存在）
- 500: 服务器内部错误
