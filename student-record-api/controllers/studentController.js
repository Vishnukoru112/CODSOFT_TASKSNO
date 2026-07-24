const { Student, Course, Enrollment } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { buildQueryOptions, paginatedResponse } = require('../utils/queryFeatures');

const SEARCHABLE_FIELDS = ['firstName', 'lastName', 'email'];
const FILTERABLE_FIELDS = ['status', 'enrollmentYear', 'gender'];
const SORTABLE_FIELDS = ['firstName', 'lastName', 'email', 'enrollmentYear', 'createdAt'];

/**
 * GET /api/students
 * Supports ?search=, ?status=, ?enrollmentYear=, ?sort=, ?page=, ?limit=
 */
exports.getAllStudents = catchAsync(async (req, res) => {
  const { where, order, limit, offset, page } = buildQueryOptions(req.query, {
    searchableFields: SEARCHABLE_FIELDS,
    filterableFields: FILTERABLE_FIELDS,
    allowedSortFields: SORTABLE_FIELDS,
    defaultSort: 'lastName',
  });

  const result = await Student.findAndCountAll({ where, order, limit, offset });

  res.status(200).json({
    success: true,
    ...paginatedResponse(result, page, limit),
  });
});

/**
 * GET /api/students/:id
 */
exports.getStudentById = catchAsync(async (req, res, next) => {
  const student = await Student.findByPk(req.params.id, {
    include: [{
      model: Course,
      as: 'courses',
      through: { attributes: ['id', 'status', 'grade', 'enrollmentDate'] },
    }],
  });
  if (!student) {
    return next(new ApiError(404, `Student with id ${req.params.id} not found`));
  }
  res.status(200).json({ success: true, data: student });
});

/**
 * POST /api/students
 */
exports.createStudent = catchAsync(async (req, res) => {
  const { firstName, lastName, email, dateOfBirth, gender, phone, enrollmentYear, status } = req.body;
  const student = await Student.create({
    firstName, lastName, email, dateOfBirth, gender, phone, enrollmentYear, status,
  });
  res.status(201).json({ success: true, data: student });
});

/**
 * PATCH /api/students/:id
 */
exports.updateStudent = catchAsync(async (req, res, next) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) {
    return next(new ApiError(404, `Student with id ${req.params.id} not found`));
  }
  const allowedFields = ['firstName', 'lastName', 'email', 'dateOfBirth', 'gender', 'phone', 'enrollmentYear', 'status'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) student[field] = req.body[field];
  });
  await student.save();
  res.status(200).json({ success: true, data: student });
});

/**
 * DELETE /api/students/:id
 */
exports.deleteStudent = catchAsync(async (req, res, next) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) {
    return next(new ApiError(404, `Student with id ${req.params.id} not found`));
  }
  await student.destroy(); // cascades to enrollments
  res.status(204).send();
});

/**
 * GET /api/students/:id/enrollments
 */
exports.getStudentEnrollments = catchAsync(async (req, res, next) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) {
    return next(new ApiError(404, `Student with id ${req.params.id} not found`));
  }
  const enrollments = await Enrollment.findAll({
    where: { studentId: req.params.id },
    include: [{ model: Course, as: 'course' }],
  });
  res.status(200).json({ success: true, data: enrollments });
});
