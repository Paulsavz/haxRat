'use strict';

/**
 * Send a standardised success response.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} [message]
 * @param {number} [status]
 */
function success(res, data = null, message = 'Success', status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

/**
 * Send a standardised error response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} [status]
 * @param {*} [details]
 */
function error(res, message = 'An error occurred', status = 500, details = null) {
  const payload = {
    success: false,
    message,
  };
  if (details !== null) {
    payload.details = details;
  }
  return res.status(status).json(payload);
}

/**
 * Send a paginated success response.
 * @param {import('express').Response} res
 * @param {Array} items
 * @param {number} total
 * @param {number} page
 * @param {number} limit
 * @param {string} [message]
 */
function paginated(res, items, total, page, limit, message = 'Success') {
  return res.status(200).json({
    success: true,
    message,
    data: items,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    },
  });
}

module.exports = { success, error, paginated };
