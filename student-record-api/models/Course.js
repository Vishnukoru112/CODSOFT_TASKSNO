const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Course model
 * Represents a course that students can enroll in.
 */
const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: { notEmpty: true, len: [2, 20] },
  },
  title: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: { notEmpty: true, len: [2, 150] },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  credits: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 12 },
  },
  department: {
    type: DataTypes.STRING(80),
    allowNull: false,
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30,
    validate: { min: 1 },
  },
  status: {
    type: DataTypes.ENUM('active', 'archived'),
    allowNull: false,
    defaultValue: 'active',
  },
}, {
  tableName: 'courses',
  indexes: [
    { fields: ['code'], unique: true },
    { fields: ['department'] },
  ],
});

module.exports = Course;
