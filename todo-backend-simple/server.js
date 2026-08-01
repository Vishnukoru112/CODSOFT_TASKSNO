/**
 * TO-DO LIST BACKEND — single-file version
 * Express + Sequelize (SQLite) + JWT auth + validation + Swagger docs
 *
 * Run:
 *   npm install
 *   cp .env.example .env
 *   npm start
 * Docs: http://localhost:3000/api-docs
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes, Model, Op } = require('sequelize');
const { body, param, validationResult } = require('express-validator');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ------------------------------------------------------------------
// DATABASE
// ------------------------------------------------------------------
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_STORAGE || './database.sqlite',
  logging: false,
});

// ---- User model ----
class User extends Model {
  async comparePassword(candidate) {
    return bcrypt.compare(candidate, this.password);
  }
  toSafeJSON() {
    const { id, name, email, createdAt, updatedAt } = this.toJSON();
    return { id, name, email, createdAt, updatedAt };
  }
}
User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true, len: [1, 100] } },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    password: { type: DataTypes.STRING, allowNull: false },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    hooks: {
      beforeCreate: async (u) => { u.password = await bcrypt.hash(u.password, 10); },
      beforeUpdate: async (u) => { if (u.changed('password')) u.password = await bcrypt.hash(u.password, 10); },
    },
  }
);

// ---- Task model ----
class Task extends Model {}
Task.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true, len: [1, 200] } },
    description: { type: DataTypes.TEXT, allowNull: true, defaultValue: '' },
    status: { type: DataTypes.ENUM('pending', 'completed'), allowNull: false, defaultValue: 'pending' },
    priority: { type: DataTypes.ENUM('low', 'medium', 'high'), allowNull: false, defaultValue: 'medium' },
    category: { type: DataTypes.STRING, allowNull: true, defaultValue: 'general' },
    dueDate: { type: DataTypes.DATEONLY, allowNull: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, modelName: 'Task', tableName: 'tasks' }
);
User.hasMany(Task, { foreignKey: 'userId', onDelete: 'CASCADE' });
Task.belongsTo(User, { foreignKey: 'userId' });

// ------------------------------------------------------------------
// MIDDLEWARE
// ------------------------------------------------------------------
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized. No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token has expired. Please log in again.' : 'Invalid token.';
    return res.status(401).json({ success: false, message });
  }
  const user = await User.findByPk(decoded.id);
  if (!user) return res.status(401).json({ success: false, message: 'User no longer exists.' });
  req.user = user;
  next();
});

// ------------------------------------------------------------------
// APP
// ------------------------------------------------------------------
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.status(200).json({ success: true, message: 'Service is healthy.' }));

// ------------------------------------------------------------------
// AUTH ROUTES
// ------------------------------------------------------------------
const signToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

/**
 * @swagger
 * tags:
 *   - name: Auth
 *   - name: Tasks
 * components:
 *   securitySchemes:
 *     bearerAuth: { type: http, scheme: bearer, bearerFormat: JWT }
 *
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: Jane Doe }
 *               email: { type: string, example: jane@example.com }
 *               password: { type: string, example: SecurePass123 }
 *     responses:
 *       201: { description: User registered }
 *       409: { description: Email already in use }
 *       422: { description: Validation failed }
 */
app.post(
  '/api/auth/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 100 }),
    body('email').trim().isEmail().withMessage('A valid email is required.').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ success: false, message: 'A user with this email already exists.' });
    const user = await User.create({ name, email, password });
    res.status(201).json({ success: true, message: 'User registered successfully.', data: { user: user.toSafeJSON(), token: signToken(user.id) } });
  })
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login and receive a JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials }
 */
app.post(
  '/api/auth/login',
  [
    body('email').trim().isEmail().withMessage('A valid email is required.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    res.status(200).json({ success: true, message: 'Login successful.', data: { user: user.toSafeJSON(), token: signToken(user.id) } });
  })
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get logged-in user's profile
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Current user }
 *       401: { description: Not authorized }
 */
app.get('/api/auth/me', protect, (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user.toSafeJSON() } });
});

// ------------------------------------------------------------------
// TASK ROUTES
// ------------------------------------------------------------------
const taskBodyValidation = [
  body('title').trim().notEmpty().withMessage('Title is required.').isLength({ max: 200 }),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('dueDate').optional({ nullable: true }).isISO8601(),
  body('status').optional().isIn(['pending', 'completed']),
];

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a task
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string, example: Finish quarterly report }
 *               description: { type: string }
 *               priority: { type: string, enum: [low, medium, high] }
 *               category: { type: string, example: work }
 *               dueDate: { type: string, format: date, example: 2026-08-15 }
 *     responses:
 *       201: { description: Task created }
 *       401: { description: Not authorized }
 *       422: { description: Validation failed }
 *   get:
 *     summary: List tasks (filter, search, paginate, sort)
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, completed] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high] }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: List of tasks }
 */
app.post(
  '/api/tasks',
  protect,
  taskBodyValidation,
  validate,
  asyncHandler(async (req, res) => {
    const { title, description, priority, category, dueDate, status } = req.body;
    const task = await Task.create({ title, description, priority, category, dueDate, status, userId: req.user.id });
    res.status(201).json({ success: true, message: 'Task created successfully.', data: { task } });
  })
);

app.get(
  '/api/tasks',
  protect,
  asyncHandler(async (req, res) => {
    const { status, priority, category, search, page = 1, limit = 10, sortBy = 'createdAt', order = 'DESC' } = req.query;
    const where = { userId: req.user.id };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (search) where.title = { [Op.like]: `%${search}%` };

    const allowedSort = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'title'];
    const sortField = allowedSort.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    const { rows: tasks, count: total } = await Task.findAndCountAll({
      where,
      order: [[sortField, sortOrder]],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
    });

    res.status(200).json({
      success: true,
      data: { tasks, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } },
    });
  })
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a single task
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Task found }
 *       404: { description: Task not found }
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Task updated }
 *       404: { description: Task not found }
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Task deleted }
 *       404: { description: Task not found }
 */
app.get(
  '/api/tasks/:id',
  protect,
  [param('id').isInt()],
  validate,
  asyncHandler(async (req, res) => {
    const task = await Task.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    res.status(200).json({ success: true, data: { task } });
  })
);

app.put(
  '/api/tasks/:id',
  protect,
  [param('id').isInt(), ...taskBodyValidation.map((v) => v.optional())],
  validate,
  asyncHandler(async (req, res) => {
    const task = await Task.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    const { title, description, priority, category, dueDate, status } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (category !== undefined) task.category = category;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (status !== undefined) task.status = status;
    await task.save();
    res.status(200).json({ success: true, message: 'Task updated successfully.', data: { task } });
  })
);

/**
 * @swagger
 * /api/tasks/{id}/status:
 *   patch:
 *     summary: Mark a task pending or completed
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [pending, completed] }
 *     responses:
 *       200: { description: Status updated }
 *       404: { description: Task not found }
 */
app.patch(
  '/api/tasks/:id/status',
  protect,
  [param('id').isInt(), body('status').isIn(['pending', 'completed'])],
  validate,
  asyncHandler(async (req, res) => {
    const task = await Task.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    task.status = req.body.status;
    await task.save();
    res.status(200).json({ success: true, message: `Task marked as ${task.status}.`, data: { task } });
  })
);

app.delete(
  '/api/tasks/:id',
  protect,
  [param('id').isInt()],
  validate,
  asyncHandler(async (req, res) => {
    const task = await Task.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    await task.destroy();
    res.status(200).json({ success: true, message: 'Task deleted successfully.' });
  })
);

// ------------------------------------------------------------------
// SWAGGER DOCS
// ------------------------------------------------------------------
const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'To-Do List Backend API', version: '1.0.0', description: 'Task management REST API with auth.' },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  apis: [__filename],
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ------------------------------------------------------------------
// 404 + ERROR HANDLING
// ------------------------------------------------------------------
app.use((req, res) => res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` }));

app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(422).json({ success: false, message: 'Validation failed.', errors: err.errors.map((e) => ({ field: e.path, message: e.message })) });
  }
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Internal server error.' });
});

// ------------------------------------------------------------------
// START
// ------------------------------------------------------------------
(async () => {
  await sequelize.authenticate();
  await sequelize.sync();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API docs at http://localhost:${PORT}/api-docs`);
  });
})();

module.exports = app;
