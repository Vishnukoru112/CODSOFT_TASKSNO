const { Course, Student, Enrollment } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { buildQueryOptions, paginatedResponse } = require('../utils/queryFeatures');

const SEARCHABLE_FIELDS = ['title', 'code', 'department'];
const FILTERABLE_FIELDS = ['department', 'status', 'credits'];
const SORTABLE_FIELDS = ['title', 'code', 'credits', 'department', 'createdAt'];

/**
 * GET /api/courses
 * Supports ?search=, ?department=, ?status=, ?sort=, ?page=, ?limit=
 */
exports.getAllCourses = catchAsync(async (req, res) => {
  const { where, order, limit, offset, page } = buildQueryOptions(req.query, {
    searchableFields: SEARCHABLE_FIELDS,
    filterableFields: FILTERABLE_FIELDS,
    allowedSortFields: SORTABLE_FIELDS,
    defaultSort: 'title',
  });

  const result = await Course.findAndCountAll({ where, order, limit, offset });

  res.status(200).json({
    success: true,
    ...paginatedResponse(result, page, limit),
  });
});

/**
 * GET /api/courses/:id
 */
exports.getCourseById = catchAsync(async (req, res, next) => {
  const course = await Course.findByPk(req.params.id, {
    include: [{
      model: Student,
      as: 'students',
      through: { attributes: ['id', 'status', 'grade', 'enrollmentDate'] },
    }],
  });
  if (!course) {
    return next(new ApiError(404, `Course with id ${req.params.id} not found`));
  }
  res.status(200).json({ success: true, data: course });
});

/**
 * POST /api/courses
 */
exports.createCourse = catchAsync(async (req, res) => {
  const { code, title, description, credits, department, capacity, status } = req.body;
  const course = await Course.create({ code, title, description, credits, department, capacity, status });
  res.status(201).json({ success: true, data: course });
});

/**
 * PATCH /api/courses/:id
 */
exports.updateCourse = catchAsync(async (req, res, next) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) {
    return next(new ApiError(404, `Course with id ${req.params.id} not found`));
  }
  const allowedFields = ['code', 'title', 'description', 'credits', 'department', 'capacity', 'status'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) course[field] = req.body[field];
  });
  await course.save();
  res.status(200).json({ success: true, data: course });
});

/**
 * DELETE /api/courses/:id
 */
exports.deleteCourse = catchAsync(async (req, res, next) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) {
    return next(new ApiError(404, `Course with id ${req.params.id} not found`));
  }
  await course.destroy(); // cascades to enrollments
  res.status(204).send();
});

/**
 * GET /api/courses/:id/enrollments
 */
exports.getCourseEnrollments = catchAsync(async (req, res, next) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) {
    return next(new ApiError(404, `Course with id ${req.params.id} not found`));
  }
  const enrollments = await Enrollment.findAll({
    where: { courseId: req.params.id },
    include: [{ model: Student, as: 'student' }],
  });
  res.status(200).json({ success: true, data: enrollments });
});
