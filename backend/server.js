const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const { connectDB } = require('./src/config/db');
const { initSocket } = require('./src/config/socket');
const { apiResponse } = require('./src/utils/apiResponse');
const { errorHandler } = require('./src/middleware/errorHandler');
const { rateLimiter } = require('./src/middleware/rateLimiter');
const authRoutes = require('./src/routes/auth');
const customerRoutes = require('./src/routes/customers');
const overrideRoutes = require('./src/routes/overrides');
const campaignRoutes = require('./src/routes/campaigns');
const analyticsRoutes = require('./src/routes/analytics');
const adminRoutes = require('./src/routes/admin');
const { startScheduler } = require('./src/jobs/scheduler');
const { startLiveActivitySimulator } = require('./src/jobs/activitySimulator');

dotenv.config();

const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174'].filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (origin.endsWith('.vercel.app')) return true;
  if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) return true;
  return false;
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) callback(null, true);
      else callback(null, false);
    },
    credentials: true
  },
  transports: ['websocket', 'polling']
});

initSocket(io);
connectDB();
startScheduler(io);
startLiveActivitySimulator(io);

app.set('io', io);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.use(rateLimiter);

app.get('/api/health', (req, res) => res.status(200).json(apiResponse.success({
  status: 'ok',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  environment: process.env.NODE_ENV || 'development'
})));

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/overrides', overrideRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

const basePort = Number(process.env.PORT || 10000);
const candidatePorts = Array.from({ length: 10 }, (_, i) => basePort + i);

const tryListen = index => {
  const port = candidatePorts[index];
  if (port == null) {
    console.error(`no free port found in range ${candidatePorts[0]}-${candidatePorts[candidatePorts.length - 1]}`);
    process.exit(1);
  }

  const onError = err => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`port ${port} is busy, retrying on ${candidatePorts[index + 1]}`);
      server.removeListener('error', onError);
      tryListen(index + 1);
      return;
    }
    throw err;
  };

  server.once('error', onError);
  server.listen(port, () => {
    server.removeListener('error', onError);
    console.log(`server listening on ${port}`);
  });
};

tryListen(0);
