const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || '';
  const localMode = String(process.env.LOCAL_IN_MEMORY_MODE || 'true').toLowerCase() !== 'false';
  if (localMode) {
    console.warn('mongodb connection skipped: local in-memory mode enabled');
    return false;
  }
  if (!uri || (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://'))) {
    console.warn('mongodb connection skipped: MONGODB_URI is missing or invalid');
    return;
  }
  await mongoose.connect(uri);
  console.log('mongodb connected');
  return true;
}

module.exports = { connectDB };
