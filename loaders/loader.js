const db = require('./connection/mysql-connection');
const aws = require('aws-sdk');
aws.config.loadFromPath('./connection/aws-sqs.config.json');
const sqs = new aws.SQS();
const QueueUrl = require('./connection/aws-sqs.config.json').QueueUrl;
const moment = require('moment');

const CronJob = require('cron').CronJob;

// Run 2:00 am daily (Insert new event data to database)
let pollSQS_Job = new CronJob('0 2 * * *', function() {
    initProcess();
}, null, null, 'America/Los_Angeles');

// Run 2:15 am daily (Update database statuses)
let updateStatus_Job = new CronJob('15 2 * * *', function() {
    updateStatus();
}, null, null, 'America/Los_Angeles');

pollSQS_Job.start();
updateStatus_Job.start();

function now() {
    return moment().format('YYYY-MM-DD hh:mm:ss')
}

function log(message, object) {
    if (object) {
        console.log(now() + ': ' + message, object)
    } else {
        console.log(now() + ": " + message)
    }
}

function initProcess(){
    sqs.getQueueAttributes({QueueUrl, AttributeNames: ['All']}, (err,res)=>{
        
        let ApproximateNumberOfMessages = Number(res.Attributes.ApproximateNumberOfMessages);
        // Max messages per receiveMessage() === 10 and perform 10 additional extra attempts to make sure we clear entire queue
        let RequiredNumberOfRequests = Math.ceil(ApproximateNumberOfMessages / 10) + 10;
        for (let index=1; index<= RequiredNumberOfRequests; index++){
            pollSQS();
        }
    });

    function pollSQS(){
        sqs.receiveMessage({
            QueueUrl,
            MessageAttributeNames: ['All'],
            MaxNumberOfMessages: 10
        },(err,data)=>{
            if(!err){
                if(data.Messages){
                    data.Messages.forEach(event=>{
                    
                        let eventObj = {};
        
                        for(let attribute in event.MessageAttributes){
                            eventObj[attribute] = event.MessageAttributes[attribute].StringValue;
                        }
        
                        let values = [];
        
                        values.push('inactive');
                        values.push(eventObj.title); 
                        values.push(eventObj.source); 
                        values.push(eventObj.price); 
                        values.push(eventObj.start_date); 
                        values.push(eventObj.end_date); 
                        
                        // NOTE: location has a pipe to separate optional zip code associated with location
                        let location = eventObj.location.split('|');
                        values.push(location[0]); // name of location
                        // If location [1] (zip code) was set as 0 (no zip provided then set NULL otherwise use zip code)
                        values.push(location[1] == 0 ? null : location[1]); // zip code if available 
                        
                        values.push(eventObj.category); 
                        values.push(eventObj.details_url); 
                        values.push(eventObj.description); 
                        values.push(eventObj.thumbnail_url); 
        
                        let SQL = `INSERT INTO events (
                            status,
                            title,
                            source,
                            price,
                            start_date,
                            end_date,
                            location,
                            zip_code,
                            category,
                            details_url,
                            description,
                            thumbnail_url
                        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?);`;
                        db.query(SQL, values, (err,results)=>{
                            if(!err){
                                // Once we stored message payload in SQL we 
                                // need to delete it from the AWS SQS queue.
                                sqs.deleteMessage({
                                    QueueUrl,
                                    ReceiptHandle: event.ReceiptHandle
                                }, (deleteError, deleteResponse)=>{
                                    if(!deleteError){
                                        // This ends that request
                                    }
                                });
                            }
                            else{
                                let timestamp = moment().format('YYYY-MM-DD hh:mm:ss')
                                console.log(timestamp + ': err', err);
                            }
                        });
                    });
                }
            }
        });
    }
}

function updateStatus(){
    let REMOVE_NON_SD_LOCATIONS_SQL = `delete e
    from events e
    left join zip_codes z on z.zip = e.zip_code
    where e.zip_code is not null
    and z.location_name is null;`

    db.query(REMOVE_NON_SD_LOCATIONS_SQL, [], (err, results) => {
        if (err) {
            log('could not remove events with locatinos outside SD', err)
        } else {
            log('removed events with locations outside SD', results)
        }
    })
    let values = ['archived', 'active'];
    let SQL = 'UPDATE events SET status=? WHERE status=? ;';
    db.query(SQL, values, (err,results)=>{
        log('deactivated all active events')
        let values = ['active', 'inactive'];
        let SQL = 'UPDATE events SET status=? WHERE status=? ;';
        db.query(SQL, values, (err,results)=>{
            log('activated all inactive events')
            // Finally remove all old inactive records from database
            let values = ['archived'];
            let SQL = 'DELETE FROM events WHERE status=? ';
            db.query(SQL, values, (err,results)=>{
                log('deleted all previous events', results)
            });
        });
    });
}