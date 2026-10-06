require('./config/env');
const express = require('express');
const cors = require('cors');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
}));

app.use(express.json());

// Health check / root route
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API is running' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/payslips', require('./routes/payslips'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/leaves', require('./routes/leaves'));
app.use('/api/advances', require('./routes/advances'));
app.use('/api/loans', require('./routes/loans'));
app.use('/api/reports', require('./routes/reports'));

process.on('uncaughtException', (err) => console.error('UNCAUGHT:', err));
process.on('unhandledRejection', (err) => console.error('UNHANDLED:', err));

app.use('*', (req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is missing. Set a private signing secret in server/.env before starting the API.');
}

const port = process.env.PORT || 5000;
const server = app.listen(port, () =>
  console.log(`API running on port ${port}`)
);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the existing server before starting this API again.`);
  } else {
    console.error('API failed to start:', err);
  }

  process.exit(1);
});
