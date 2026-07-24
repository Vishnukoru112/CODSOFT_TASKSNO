const { body, param } = require('express-validator');

const STATUSES = ['active', 'archived'];

const idParam = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer'),
];

const createCourseRules = [
  body('code').trim().notEmpty().withMessage('code is required')
    .isLength({ min: 2, max: 20 }).withMessage('code must be 2-20 characters'),
  body('title').trim().notEmpty().withMessage('title is required')
    .isLength({ min: 2, max: 150 }).withMessage('title must be 2-150 characters'),
  body('description').optional({ nullable: true }).isString(),
  body('credits').notEmpty().withMessage('credits is required')
    .isInt({ min: 1, max: 12 }).withMessage('credits must be between 1 and 12'),
  body('department').trim().notEmpty().withMessage('department is required')
    .isLength({ max: 80 }),
  body('capacity').optional().isInt({ min: 1 }).withMessage('capacity must be a positive integer'),
  body('status').optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(', ')}`),
];

const updateCourseRules = [
  body('code').optional().trim().notEmpty().isLength({ min: 2, max: 20 }),
  body('title').optional().trim().notEmpty().isLength({ min: 2, max: 150 }),
  body('description').optional({ nullable: true }).isString(),
  body('credits').optional().isInt({ min: 1, max: 12 }),
  body('department').optional().trim().notEmpty().isLength({ max: 80 }),
  body('capacity').optional().isInt({ min: 1 }),
  body('status').optional().isIn(STATUSES),
];

module.exports = { idParam, createCourseRules, updateCourseRules };
