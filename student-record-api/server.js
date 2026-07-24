require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // In production, use migrations instead of sync(). This is fine for
    // development/demo purposes to auto-create tables from models.
    await sequelize.sync();
    console.log('Database synced.');

    app.listen(PORT, () => {
      console.log(`Student Record Management API running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
