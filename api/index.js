// Vercel Serverless Function Proxy for CraftCV Studio Backend
const server = require('../backend/server.js');

module.exports = (req, res) => {
  server.emit('request', req, res);
};
