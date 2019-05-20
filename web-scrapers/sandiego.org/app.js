// const express = require('express')
// const app = express()
// const port = process.env.PORT || 3000;
const axios = require('axios')
const request = require('request') // already had snippet below to use request didn't want to switch to axios
const config = require('./app.config.json');

// Load add-ons
const addons = {
    EventDatesFormatter: require('./addons/EventDatesFormatter')
}

// Authentication [Basic Auth] middleware

// app.use((req, res, next) => {

//     const auth = {login: config.scraper.username, password: config.scraper.password}
//     // parse login and password from headers
//     const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
//     const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')

//     // Verify login and password are set and correct
//     if (!login || !password || login !== auth.login || password !== auth.password) {
//         res.set('WWW-Authenticate', 'Basic realm="401"')
//         res.status(401).send('Authentication failure.')
//         return
//     }
//     // Access granted...
//     next()
// })

// Scrape events GET endpoint

// app.get('/scrape/events', (req, res) => {
axios.get('https://www.sandiego.org/handler/getfilterdata',{
    params: {
        s: 10000,
        t: 'e'
    }
}).then(response=>{
    addons.EventDatesFormatter(response.data.results, resultsDateFormatted =>{
        convertEventsToEveeFormat(resultsDateFormatted);
        // axios.put(
        //     `${config.db.firebase.databaseURL}/scraped_events.json?auth=${config.db.firebase.authSecret}`, 
        //     JSON.stringify(resultsDateFormatted)
        // ).then(()=>{
        //     res.json(200);
        // });
    });
}).catch(err=>{
    // res.status(500).json({ error: err})
    console.log(err);
});
// });

// app.listen(port, () => console.log(`[sandiego.org] scraper app listening on port ${port}!`));

function convertEventsToEveeFormat(sandiegoORG_Events, cb){
    let eveeFormattedEvents = []
    sandiegoORG_Events.forEach((event,index)=>{
        eveeFormattedEvents.push({
            "event": {
                "title": event.title,
                "category": event.tag,
                "location": event.region === '' ? 'San Diego' : event.region,
                "price": (()=>{
                    if(event.price === '' || event.price === 'Free'){
                        return 0;
                    }
                    else{
                        // For example SanDiego.org has sometimes price: '$15-$70'
                        // We will show the lower of the range
                        let pricing = parseInt(event.price.split('-')[0].replace('$',''))
                        if(isNaN(pricing)){
                            // If there is an event that contains pricing info 
                            // that we cannot easily parse we are sending -1 value
                            // to the API. This will allow the API to know that 
                            // the event has pricing info but we did not have the 
                            // ability to easily parse it.
                            return -1
                        }
                        else{
                            return pricing;
                        }
                    }
                })(),
                "dates": {
                    "start_date": event.start_date,
                    "end_date": event.end_date === 'ongoing' ? '0' : event.end_date
                },
                "time": '0',
                "thumbnail_url": event.thumbnailImage,
                "detail_url": event.url,
                "source_url": 'https://www.sandiego.org/handler/getfilterdata',
                "metadata": {
                    "status": "active",
                    "quality_rating": "",
                    "original_values": "",
                }
            }
        });
    });
    eveeFormattedEvents.forEach(eveeEvent => {
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
}
