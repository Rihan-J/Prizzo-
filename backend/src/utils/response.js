/**
 * ─── Standardized API Response Helpers ───
 * 
 * All endpoints MUST return:
 * {
 *   success: boolean,
 *   data: object | null,
 *   error: string | null,
 *   meta: object | null    // pagination, counts, timestamps
 * }
 */

/**
 * Send a success response
 * @param {import('express').Response} res
 * @param {number} statusCode - HTTP status (200, 201, etc.)
 * @param {object} data - Response payload
 * @param {object|null} meta - Optional metadata (pagination, etc.)
 */
const sendSuccess = (res, statusCode, data, meta = null) => {
  const response = {
    success: true,
    data,
    error: null,
  };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param {import('express').Response} res
 * @param {number} statusCode - HTTP status (400, 401, 404, 500, etc.)
 * @param {string} message - Human-readable error message
 * @param {object|null} meta - Optional metadata
 */
const sendError = (res, statusCode, message, meta = null) => {
  const response = {
    success: false,
    data: null,
    error: message,
  };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

/**
 * Build pagination meta object
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 */
const paginationMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  hasMore: page * limit < total,
});

module.exports = { sendSuccess, sendError, paginationMeta };
