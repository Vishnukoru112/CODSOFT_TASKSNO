const { Op } = require('sequelize');

/**
 * Builds Sequelize `findAndCountAll` options from Express query params.
 *
 * Supported query params:
 *  - page, limit            -> pagination (defaults: page=1, limit=10, max limit=100)
 *  - sort                   -> e.g. "lastName" (asc) or "-lastName" (desc), comma separated for multiple
 *  - search                 -> free-text search across `searchableFields`
 *  - any field in `filterableFields` -> exact match filter, e.g. ?status=active
 *    Supports suffix operators for numeric/date fields: field_gte, field_lte, field_gt, field_lt
 *
 * @param {object} query - req.query
 * @param {object} options
 * @param {string[]} options.searchableFields - fields eligible for free-text `search`
 * @param {string[]} options.filterableFields - fields eligible for exact/range filtering
 * @param {string[]} options.allowedSortFields - fields eligible for sorting
 * @param {string} [options.defaultSort] - default sort field
 */
function buildQueryOptions(query, {
  searchableFields = [],
  filterableFields = [],
  allowedSortFields = [],
  defaultSort = 'id',
} = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const offset = (page - 1) * limit;

  const where = {};
  const andConditions = [];

  // Free-text search across allowed fields (case-insensitive partial match)
  if (query.search && searchableFields.length) {
    andConditions.push({
      [Op.or]: searchableFields.map((field) => ({
        [field]: { [Op.like]: `%${query.search}%` },
      })),
    });
  }

  // Exact-match and range filters
  filterableFields.forEach((field) => {
    if (query[field] !== undefined) {
      where[field] = query[field];
    }
    const rangeOps = { gte: Op.gte, lte: Op.lte, gt: Op.gt, lt: Op.lt };
    Object.entries(rangeOps).forEach(([suffix, op]) => {
      const key = `${field}_${suffix}`;
      if (query[key] !== undefined) {
        where[field] = { ...(where[field] || {}), [op]: query[key] };
      }
    });
  });

  if (andConditions.length) {
    where[Op.and] = andConditions;
  }

  // Sorting: "?sort=lastName,-enrollmentYear"
  let order = [[defaultSort, 'ASC']];
  if (query.sort) {
    order = query.sort
      .split(',')
      .map((raw) => raw.trim())
      .filter((field) => {
        const bare = field.replace(/^-/, '');
        return allowedSortFields.includes(bare);
      })
      .map((field) => {
        if (field.startsWith('-')) {
          return [field.slice(1), 'DESC'];
        }
        return [field, 'ASC'];
      });
    if (order.length === 0) {
      order = [[defaultSort, 'ASC']];
    }
  }

  return {
    where,
    order,
    limit,
    offset,
    page,
  };
}

/**
 * Shapes a Sequelize findAndCountAll result into a paginated API response.
 */
function paginatedResponse({ count, rows }, page, limit) {
  return {
    data: rows,
    pagination: {
      totalItems: count,
      totalPages: Math.ceil(count / limit) || 1,
      currentPage: page,
      pageSize: limit,
    },
  };
}

module.exports = { buildQueryOptions, paginatedResponse };
