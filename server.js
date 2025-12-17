const app = require('./app');

// For Vercel, export the app directly
if (process.env.VERCEL) {
  module.exports = app;
} else {
  // For local development, create HTTP server
  const http = require('http');
  const port = process.env.PORT || 4000;
  app.set('port', port);
  
  const server = http.createServer(app);
  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}
