// Librería para sanitizar texto y reducir riesgo XSS.
const xss = require('xss');

// Sanitiza string simple.
function clean(value) {
  if (typeof value !== 'string') {
    return value;
  }
  return xss(value.trim());
}

module.exports = { clean };
