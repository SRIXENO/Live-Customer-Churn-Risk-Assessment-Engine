const cron = require('node-cron');
const { runScoring } = require('./scoringEngine');

function startScheduler(io) {
  const minutes = Number(process.env.SCORING_INTERVAL_MINUTES || 30);
  const expression = `*/${Math.max(1, minutes)} * * * *`;
  cron.schedule(expression, runScoring);
  setInterval(runScoring, 10 * 60 * 1000);
}

module.exports = { startScheduler };
