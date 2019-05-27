var basicAuth = require('express-basic-auth');

// basic auth middlware
var authConfig = require('../api-auth.config.json'); 

module.exports = basicAuth({
  users: { 
    [authConfig.username] : authConfig.password 
  }
});