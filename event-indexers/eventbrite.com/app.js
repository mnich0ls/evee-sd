const eventbrite = require('eventbrite').default;
const config = require('./app.config.json');
const request = require('request');
const CronJob = require('cron').CronJob;

// Run 12:20 am midnight daily
let scheduledJob = new CronJob('0 20 0 * * *', function() {
    console.log('Scheduled job started!');
    makeRequest();
}, null, null, 'America/Los_Angeles');

scheduledJob.start();

function makeRequest(){

    // Create configured Eventbrite SDK
    const sdk = eventbrite({token: config.eventbrite.api.token});

    let eventbriteEndpoint = '/events/search?location.address=san diego&';
    let events = [];
    
    (async function(){
        try{

            console.log('page_number',1); 
            let page1 = await sdk.request(`${eventbriteEndpoint}page=1`);
            console.log('avail object_count',page1.pagination.object_count);
            page1.events.forEach(event=>events.push(event));;

            const page_count = page1.pagination.page_count;

            if(page_count > 1){
                for (let page = 2; page<= page_count; page++){
                    let currentPage = await sdk.request(`${eventbriteEndpoint}page=${page}`);
                    console.log('page_number',currentPage.pagination.page_number); 
                    currentPage.events.forEach(event=>events.push(event));
                    console.log('events.length',events.length);
                }
            }

            console.log('total events obtained', events.length);
    
            let eveeFormattedEvents = events.map(event=>{ 
            
                let catName = null;
                let category = eventbrite_categories.find(cat=>cat.id === event.category_id);
                
                if(category)
                    catName = category.short_name
                else
                    catName = 'eventbrite';

                let thumb = null;
                if(event.logo){
                    if(event.logo.original)
                        thumb = event.logo.original.url;
                    else 
                        thumb = 'https://i.imgur.com/yIPRLMg.jpg';
                }
                else 
                    thumb = 'https://i.imgur.com/yIPRLMg.jpg';
          
                return {
                    'event': {
                        'title' : event.name.text,
                        'category': catName,
                        'location': 'San Diego',
                        'price': event.is_free ? 0 : -1,
                        'dates': {
                            'start_date': event.start.local,
                            'end_date': event.end.local
                        },
                        'time': event.start.local,
                        'thumbnail_url': thumb,
                        'detail_url': event.url,
                        'source_url': 'https://www.eventbriteapi.com/v3/events/search',
                        'metadata': {
                            'status': 'active',
                            'quality_rating': '',
                            'original_values': '',
                        }
                    }
                } 
            });
                
            eveeFormattedEvents.forEach(eveeEvent=>{
                let event = eveeEvent.event;
                let options = { 
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
        catch(err){
            console.log(err);
        }
    })();
}

const eventbrite_categories =  [
    { resource_uri: 'https://www.eventbriteapi.com/v3/categories/103/',
       id: '103',
       name: 'Music',
       name_localized: 'Music',
       short_name: 'Music',
       short_name_localized: 'Music' },
     { resource_uri: 'https://www.eventbriteapi.com/v3/categories/101/',
       id: '101',
       name: 'Business & Professional',
       name_localized: 'Business & Professional',
       short_name: 'Business',
       short_name_localized: 'Business' },
     { resource_uri: 'https://www.eventbriteapi.com/v3/categories/110/',
       id: '110',
       name: 'Food & Drink',
       name_localized: 'Food & Drink',
       short_name: 'Food & Drink',
       short_name_localized: 'Food & Drink' },
     { resource_uri: 'https://www.eventbriteapi.com/v3/categories/113/',
       id: '113',
       name: 'Community & Culture',
       name_localized: 'Community & Culture',
       short_name: 'Community',
       short_name_localized: 'Community' },
     { resource_uri: 'https://www.eventbriteapi.com/v3/categories/105/',
       id: '105',
       name: 'Performing & Visual Arts',
       name_localized: 'Performing & Visual Arts',
       short_name: 'Arts',
       short_name_localized: 'Arts' },
     { resource_uri: 'https://www.eventbriteapi.com/v3/categories/104/',
       id: '104',
       name: 'Film, Media & Entertainment',
       name_localized: 'Film, Media & Entertainment',
       short_name: 'Film & Media',
       short_name_localized: 'Film & Media' },
     { resource_uri: 'https://www.eventbriteapi.com/v3/categories/108/',
       id: '108',
       name: 'Sports & Fitness',
       name_localized: 'Sports & Fitness',
       short_name: 'Sports & Fitness',
       short_name_localized: 'Sports & Fitness' },
     { resource_uri: 'https://www.eventbriteapi.com/v3/categories/107/',
       id: '107',
       name: 'Health & Wellness',
       name_localized: 'Health & Wellness',
       short_name: 'Health',
       short_name_localized: 'Health' },
     { resource_uri: 'https://www.eventbriteapi.com/v3/categories/102/',
       id: '102',
       name: 'Science & Technology',
       name_localized: 'Science & Technology',
       short_name: 'Science & Tech',
       short_name_localized: 'Science & Tech' },
     { resource_uri: 'https://www.eventbriteapi.com/v3/categories/109/',
       id: '109',
       name: 'Travel & Outdoor',
       name_localized: 'Travel & Outdoor',
       short_name: 'Travel & Outdoor',
       short_name_localized: 'Travel & Outdoor' },
     { resource_uri: 'https://www.eventbriteapi.com/v3/categories/111/',
       id: '111',
       name: 'Charity & Causes',
       name_localized: 'Charity & Causes',
       short_name: 'Charity & Causes',
       short_name_localized: 'Charity & Causes' },
     { resource_uri: 'https://www.eventbriteapi.com/v3/categories/114/',
       id: '114',
       name: 'Religion & Spirituality',
       name_localized: 'Religion & Spirituality',
       short_name: 'Spirituality',
       short_name_localized: 'Spirituality' },
     { resource_uri: 'https://www.eventbriteapi.com/v3/categories/115/',
       id: '115',
       name: 'Family & Education',
       name_localized: 'Family & Education',
       short_name: 'Family & Education',
       short_name_localized: 'Family & Education' },
     { resource_uri: 'https://www.eventbriteapi.com/v3/categories/116/',
       id: '116',
       name: 'Seasonal & Holiday',
       name_localized: 'Seasonal & Holiday',
       short_name: 'Holiday',
       short_name_localized: 'Holiday' },
     { resource_uri: 'https://www.eventbriteapi.com/v3/categories/112/',
       id: '112',
       name: 'Government & Politics',
       name_localized: 'Government & Politics',
       short_name: 'Government',
       short_name_localized: 'Government' },
     { resource_uri: 'https://www.eventbriteapi.com/v3/categories/106/',
       id: '106',
       name: 'Fashion & Beauty',
       name_localized: 'Fashion & Beauty',
       short_name: 'Fashion',
       short_name_localized: 'Fashion' },
     { resource_uri: 'https://www.eventbriteapi.com/v3/categories/117/',
       id: '117',
       name: 'Home & Lifestyle',
       name_localized: 'Home & Lifestyle',
       short_name: 'Home & Lifestyle',
       short_name_localized: 'Home & Lifestyle' },
     { resource_uri: 'https://www.eventbriteapi.com/v3/categories/118/',
       id: '118',
       name: 'Auto, Boat & Air',
       name_localized: 'Auto, Boat & Air',
       short_name: 'Auto, Boat & Air',
       short_name_localized: 'Auto, Boat & Air' },
     { resource_uri: 'https://www.eventbriteapi.com/v3/categories/119/',
       id: '119',
       name: 'Hobbies & Special Interest',
       name_localized: 'Hobbies & Special Interest',
       short_name: 'Hobbies',
       short_name_localized: 'Hobbies' },
     { resource_uri: 'https://www.eventbriteapi.com/v3/categories/199/',
       id: '199',
       name: 'Other',
       name_localized: 'Other',
       short_name: 'Other',
       short_name_localized: 'Other' },
     { resource_uri: 'https://www.eventbriteapi.com/v3/categories/120/',
       id: '120',
       name: 'School Activities',
       name_localized: 'School Activities',
       short_name: 'School Activities',
       short_name_localized: 'School Activities' }
];