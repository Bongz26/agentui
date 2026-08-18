'use strict';

function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV !== 'production';

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 10MB.' });
  }

  // Generic errors
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (status >= 500) {
    console.error('[ERROR]', err);
  }

  res.status(status).json({
    error: message,
    ...(isDev && status >= 500 ? { stack: err.stack } : {}),
  });
}

module.exports = { errorHandler };
