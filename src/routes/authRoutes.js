const express = require('express');
const jwt = require('jsonwebtoken');
const userDb = require('../db/users');
const verifyToken = require('../middleware/authMiddleware');
const config = require('../config');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password too short' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const existingUser = await userDb.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const user = await userDb.createUser({ name, email, password });
    
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return res.status(201).json({ user, token });
  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await userDb.findUserByEmail(email);
    if (!user || !(await userDb.validatePassword(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    // Strip password from response just in case
    const { password: _, ...safeUser } = user;
    return res.status(200).json({ user: safeUser, token });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await userDb.findUserByEmail(req.user.email);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...safeUser } = user;
    return res.status(200).json({ user: safeUser });
  } catch (err) {
    console.error('Profile Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
