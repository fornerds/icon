import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('❌ JWT_SECRET is not set in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      console.error('❌ JWT verification failed:', err.message);
      console.error('   Token:', token.substring(0, 20) + '...');
      console.error('   JWT_SECRET exists:', !!jwtSecret);
      return res.status(403).json({ error: 'Forbidden', details: err.message });
    }
    req.user = user;
    next();
  });
};

export const authenticateApiToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token === process.env.API_TOKEN) {
    req.isFigmaPlugin = true;
    next();
  } else {
    res.status(401).json({ error: 'Invalid API token' });
  }
};

