const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { validateAuthInput, authenticateJWT } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 注册
router.post('/register', validateAuthInput, async (req, res) => {
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
router.post('/login', validateAuthInput, async (req, res) => {
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

// 获取自己的用户信息
router.get('/me', authenticateJWT, async (req, res) => {
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

module.exports = router; 