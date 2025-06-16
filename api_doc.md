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
      "round_record_data": {},
      "score_board_data": {}
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
- 描述: 更新比赛信息（仅比赛创建者和裁判可修改）
- 需要认证: 是
- 请求体:
  ```json
  {
    "name": "string",          // 可选
    "location": "string",      // 可选
    "match_date": "string",    // 可选
    "status": "string",        // 可选，枚举值：NOT_STARTED/IN_PROGRESS/FINISHED
    "round_record_data": {},   // 可选，整局记录 JSON
    "score_board_data": {}     // 可选，比分面板 JSON
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
      "round_record_data": {},
      "score_board_data": {}
    }
  }
  ```

### 获取比赛详情
- 方法: `GET`
- 路径: `/api/matches/:id`
- 描述: 根据 ID 获取单场比赛信息
- 需要认证: 否
- 响应:
  ```json
  {
    "id": 123,
    "name": "string",
    "location": "string",
    "match_date": "2024-01-01T00:00:00Z",
    "referee": "string",
    "status": "NOT_STARTED",
    "round_record_data": {},
    "score_board_data": {}
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
      "round_record_data": {},
      "score_board_data": {}
    },
    {
      "id": 124,
      "name": "排球友谊赛",
      "location": "市体育馆",
      "match_date": "2024-01-02T00:00:00Z",
      "referee": "李四",
      "status": "IN_PROGRESS",
      "round_record_data": {},
      "score_board_data": {}
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
`round_record_data` 与 `score_board_data` 为数组，格式如下：

### round_record_data 示例
结构示例：

```json
{
  "lineup": {
    "fir_playersA": ["12","8","3","9","1","5"],
    "fir_playersB": ["6","11","4","7","2","10"],
    "fir_serveteam": "A",
    "cur_serveteam": "A",
    "currentSet": 1,
    "serveA": 3,
    "serveB": 2
  },
  "substitutionRecordsA": [],
  "substitutionRecordsB": [],
  "scoreBoardData": {
    "cur_serveteam": "B",
    "serveA": 10,
    "serveB": 11,
    "isover": false,
    "timeoutLogsA": [5],
    "timeoutLogsB": [8,12]
  },
  "currentServeTeam": "B",
  "set1": {}
}
```

### score_board_data 示例

```json
{
  "scoreA": [1,2,3],
  "scoreB": [0,1,1],
  "lastScoreA": 3,
  "lastScoreB": 1,
  "pauseChanceA": 1,
  "pauseChanceB": 0,
  "timeoutLogsA": [],
  "timeoutLogsB": [],
  "set": 1,
  "isExchange": false,
  "cur_serveteam": "A",
  "serveA": 3,
  "serveB": 2,
  "isover": false
}
```

说明：
1. `创建比赛` 时，后端会默认 `round_record_data` 与 `score_board_data` 为空对象。
2. 可通过 `PUT /matches/:id` 覆盖整块 JSON，或使用下文 **增量更新** 接口局部合并。

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

### 增量更新 round_record_data / score_board_data

- 方法: `PATCH`
- 路径 1: `/api/matches/:id/round_record_data`
- 路径 2: `/api/matches/:id/score_board_data`
- 描述: 对应字段增量合并更新（只需提交本次变动）

