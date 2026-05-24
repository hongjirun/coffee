const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // 跳过所有权限验证，直接放行
  req.admin = { id: 1, username: 'admin' };
  next();
};

module.exports = authMiddleware;
