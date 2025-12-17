const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const authRouter = require('./routes/auth/index');
const indexRouter = require('./routes/index');
const postsRouter = require('./routes/posts');
const friendsRouter = require('./routes/friends');
const notificationsRouter = require('./routes/notifications');
const marketplaceRouter = require('./routes/marketplace');
const injectUser = require('./middlewares/injectUser');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(injectUser);

// Main routes (home, profile, etc.)
app.use('/', indexRouter);

// Auth routes (login/register/check-username/etc.)
app.use('/auth', authRouter);

// Posts routes
app.use('/posts', postsRouter);

// Friends routes
app.use('/friends', friendsRouter);

// Notifications routes
app.use('/notifications', notificationsRouter);

// Marketplace routes
app.use('/marketplace', marketplaceRouter);

// Simple health check route
app.get('/health', (req, res) => {
  res.send('Pethub server is running');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

