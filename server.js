const express = require('express');
const dotenv = require('dotenv');
const fs = require('fs');
const https = require('https');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

dotenv.config();
const app = express();
const prisma = new PrismaClient();
const PORT = 443;

app.use(express.json());

// 禁止缓存
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// ====================== 中间件 ======================
const validateAuthInput = (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: '密码长度至少6位' });
  }

  if (!/^[a-zA-Z0-9_]{4,20}$/.test(username)) {
    return res.status(400).json({ error: '用户名只能包含字母、数字和下划线(4-20位)' });
  }
  
  next();
};

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// ====================== 路由 ======================
// 注册
app.post('/api/register', validateAuthInput, async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ error: '用户名已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { username, passwordHash: hashedPassword }
    });

    res.status(201).json({
      success: true,
      message: '注册成功',
      userId: newUser.id
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

// 登录
app.post('/api/login', validateAuthInput, async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: '无效的凭据' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      success: true,
      message: '登录成功',
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// 获取自己的用户信息（需要登录）
app.get('/api/users/me', authenticateJWT, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, username: true, createdAt: true }
    });
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});


// 获取比赛信息
app.get('/api/matches', async (req, res) => {
  try {
    const matches = await prisma.match.findMany({
      orderBy: { matchDate: 'asc' },
      include: { referee: true }
    });

    const formatted = matches.map(m => ({
      id: m.id,
      name: m.name,
      location: m.location,
      match_date: m.matchDate,
      referee: m.referee.username
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取失败' });
  }
});

// 创建比赛（需要登录）
app.post('/api/matches', authenticateJWT, async (req, res) => {
  const { name, location, match_date, referee_username } = req.body;
  if (!name || !location || !match_date || !referee_username) {
    return res.status(400).json({ error: '缺少字段' });
  }

  try {
    const referee = await prisma.user.findUnique({ where: { username: referee_username } });
    if (!referee) {
      return res.status(404).json({ error: '裁判不存在' });
    }

    const match = await prisma.match.create({
      data: {
        name,
        location,
        matchDate: new Date(match_date),
        refereeId: referee.id,
        createdById: req.user.userId
      }
    });

    res.json({ success: true, message: '比赛创建成功', match_id: match.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '创建失败' });
  }
});

// ====================== 启动 HTTPS 服务 ======================
const httpsOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/vballone.zrhan.top/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/vballone.zrhan.top/fullchain.pem')
};

https.createServer(httpsOptions, app).listen(PORT, () => {
  console.log(`HTTPS running at: https://vballone.zrhan.top`);
});
