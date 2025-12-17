const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendMail } = require('../../utils/mailer');
const { getUserByEmail, getUserByUsername, createUser, updateUser } = require('../../utils/firestoreHelpers');

const SECRET_KEY = process.env.JWT_SECRET || 'rehan8080';

function isMobile(req) {
  const ua = req.headers['user-agent'] || '';
  return /mobile|android|iphone|ipad|ipod/i.test(ua);
}

// ===== Views =====

function login(req, res) {
  if (isMobile(req)) {
    res.render('auth/login-mobile', { title: 'Login - PetHudl' });
  } else {
    res.render('auth/login', { title: 'Login - PetHudl' });
  }
}

function register(req, res) {
  if (isMobile(req)) {
    res.render('auth/register-mobile', { title: 'Register - PetHudl' });
  } else {
    res.render('auth/register', { title: 'Register - PetHudl' });
  }
}

// ===== Actions =====

async function doLogin(req, res) {
  try {
    const { email, password } = req.body;

    const user = await getUserByEmail(email);
    if (!user) {
      return res.render('auth/login', {
        error: 'Invalid email or password',
        title: 'Login - Pethudl',
        formData: req.body,
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('auth/login', {
        error: 'Invalid email or password',
        title: 'Login - Pethudl',
        formData: req.body,
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      },
      SECRET_KEY,
      { expiresIn: '1h' },
    );

    res.cookie('token', token, { httpOnly: true });
    return res.redirect('/');
  } catch (err) {
    console.error(err);
    return res.render('auth/login', { error: 'Something went wrong', title: 'Login - Pethudl' });
  }
}

async function doRegister(req, res) {
  try {
    const { username, first_name, last_name, email, dob, gender, password } = req.body;

    // Email check
    const existingEmail = await getUserByEmail(email);
    if (existingEmail) {
      return res.render('auth/register', { error: 'Email already registered', title: 'Register - Pethudl' });
    }

    // Username check
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return res.render('auth/register', { error: 'Username already taken', title: 'Register - Pethudl' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in Firestore
    await createUser({
      username,
      first_name,
      last_name,
      email,
      dob,
      gender,
      password: hashedPassword,
      profile_pic: null,
      cover_pic: null,
      bio: null,
    });

    // Optional welcome email (kept same as before)
    try {
      await sendMail(
        email,
        'Welcome to PetHudl 🐾',
        `Hi ${first_name}, welcome to PetHudl!`,
        `<h2>Welcome to PetHudl 🐾</h2>
         <p>Hi <b>${first_name}</b>,</p>
         <p>Thank you for registering at <b>PetHudl</b>. Your account has been created successfully.</p>`,
      );
    } catch (mailErr) {
      console.warn('Failed to send welcome email:', mailErr.message);
    }

    return res.redirect('/auth/login');
  } catch (err) {
    console.error(err);
    return res.render('auth/register', { error: 'Something went wrong', title: 'Register - Pethudl' });
  }
}

async function checkUsername(req, res) {
  try {
    const { username } = req.query;
    if (!username) {
      return res.json({ available: false, message: 'Username is required' });
    }

    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return res.json({ available: false, message: 'Username already taken' });
    }

    return res.json({ available: true, message: 'Username is available' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ available: false, message: 'Server error' });
  }
}

function logout(req, res) {
  res.clearCookie('token');
  res.redirect('/auth/login');
}

// Simple stubs to keep routes working; can be expanded later
function forgotPassword(req, res) {
  if (isMobile(req)) {
    res.render('auth/forgot-password-mobile', {
      title: 'Forgot Password - PetHudl',
      success: null,
      error: null,
      formData: null,
    });
  } else {
    res.render('auth/forgot-password', {
      title: 'Forgot Password - PetHudl',
      success: null,
      error: null,
      formData: null,
    });
  }
}

async function doForgotPassword(req, res) {
  // Not implemented in this simplified version
  return res.render('auth/forgot-password', {
    title: 'Forgot Password - PetHudl',
    success: null,
    error: 'Password reset is not configured yet',
    formData: req.body,
  });
}

function resetPasswordPage(req, res) {
  res.render('auth/reset-password', {
    token: req.query.token || null,
    error: null,
    success: null,
    title: 'Reset Password - Pethudl',
  });
}

async function doResetPassword(req, res) {
  return res.render('auth/reset-password', {
    error: 'Password reset is not configured yet',
    success: null,
    title: 'Reset Password - Pethudl',
    token: req.body.token || null,
  });
}

module.exports = {
  login,
  doLogin,
  register,
  doRegister,
  checkUsername,
  logout,
  forgotPassword,
  doForgotPassword,
  resetPasswordPage,
  doResetPassword,
};


