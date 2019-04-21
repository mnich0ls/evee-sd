var events = require('express').Router();

var EventCreate = require('./controllers/EventCreate');

/* Evee API v1 [Events] */
events.post('/create', function(req, res) {
    EventCreate(req.body, function(response){
        res.json(response);
    });
});

module.exports = events;