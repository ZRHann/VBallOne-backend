const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 获取某场比赛的所有轮次
router.get('/:matchId/sets', async (req, res) => {
  const matchId = parseInt(req.params.matchId);

  try {
    const sets = await prisma.matchSet.findMany({
      where: { matchId },
      orderBy: { round: 'asc' }
    });

    res.json({ success: true, sets });
  } catch (err) {
    console.error('获取比赛轮次失败:', err);
    res.status(500).json({ error: '获取失败' });
  }
});

// 创建新的一轮
router.post('/:matchId/sets', authenticateJWT, async (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const { round, scoreA, scoreB, isPaused } = req.body;

  if (round === undefined || scoreA === undefined || scoreB === undefined) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { referee: true }
    });

    if (!match) {
      return res.status(404).json({ error: '比赛不存在' });
    }

    if (match.refereeId !== req.user.userId) {
      return res.status(403).json({ error: '只有比赛裁判可以创建轮次' });
    }

    const newSet = await prisma.matchSet.create({
      data: {
        round,
        scoreA,
        scoreB,
        isPaused: isPaused || false,
        matchId
      }
    });

    res.json({ success: true, message: '轮次创建成功', set: newSet });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: '该轮次已存在' });
    }
    console.error('创建轮次失败:', err);
    res.status(500).json({ error: '创建失败' });
  }
});

module.exports = router; 