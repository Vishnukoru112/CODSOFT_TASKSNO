const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Student model
 * Represents a student enrolled in the institution.
 */
const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: { notEmpty: true, len: [1, 50] },
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: { notEmpty: true, len: [1, 50] },
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  enrollmentYear: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1990, max: 2100 },
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'graduated', 'suspended'),
    allowNull: false,
    defaultValue: 'active',
  },
}, {
  tableName: 'students',
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['last_name'] },
    { fields: ['status'] },
  ],
});

module.exports = Student;
