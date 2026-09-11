const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('md5').update(password).digest('hex');
}

function signToken(payload, privateKey) {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(payload);
  return sign.sign(privateKey, 'hex');
}

function encrypt(data, key, iv) {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([cipher.update(data), cipher.final()]);
}

module.exports = { hashPassword, signToken, encrypt };