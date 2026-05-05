const jwt = require("jsonwebtoken");
const env = require("../config/env");

const buildTokenPayload = (user) => ({
  sub: String(user._id),
  role: user.role,
  email: user.email
});

const signAccessToken = (user) =>
  jwt.sign(buildTokenPayload(user), env.jwtAccessSecret, {
    expiresIn: env.jwtAccessTtl
  });

const signRefreshToken = (user) =>
  jwt.sign(buildTokenPayload(user), env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshTtl
  });

const verifyAccessToken = (token) => jwt.verify(token, env.jwtAccessSecret);

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken };
