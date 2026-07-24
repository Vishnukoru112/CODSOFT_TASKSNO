const express = require('express');
const controller = require('../controllers/studentController');
const validate = require('../middleware/validate');
const { idParam, createStudentRules, updateStudentRules } = require('../validators/studentValidator');

const router = express.Router();

router.route('/')
  .get(controller.getAllStudents)
  .post(createStudentRules, validate, controller.createStudent);

router.route('/:id')
  .get(idParam, validate, controller.getStudentById)
  .patch(idParam, updateStudentRules, validate, controller.updateStudent)
  .delete(idParam, validate, controller.deleteStudent);

router.get('/:id/enrollments', idParam, validate, controller.getStudentEnrollments);

module.exports = router;
