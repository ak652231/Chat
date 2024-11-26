const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const validateInput = (req, res, next) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ msg: 'Please enter all required fields' });
  }

  if (password.length < 6) {
    return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
  }

  next();
};

exports.signUp = async (req, res) => {
  const { username, name, number, gender, password } = req.body;

  try {
    let user = await User.findOne({ 
      $or: [
        { username },
        { number }
      ]
    });

    if (user) {
      return res.status(400).json({ 
        msg: user.username === username ? 
          'Username already exists' : 
          'Phone number already registered' 
      });
    }

    user = new User({
      username,
      name,
      number,
      gender,
      password
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
        username: user.username
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token,
          user: {
            id: user.id,
            username: user.username,
            name: user.name
          }
        });
      }
    );
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ msg: 'Server error during signup' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        username: user.username
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token,
          user: {
            id: user.id,
            username: user.username,
            name: user.name
          }
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ msg: 'Server error during login' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'username name isOnline lastSeen');

    if (!users || users.length === 0) {
      return res.status(404).json({ msg: 'No users found' });
    }

    res.json(users);
  } catch (err) {
    console.error('Get users error:', err.message);
    res.status(500).json({ msg: 'Server error while fetching users' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id, 'username name isOnline lastSeen');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Get user by ID error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).json({ msg: 'Server error while fetching user' });
  }
};

module.exports = {
  validateInput,
  ...exports
};

