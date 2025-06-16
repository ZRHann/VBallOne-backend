const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 新增: 日期解析与校验函数
function parseISODate(dateStr) {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

// 获取比赛列表
router.get('/', async (req, res) => {
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
      referee: m.referee.username,
      status: m.status,
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取失败' });
  }
});

// 创建比赛
router.post('/', authenticateJWT, async (req, res) => {
  const { name, location, match_date, referee_username } = req.body;
  if (!name || !location || !match_date || !referee_username) {
    return res.status(400).json({ error: '缺少字段' });
  }

  // 新增: 校验时间格式
  const parsedDate = parseISODate(match_date);
  if (!parsedDate) {
    return res.status(400).json({ error: '无效的时间格式' });
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
        matchDate: parsedDate,
        refereeId: referee.id,
        createdById: req.user.userId,
        status: 'NOT_STARTED',
        roundRecordData: {},
        scoreBoardData: {}
      }
    });

    res.json({ success: true, message: '比赛创建成功', match_id: match.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '创建失败' });
  }
});

// 修改比赛
router.put('/:id', authenticateJWT, async (req, res) => {
  const matchId = parseInt(req.params.id);
  const { name, location, match_date, status, roundRecordData, scoreBoardData } = req.body;
  
  try {
    const match = await prisma.match.findUnique({ where: { id: matchId } });

    if (!match) {
      return res.status(404).json({ error: '比赛不存在' });
    }

    // 只有比赛创建者或裁判本人可以修改
    if (match.createdById !== req.user.userId && match.refereeId !== req.user.userId) {
      return res.status(403).json({ error: '无权限修改该比赛' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (location !== undefined) updateData.location = location;
    if (match_date !== undefined) {
      const parsedDate = parseISODate(match_date);
      if (!parsedDate) {
        return res.status(400).json({ error: '无效的时间格式' });
      }
      updateData.matchDate = parsedDate;
    }
    if (status !== undefined) {
      if (match.refereeId !== req.user.userId) {
        return res.status(403).json({ error: '只有裁判可以修改比赛状态' });
      }
      if (!['NOT_STARTED', 'IN_PROGRESS', 'FINISHED'].includes(status)) {
        return res.status(400).json({ error: '无效的比赛状态' });
      }
      updateData.status = status;
    }

    if (roundRecordData !== undefined) {
      if (match.refereeId !== req.user.userId) {
        return res.status(403).json({ error: '只有裁判可以修改比赛状态' });
      }
      if (typeof roundRecordData !== 'object') {
        return res.status(400).json({ error: 'roundRecordData 应为对象' });
      }
      updateData.roundRecordData = roundRecordData;
    }

    if (scoreBoardData !== undefined) {
      if (match.refereeId !== req.user.userId) {
        return res.status(403).json({ error: '只有裁判可以修改比赛状态' });
      }
      if (typeof scoreBoardData !== 'object') {
        return res.status(400).json({ error: 'scoreBoardData 应为对象' });
      }
      updateData.scoreBoardData = scoreBoardData;
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: updateData
    });

    res.json({ success: true, message: '比赛信息更新成功', match: updatedMatch });
  } catch (err) {
    console.error('更新比赛失败:', err);
    res.status(500).json({ error: '更新失败' });
  }
});

// 搜索比赛
router.get('/search', async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: '请提供搜索关键词' });
  }

  try {
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { location: { contains: q } }
        ]
      },
      include: {
        referee: true
      }
    });

    // 使用已有的 calculateRelevance 函数计算相关性并排序
    const sortedMatches = matches
      .sort((a, b) => calculateRelevance(b, q) - calculateRelevance(a, q));

    const result = sortedMatches.map(m => ({
      id: m.id,
      name: m.name,
      location: m.location,
      match_date: m.matchDate,
      referee: m.referee.username,
      status: m.status,
    }));

    res.json(result);
  } catch (err) {
    console.error('搜索失败:', err);
    res.status(500).json({ error: '搜索失败' });
  }
});

// 获取比赛详情
router.get('/:id', async (req, res) => {
  const matchId = parseInt(req.params.id);

  if (isNaN(matchId)) {
    return res.status(400).json({ error: '无效的比赛ID' });
  }

  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { referee: true }
    });

    if (!match) {
      return res.status(404).json({ error: '比赛不存在' });
    }

    const result = {
      id: match.id,
      name: match.name,
      location: match.location,
      match_date: match.matchDate,
      referee: match.referee.username,
      status: match.status,
      roundRecordData: match.roundRecordData,
      scoreBoardData: match.scoreBoardData
    };

    res.json(result);
  } catch (err) {
    console.error('获取比赛详情失败:', err);
    res.status(500).json({ error: '获取失败' });
  }
});


// 计算搜索结果相关度
function calculateRelevance(match, query) {
  let score = 0;
  const q = query.toLowerCase();
  const name = match.name.toLowerCase();
  const location = match.location.toLowerCase();

  // 名称完全匹配
  if (name === q) score += 10;
  // 名称包含查询词
  if (name.includes(q)) score += 5;
  // 地点完全匹配
  if (location === q) score += 8;
  // 地点包含查询词
  if (location.includes(q)) score += 4;
  // 名称中的词匹配查询词
  name.split(/\s+/).forEach(word => {
    if (word === q) score += 3;
  });
  // 地点中的词匹配查询词
  location.split(/\s+/).forEach(word => {
    if (word === q) score += 2;
  });

  return score;
}

module.exports = router; 