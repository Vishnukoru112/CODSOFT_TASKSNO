const { Enrollment, Student, Course } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { buildQueryOptions, paginatedResponse } = require('../utils/queryFeatures');

const FILTERABLE_FIELDS = ['studentId', 'courseId', 'status'];
const SORTABLE_FIELDS = ['enrollmentDate', 'status', 'createdAt'];

/**
 * GET /api/enrollments
 * Supports ?studentId=, ?courseId=, ?status=, ?sort=, ?page=, ?limit=
 */
exports.getAllEnrollments = catchAsync(async (req, res) => {
  const { where, order, limit, offset, page } = buildQueryOptions(req.query, {
    filterableFields: FILTERABLE_FIELDS,
    allowedSortFields: SORTABLE_FIELDS,
    defaultSort: 'enrollmentDate',
  });

  const result = await Enrollment.findAndCountAll({
    where,
    order,
    limit,
    offset,
    include: [
      { model: Student, as: 'student', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: Course, as: 'course', attributes: ['id', 'code', 'title'] },
    ],
  });

  res.status(200).json({
    success: true,
    ...paginatedResponse(result, page, limit),
  });
});

/**
 * GET /api/enrollments/:id
 */
exports.getEnrollmentById = catchAsync(async (req, res, next) => {
  const enrollment = await Enrollment.findByPk(req.params.id, {
    include: [
      { model: Student, as: 'student' },
      { model: Course, as: 'course' },
    ],
  });
  if (!enrollment) {
    return next(new ApiError(404, `Enrollment with id ${req.params.id} not found`));
  }
  res.status(200).json({ success: true, data: enrollment });
});

/**
 * POST /api/enrollments
 * Business rules enforced:
 *  - student and course must exist
 *  - student cannot enroll in the same course twice (DB unique index also guards this)
 *  - course must not be over capacity
 */
exports.createEnrollment = catchAsync(async (req, res, next) => {
  const { studentId, courseId, enrollmentDate, status, grade } = req.body;

  const [student, course] = await Promise.all([
    Student.findByPk(studentId),
    Course.findByPk(courseId),
  ]);
  if (!student) return next(new ApiError(404, `Student with id ${studentId} not found`));
  if (!course) return next(new ApiError(404, `Course with id ${courseId} not found`));

  const existing = await Enrollment.findOne({ where: { studentId, courseId } });
  if (existing) {
    return next(new ApiError(409, 'This student is already enrolled in this course'));
  }

  const activeCount = await Enrollment.count({
    where: { courseId, status: 'enrolled' },
  });
  if (activeCount >= course.capacity) {
    return next(new ApiError(409, `Course "${course.title}" has reached its capacity (${course.capacity})`));
  }

  const enrollment = await Enrollment.create({
    studentId, courseId, enrollmentDate, status, grade,
  });
  res.status(201).json({ success: true, data: enrollment });
});

/**
 * PATCH /api/enrollments/:id
 * Typically used to update status (e.g. mark completed/dropped) or record a grade.
 */
exports.updateEnrollment = catchAsync(async (req, res, next) => {
  const enrollment = await Enrollment.findByPk(req.params.id);
  if (!enrollment) {
    return next(new ApiError(404, `Enrollment with id ${req.params.id} not found`));
  }
  const allowedFields = ['status', 'grade'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) enrollment[field] = req.body[field];
  });
  await enrollment.save();
  res.status(200).json({ success: true, data: enrollment });
});

/**
 * DELETE /api/enrollments/:id
 */
exports.deleteEnrollment = catchAsync(async (req, res, next) => {
  const enrollment = await Enrollment.findByPk(req.params.id);
  if (!enrollment) {
    return next(new ApiError(404, `Enrollment with id ${req.params.id} not found`));
  }
  await enrollment.destroy();
  res.status(204).send();
});
