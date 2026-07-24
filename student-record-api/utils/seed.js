require('dotenv').config();
const { sequelize, Student, Course, Enrollment } = require('../models');

async function seed() {
  await sequelize.sync({ force: true }); // WARNING: drops and recreates tables

  const students = await Student.bulkCreate([
    { firstName: 'Ada', lastName: 'Lovelace', email: 'ada.lovelace@example.com', enrollmentYear: 2023, status: 'active', gender: 'female' },
    { firstName: 'Alan', lastName: 'Turing', email: 'alan.turing@example.com', enrollmentYear: 2022, status: 'active', gender: 'male' },
    { firstName: 'Grace', lastName: 'Hopper', email: 'grace.hopper@example.com', enrollmentYear: 2021, status: 'graduated', gender: 'female' },
    { firstName: 'Katherine', lastName: 'Johnson', email: 'katherine.johnson@example.com', enrollmentYear: 2023, status: 'active', gender: 'female' },
  ]);

  const courses = await Course.bulkCreate([
    { code: 'CS101', title: 'Introduction to Computer Science', credits: 4, department: 'Computer Science', capacity: 2 },
    { code: 'MATH201', title: 'Linear Algebra', credits: 3, department: 'Mathematics', capacity: 30 },
    { code: 'CS305', title: 'Algorithms', credits: 4, department: 'Computer Science', capacity: 25 },
  ]);

  await Enrollment.bulkCreate([
    { studentId: students[0].id, courseId: courses[0].id, status: 'enrolled' },
    { studentId: students[1].id, courseId: courses[0].id, status: 'enrolled' },
    { studentId: students[1].id, courseId: courses[1].id, status: 'completed', grade: 'A' },
    { studentId: students[2].id, courseId: courses[2].id, status: 'completed', grade: 'B+' },
    { studentId: students[3].id, courseId: courses[1].id, status: 'enrolled' },
  ]);

  console.log('Seed data inserted successfully.');
  await sequelize.close();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
