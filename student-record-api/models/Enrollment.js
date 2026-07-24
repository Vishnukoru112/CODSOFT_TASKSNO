const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Enrollment model
 * Join entity linking a Student to a Course, with its own attributes
 * (enrollment date, grade, status) rather than a plain many-to-many.
 */
const Enrollment = sequelize.define('Enrollment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student_id',
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'course_id',
  },
  enrollmentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.ENUM('enrolled', 'completed', 'dropped', 'failed'),
    allowNull: false,
    defaultValue: 'enrolled',
  },
  grade: {
    type: DataTypes.STRING(2),
    allowNull: true,
    validate: {
      isIn: {
        args: [['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', null]],
        msg: 'Invalid grade value',
      },
    },
  },
}, {
  tableName: 'enrollments',
  indexes: [
    // A student can only enroll in the same course once
    { fields: ['student_id', 'course_id'], unique: true },
  ],
});

module.exports = Enrollment;
