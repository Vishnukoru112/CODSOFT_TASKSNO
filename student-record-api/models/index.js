const sequelize = require('../config/database');
const Student = require('./Student');
const Course = require('./Course');
const Enrollment = require('./Enrollment');

/**
 * Associations
 * Student <-> Course is many-to-many through Enrollment.
 * We also expose the direct Student->Enrollment and Course->Enrollment
 * one-to-many relations for convenient nested queries.
 */
Student.hasMany(Enrollment, { foreignKey: 'studentId', as: 'enrollments', onDelete: 'CASCADE' });
Enrollment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

Course.hasMany(Enrollment, { foreignKey: 'courseId', as: 'enrollments', onDelete: 'CASCADE' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

Student.belongsToMany(Course, {
  through: Enrollment,
  foreignKey: 'studentId',
  otherKey: 'courseId',
  as: 'courses',
});
Course.belongsToMany(Student, {
  through: Enrollment,
  foreignKey: 'courseId',
  otherKey: 'studentId',
  as: 'students',
});

module.exports = {
  sequelize,
  Student,
  Course,
  Enrollment,
};
