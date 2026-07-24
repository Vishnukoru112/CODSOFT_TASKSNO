const express = require('express');
const controller = require('../controllers/enrollmentController');
const validate = require('../middleware/validate');
const { idParam, createEnrollmentRules, updateEnrollmentRules } = require('../validators/enrollmentValidator');

const router = express.Router();

router.route('/')
  .get(controller.getAllEnrollments)
  .post(createEnrollmentRules, validate, controller.createEnrollment);

router.route('/:id')
  .get(idParam, validate, controller.getEnrollmentById)
  .patch(idParam, updateEnrollmentRules, validate, controller.updateEnrollment)
  .delete(idParam, validate, controller.deleteEnrollment);

module.exports = router;
