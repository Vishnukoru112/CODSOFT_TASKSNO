const { body, param } = require('express-validator');

const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'];
const STATUSES = ['active', 'inactive', 'graduated', 'suspended'];

const idParam = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer'),
];

const createStudentRules = [
  body('firstName').trim().notEmpty().withMessage('firstName is required')
    .isLength({ max: 50 }).withMessage('firstName must be at most 50 characters'),
  body('lastName').trim().notEmpty().withMessage('lastName is required')
    .isLength({ max: 50 }).withMessage('lastName must be at most 50 characters'),
  body('email').trim().notEmpty().withMessage('email is required')
    .isEmail().withMessage('email must be a valid email address').normalizeEmail(),
  body('dateOfBirth').optional({ nullable: true }).isISO8601().withMessage('dateOfBirth must be a valid date (YYYY-MM-DD)'),
  body('gender').optional({ nullable: true }).isIn(GENDERS).withMessage(`gender must be one of: ${GENDERS.join(', ')}`),
  body('phone').optional({ nullable: true }).isString().isLength({ max: 20 }),
  body('enrollmentYear').notEmpty().withMessage('enrollmentYear is required')
    .isInt({ min: 1990, max: 2100 }).withMessage('enrollmentYear must be a valid year'),
  body('status').optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(', ')}`),
];

const updateStudentRules = [
  body('firstName').optional().trim().notEmpty().withMessage('firstName cannot be empty')
    .isLength({ max: 50 }),
  body('lastName').optional().trim().notEmpty().withMessage('lastName cannot be empty')
    .isLength({ max: 50 }),
  body('email').optional().trim().isEmail().withMessage('email must be a valid email address').normalizeEmail(),
  body('dateOfBirth').optional({ nullable: true }).isISO8601(),
  body('gender').optional({ nullable: true }).isIn(GENDERS),
  body('phone').optional({ nullable: true }).isString().isLength({ max: 20 }),
  body('enrollmentYear').optional().isInt({ min: 1990, max: 2100 }),
  body('status').optional().isIn(STATUSES),
];

module.exports = { idParam, createStudentRules, updateStudentRules };
