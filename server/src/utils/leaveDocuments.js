const multer = require('multer');
const path = require('node:path');

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png'
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 3, fields: 4, parts: 7, fieldSize: 32 * 1024 },
  fileFilter: (req, file, callback) => {
    const type = MIME_TYPES[path.extname(file.originalname).toLowerCase()];
    if (!type || type !== file.mimetype) {
      return callback(new Error('Medical documents must be PDF, JPG, or PNG files.'));
    }
    callback(null, true);
  }
}).array('medical_documents', 3);

function receiveLeaveDocuments(req, res, next) {
  upload(req, res, (error) => {
    if (error) {
      const messages = {
        LIMIT_FILE_SIZE: 'Each medical document must be 5 MB or smaller.',
        LIMIT_FILE_COUNT: 'You can attach up to 3 medical documents.',
        LIMIT_UNEXPECTED_FILE: 'Use medical_documents to attach up to 3 files.',
        LIMIT_FIELD_COUNT: 'Too many form fields.',
        LIMIT_PART_COUNT: 'Too many form fields or documents.',
        LIMIT_FIELD_VALUE: 'A form field is too long.'
      };
      return res.status(400).json({ message: messages[error.code] || error.message });
    }

    for (const file of req.files || []) {
      const buffer = file.buffer;
      const type = MIME_TYPES[path.extname(file.originalname).toLowerCase()];
      const valid = (type === 'application/pdf' && buffer.subarray(0, 5).toString() === '%PDF-')
        || (type === 'image/jpeg' && buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
        || (type === 'image/png' && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])));
      if (!valid) {
        return res.status(400).json({ message: 'A medical document does not match its PDF, JPG, or PNG file type.' });
      }
      // Keep display names safe for response headers and independent of client paths.
      file.originalname = path.basename(file.originalname.replace(/\\/g, '/'))
        .replace(/[\x00-\x1f\x7f]/g, '').slice(-255) || 'medical-document';
    }
    next();
  });
}

module.exports = { receiveLeaveDocuments };
