# VBallOne API 文档


**WARNING：大部分由AI生成，可能有错误的地方。**


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
      "status": "NOT_STARTED",
      "rounds": []
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
    "status": "string",        // 可选，枚举值：NOT_STARTED/IN_PROGRESS/FINISHED
    "rounds": []               // 可选，比赛数据，数组（JSON），完整替换
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
      "status": "NOT_STARTED",
      "rounds": []
    }
  }
  ```

### 搜索比赛
- 方法: `GET`
- 路径: `/api/matches/search`
- 描述: 搜索比赛信息（支持模糊搜索）
- 需要认证: 否
- 查询参数:
  - `q`: 搜索关键词（在比赛名称和地点中搜索）
- 响应:
  ```json
  [
    {
      "id": 123,
      "name": "2024春季赛",
      "location": "体育馆",
      "match_date": "2024-01-01T00:00:00Z",
      "referee": "张三",
      "status": "NOT_STARTED",
      "rounds": []
    },
    {
      "id": 124,
      "name": "排球友谊赛",
      "location": "市体育馆",
      "match_date": "2024-01-02T00:00:00Z",
      "referee": "李四",
      "status": "IN_PROGRESS",
      "rounds": []
    }
  ]
  ```

说明：
- 返回结果按相关度从高到低排序
- 相关度计算规则：
  - 比赛名称完全匹配：+10分
  - 比赛名称包含关键词：+5分
  - 地点完全匹配：+8分
  - 地点包含关键词：+4分
  - 比赛名称中的词完全匹配：+3分
  - 地点中的词完全匹配：+2分

## 比赛 rounds 字段说明
`rounds` 为数组，格式如下：

```json
[
  {
    "round": 1,
    "finished": false,
    "firstServe": "A",        // A / B
    "curServeTeam": "B",
    "serveIndex": { "A": 3, "B": 1 },
    "lineup": {
      "A": ["12","7","4","6","11","2"],
      "B": ["3","8","10","5","1","9"]
    },
    "currentPlayers": {
      "A": ["12","7","4","6","11","2"],
      "B": ["3","8","10","5","1","9"]
    },
    "score": {
      "A": [1,2,3,4,5],
      "B": [0,1,1,2,2]
    },
    "substitutions": {
      "A": [ { "out": "7", "in": "15" } ],
      "B": []
    },
    "timeouts": {
      "A": [ { "no": 1, "scoreA": 8, "scoreB": 6 } ],
      "B": []
    }
  },
  {
    "round":2,
    ...
  },
  ...
]
```

说明：
1. `创建比赛` 时，后端会强制将 `rounds` 设为空数组。
2. 如需写入/更新局内数据，请调用 `更新比赛` 接口，提交完整的 `rounds` 数组，后端会整体替换。

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
