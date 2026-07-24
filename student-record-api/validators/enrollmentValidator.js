const { body, param } = require('express-validator');

const STATUSES = ['enrolled', 'completed', 'dropped', 'failed'];
const GRADES = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];

const idParam = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer'),
];

const createEnrollmentRules = [
  body('studentId').notEmpty().withMessage('studentId is required')
    .isInt({ min: 1 }).withMessage('studentId must be a positive integer'),
  body('courseId').notEmpty().withMessage('courseId is required')
    .isInt({ min: 1 }).withMessage('courseId must be a positive integer'),
  body('enrollmentDate').optional().isISO8601().withMessage('enrollmentDate must be a valid date'),
  body('status').optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(', ')}`),
  body('grade').optional({ nullable: true }).isIn(GRADES).withMessage(`grade must be one of: ${GRADES.join(', ')}`),
];

const updateEnrollmentRules = [
  body('status').optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(', ')}`),
  body('grade').optional({ nullable: true }).isIn(GRADES).withMessage(`grade must be one of: ${GRADES.join(', ')}`),
];

module.exports = { idParam, createEnrollmentRules, updateEnrollmentRules };
