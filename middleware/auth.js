const jwt = require('jsonwebtoken');

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

module.exports = {
  validateAuthInput,
  authenticateJWT
}; 