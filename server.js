const express = require('express');
const dotenv = require('dotenv');
const fs = require('fs');
const https = require('https');
const { PrismaClient } = require('@prisma/client');

dotenv.config();
const app = express();
const prisma = new PrismaClient();
const PORT = 443;

app.use(express.json());

// 获取比赛列表
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

// 新增比赛
app.post('/api/matches', async (req, res) => {
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
        createdById: referee.id  // 简化：默认由裁判创建
      }
    });

    res.json({ success: true, message: '比赛创建成功', match_id: match.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '创建失败' });
  }
});

// POST /api/users — 创建新用户
app.post('/api/users', async (req, res) => {
  const { username, password, role } = req.body;
  const allowedRoles = ['organizer', 'referee', 'participant'];

  if (!username || !password || !role) {
    return res.status(400).json({ error: '缺少字段' });
  }
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: '角色不合法' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(409).json({ error: '用户名已存在' });
    }

    // 密码已是哈希，直接使用
    const passwordHash = password;

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role
      }
    });

    res.json({ success: true, message: '用户创建成功', user_id: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '用户创建失败' });
  }
});

// GET /api/users — 获取用户列表
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// HTTPS 配置
const httpsOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/vballone.zrhan.top/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/vballone.zrhan.top/fullchain.pem')
};

https.createServer(httpsOptions, app).listen(PORT, () => {
  console.log(`HTTPS RUNNING AT https://vballone.zrhan.top`);
});
