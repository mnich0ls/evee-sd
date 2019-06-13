const config = require('./app.config.json');

const log4js = require('log4js')
const CronJob = require('cron').CronJob;
const moment = require('moment');
const axios = require('axios');
const request = require('request-promise-native');
const cheerio = require('cheerio');
const Bottleneck = require('bottleneck');


const logger = log4js.getLogger();

logger.level = 'all';

const monthFromNow = moment().add(1, 'months').calendar().split('/');

const date = {
    start: moment().format('YYYY-MM-DD'),
    end: monthFromNow[2]+'-'+monthFromNow[0]+'-'+monthFromNow[1]
}

const baseURL = 'https://www.sandiegoreader.com';
const initParams = `/events/search/?category=&start_date=${date.start}&end_date=${date.end}&q=`;

let eventHrefs = [];
let processedEvents = [];
let pageIndex = 1;

const limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 3600
});

// Run 12:45 am midnight daily
let scheduledJob = new CronJob('0 45 0 * * *', function() {
    getIndexRefs(initParams);
}, null, null, 'America/Los_Angeles');

scheduledJob.start();

async function getIndexRefs(params){
    logger.warn(`[Getting Page: (${pageIndex}) index urls]`);
    try{
        const req = await limiter.schedule(() => axios.get(`${baseURL}${params}`));
        const $ = cheerio.load(req.data);
        const indexRefs = $('tr h4 a')
        for(let ref in indexRefs){
            if(indexRefs[ref].hasOwnProperty('attribs')){
                if(indexRefs[ref].attribs.href){
                    eventHrefs.push(indexRefs[ref].attribs.href);
                }
            }
        }
        const nextPageRefParams = $('.button').attr('href');
        if(nextPageRefParams !== '#'){
            pageIndex += 1; 
            getIndexRefs(nextPageRefParams);
        }
        else
            getRefDetails(); 
    }
    catch(e){
        logger.error(e);
    }
}

async function getRefDetails(){
    try{
        for(let ref = 0; ref < eventHrefs.length; ref++){
    
            const req = await limiter.schedule(() => axios.get(`${baseURL}${eventHrefs[ref]}`));
            const $ = cheerio.load(req.data);

            const schema = $('script[type="application/ld+json"]')['1'].children[0].data.trim();
            let event = JSON.parse(schema);
            
            if(Array.isArray(event))
                event = event[0];

            if(event){
                event.category = $('.categories a').first().text();
                processedEvents.push({ 
                    title: event.name,
                    source: baseURL,
                    price: event.offers ? event.offers.lowPrice : -1,
                    start_date: (()=>{
                        const today = moment().format('YYYY-MM-DD');
                        if(moment(event.startDate).isBefore(today))
                            return today;
                        else 
                            return event.startDate
                    })(),
                    end_date: (()=>{
                        const isOngoing = event.url.split('/').includes('ongoing');
                        if(isOngoing)
                            return '0'
                        else{
                            const today = moment().format('YYYY-MM-DD');
                            if(moment(event.startDate).isBefore(today))
                                return today;
                            else 
                                return event.startDate
                        }
                    })(),
                    location: (()=>{
                        if(event.location){
                            if(event.location.hasOwnProperty('address')){
                                if(event.location.address.addressLocality)
                                    return event.location.address.addressLocality;
                            }
                            return 'San Diego'
                        }
                    })(),
                    zip_code:  (()=>{
                        if(event.location){
                            if(event.location.hasOwnProperty('address')){
                                if(event.location.address.postalCode)
                                    return event.location.address.postalCode;
                            }
                            return null
                        }
                    })(),
                    category: event.category,
                    details_url: event.url,
                    description: event.description,
                    thumbnail_url: event.image ? event.image : 'https://i.imgur.com/yIPRLMg.jpg'
                });

                // Push this newly created event to the EveeSD API
                let currentProcessingEvent = processedEvents[processedEvents.length-1];

                let eveeApiResult = await request({ 
                    method: 'POST',
                    url: `${config.eveesd.api.baseURL}/events/create`,
                    headers: { 
                        'Authorization': `Basic ${config.eveesd.api.authorization}`,
                        'Content-Type': 'application/json' 
                    },
                    body: currentProcessingEvent,
                    json: true 
                });

                logger.info(`[SENT EVENT TO SQS OK] : ${currentProcessingEvent.title}`);

            }
        }
        logger.warn(`[Task Completed]: Total events processed: ${eventHrefs.length}`);
    }
    catch(e){
        logger.error(e);
    }
}