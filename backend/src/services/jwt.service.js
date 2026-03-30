const jwt = require("jsonwebtoken");
const config = require("../config/env");

/**
 * Generate a signed JWT token.
 * @param {{ userId: string, role: string }} payload
 * @returns {string} Signed JWT
 */
const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * Verify and decode a JWT token.
 * @param {string} token
 * @returns {object} Decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

module.exports = { generateToken, verifyToken };
