import jwt from 'jsonwebtoken';

export const generateToken = (id, userType, accountType = 'user') => {
  return jwt.sign(
    { id, userType, accountType },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );
};

export const generateRefreshToken = (id, userType, accountType = 'user') => {
  return jwt.sign(
    { id, userType, accountType, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};