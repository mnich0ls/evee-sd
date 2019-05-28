var events = require('express').Router();

var EventCreate = require('./controllers/EventCreate');
var EventGet = require('./controllers/EventGet');

var authenticate = require('../../../../auth');

/* Evee API v1 [Events] */

events.get('/', function (req, res) {
    EventGet(req.query, function(response){
        res.json(response);
    });
});

events.post('/create', authenticate, function(req, res) {
    EventCreate(req.body, function(response){
        res.json(response);
    });
});

module.exports = events;