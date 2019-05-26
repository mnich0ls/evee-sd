const config = require('./app.config.json');
const request = require('request');
const og = require('open-graph');

let refresh_token__Options = {
    method: 'POST',
    url: config.meetup.oauth2.authorization.access_url,
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    form: { 
        client_id: config.meetup.oauth2.authorization.client_id,
        client_secret: config.meetup.oauth2.authorization.client_secret,
        grant_type: 'refresh_token',
        refresh_token: config.meetup.oauth2.refresh.refresh_token
    }
}

let upcoming_events__Options = { 
    method: 'GET',
    url: `${config.meetup.api.baseURL}/find/upcoming_events`,
    qs: { // lat and lon params are set for San Diego
        lat: '32.7167',
        lon: '-117.1661',
        order: 'time',
        // page: '1'
        page: '100000'
    },
    headers: {
        Authorization: null // Bearer token set in request
    }
};

// let firebase_db__Options = {
//     method: 'POST',
//     url: `${config.db.firebase.databaseURL}/scraped_events.json?auth=${config.db.firebase.authSecret}`,
//     body: {}
// }

request(refresh_token__Options, (error, response, body) => {
  if (error) throw new Error(error);
  let access_token = JSON.parse(body).access_token;
  upcoming_events__Options.headers['Authorization'] = `Bearer ${access_token}`;
  request(upcoming_events__Options, (event, response, body) => {
    if (error) throw new Error(error);
    let meetupEvents = JSON.parse(body).events;
    convertEventsToEveeFormat(meetupEvents, eveeFormattedEvents => {
        eveeFormattedEvents.forEach(eveeEvent=>{
            // firebase_db__Options.body = JSON.stringify(eveeEvent.event);
            // request(firebase_db__Options, (error, response, body) => {
                // if (error) console.log(error);
                // console.log(JSON.parse(body));
            // });

            var event = eveeEvent.event;
            var options = { 
                method: 'POST',
                url: `${config.eveesd.api.baseURL}/events/create`,
                headers: { 
                    'Authorization': `Basic ${config.eveesd.api.authorization}`,
                    'Content-Type': 'application/json' 
                },
                body: { 
                    title: event.title,
                    source: event.source_url,
                    price: event.price,
                    start_date: event.dates.start_date,
                    end_date: event.dates.end_date == '0' ? event.dates.start_date : event.dates.end_date,
                    location: event.location,
                    category: event.category,
                    details_url: event.detail_url,
                    description: '0',
                    thumbnail_url: event.thumbnail_url
                },
                json: true 
            };

            request(options, function (error, response, body) {
                if (error) console.log(error);
                console.log(body);
            });
           

        });
    });
  });
});

function convertEventsToEveeFormat(meetupEvents, cb){
    meetupEvents.forEach((meetup,index)=>{
        og(meetup.link,(err,meta)=>{
            if(meta){
                meetupEvents[index].thumbnail_url = meta.image.url;
                if(index === meetupEvents.length-1){
                    // Finished getting open graph thumbnails           
                    cb(meetupEvents.map(event=>{
                        /* 
                            Meetup API events do not have a property for a thumbnail URL.
                            However, we can obtain the image thumbnail by accessing the 
                            pages open-graph data. It contains metadata for image. We will
                            associate this to the object we are creating below. 
                        */

                        // Occassionally the meetup API appears to return events with no url
                        // This causes issue with our API validation check + we don't want them 
                        // if the user cannot navigate to them from eveesd site.

                        return {
                            "event": {
                                "title": event.name,
                                "category": 'meetup',
                                "location": event.venue ? event.venue.city : event.group.localized_location,
                                "price": event.fee ? event.fee.amount : 0,
                                "dates": {
                                    "start_date": event.local_date,
                                    "end_date": "0"
                                },
                                "time": event.local_time,
                                "thumbnail_url": event.thumbnail_url ? event.thumbnail_url: 'https://i.imgur.com/yIPRLMg.jpg',
                                "detail_url": event.link,
                                "source_url": "https://api.meetup.com/find/upcoming_events",
                                "metadata": {
                                    "status": "active",
                                    "quality_rating": "",
                                    "original_values": "",
                                }
                            }
                        }  
                    }));
                }
            }
        });
    });
}