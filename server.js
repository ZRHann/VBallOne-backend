const express = require('express');
const dotenv = require('dotenv');
const https = require('https');
const config = require('./config');

// 路由
const authRoutes = require('./routes/auth');
const matchesRoutes = require('./routes/matches');
const matchSetsRoutes = require('./routes/matchSets');
const usersRoutes = require('./routes/auth');

dotenv.config();
const app = express();

app.use(express.json());

// 禁止缓存
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// 路由注册
app.use('/api', authRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/matches', matchSetsRoutes);
app.use('/api/users', usersRoutes);

// 启动 HTTPS 服务
https.createServer(config.httpsOptions, app).listen(config.port, () => {
  console.log(`HTTPS running at: https://vballone.zrhan.top`);
});
