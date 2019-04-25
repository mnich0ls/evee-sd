var config = require('./api-defaults.config.json');

var api = require('express').Router();
var eventsAPI = require('./events');

/* Evee API v1 */
api.get('/version', function(req, res) {
  res.json({
    version: config.version
  });
});

api.use('/events', eventsAPI)

module.exports = api;