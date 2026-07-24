const express = require('express');
const controller = require('../controllers/courseController');
const validate = require('../middleware/validate');
const { idParam, createCourseRules, updateCourseRules } = require('../validators/courseValidator');

const router = express.Router();

router.route('/')
  .get(controller.getAllCourses)
  .post(createCourseRules, validate, controller.createCourse);

router.route('/:id')
  .get(idParam, validate, controller.getCourseById)
  .patch(idParam, updateCourseRules, validate, controller.updateCourse)
  .delete(idParam, validate, controller.deleteCourse);

router.get('/:id/enrollments', idParam, validate, controller.getCourseEnrollments);

module.exports = router;
