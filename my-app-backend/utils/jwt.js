const jwt = require('jsonwebtoken');

/**
 * Sign a JWT token
 * @param {Object} payload - The data to include in the JWT (e.g., user info).
 * @param {string} secret - The secret key used to sign the token (from env variable).
 * @param {string} expiresIn - The expiration time for the token (e.g., '30d').
 * @returns {string} The signed JWT token.
 */
const signToken = (payload, secret, expiresIn = '30d') => {
  return jwt.sign(payload, secret, {
    expiresIn,
  });
};

/**
 * Verify a JWT token
 * @param {string} token - The JWT token to verify.
 * @param {string} secret - The secret key used to verify the token.
 * @returns {Object} The decoded token payload (or null if invalid).
 */
const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    return null; // If the token is invalid or expired, return null.
  }
};

module.exports = { signToken, verifyToken };
