/**
 * Database configuration.
 * Uses SQLite via Sequelize so the project runs with zero external setup.
 * Swap `dialect`/`storage` for 'postgres' or 'mysql' in production by
 * changing this file only — models and controllers stay untouched.
 */
const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config();

const storagePath = process.env.DB_STORAGE || path.join(__dirname, '..', 'data', 'database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storagePath,
  logging: process.env.NODE_ENV === 'development' ? false : false,
  define: {
    underscored: true,
    timestamps: true,
  },
});

module.exports = sequelize;
