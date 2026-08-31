/**
 * Escapes special Regular Expression characters from user input strings
 * to prevent query injection and ReDoS vulnerabilities in MongoDB $regex queries.
 */
function escapeRegex(text = '') {
  return String(text).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

module.exports = escapeRegex;
