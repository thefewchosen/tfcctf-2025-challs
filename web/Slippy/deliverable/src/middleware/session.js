const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const USER_ID_REGEX = /^[a-f0-9]{16}$/;

function isValidUserId(id) {
  return id === 'develop' || USER_ID_REGEX.test(id);
}

module.exports = function (req, res, next) {
    if (!isValidUserId(req.session.userId)) {
      req.session.userId = crypto.randomBytes(8).toString('hex');
    }
  
    const userDir = path.join(__dirname, '../uploads', req.session.userId);
    fs.mkdirSync(userDir, { recursive: true });
  
    next();
  };