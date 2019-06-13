var config = require('../eventsAPI.config.json');

// Amazon SDK - SQS (Simple Queue Service) Setup
var aws = require('aws-sdk');
aws.config.loadFromPath(`${__dirname}/../aws-sqs.config.json`);
var sqs = new aws.SQS();

var ValidateRequestBody = require('../../../../../helpers/ValidateRequestBody');

var requiredParams = [
    'title',
    'source',
    'price',
    'start_date',
    'end_date',
    'location',
    'description',
    'thumbnail_url',
    'category',
    'details_url'
];

var paramValidations = {
    'title': {
        minLength: 6,
        maxLength: 250
    },
    'source': {
        // allowedValues: ['meetup.com','sandiego.org']
        type: 'Url',
        minLength: 1
    },
    'price': {
        type: 'Currency'
    },
    'start_date': {
        type: 'Date',
    },
    'end_date': {
        type: 'Date',
    },
    'location': {
        minLength: 2,
        maxLength: 200
    },
    // 'zip_code': {
    //     minLength: 0,
    //     maxLength: 10
    // },
    'description': {
        minLength: 0,
        maxLength: 2500
    },
    'thumbnail_url': {
        type: 'Url',
        minLength: 0,
    },
    'category': {
        // allowedValues: ['concerts', 'festivals', 'free events', 'shows', 'nightlife', 'other']
        minLength: 1
    },
    'details_url': {
        type: 'Url',
        minLength: 1,
    }
}

module.exports = function(payload, callback){
    var validation = ValidateRequestBody(payload, requiredParams, paramValidations);
    
    // AWS SQS appears to need the price value as string
    payload.price = payload.price.toString();

    // All required parameters are provided and event payload is allowed
    if(validation.length === 0){
        sendValidatedEventToMessageQueue(payload)
            .then(function(res){
                callback(res)
            })
            .catch(function(err){
                callback(err);
            });
    }
    else{
        // Missing required request parameters
        callback(validation);
    }
}

function sendValidatedEventToMessageQueue(payload){
    return new Promise(function(resolve,reject){
        sqs.sendMessage({
            MessageAttributes: {
                "title": {
                    DataType: "String",
                    StringValue: payload.title
                },
                "source": {
                    DataType: "String",
                    StringValue: payload.source
                },
                "price": {
                    DataType: "String",
                    StringValue: payload.price
                },
                "start_date": {
                    DataType: "String",
                    StringValue: payload.start_date
                },
                "end_date": {
                    DataType: "String",
                    StringValue: payload.end_date
                },
                "location": {
                    DataType: "String",
                    StringValue: `${payload.location}|${payload.zip_code || 0}`
                },
                "description": {
                    DataType: "String",
                    StringValue: payload.description
                },
                "thumbnail_url": {
                    DataType: "String",
                    StringValue: payload.thumbnail_url
                },
                "category": {
                    DataType: "String",
                    StringValue: payload.category
                },
                "details_url": {
                    DataType: "String",
                    StringValue: payload.details_url
                }                
            },
            MessageBody: `Evee event (Source: ${payload.source}) - ${payload.title}.`,
            QueueUrl: config.eventsAPI.aws.sqs.queueURL
        }, (err,data)=>{
            if(!err) resolve(data);
            else reject(err);
        });
    });
}