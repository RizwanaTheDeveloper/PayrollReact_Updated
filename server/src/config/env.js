const path = require('path');

// Resolve relative to this file, even when launched from the repository root.
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
});
