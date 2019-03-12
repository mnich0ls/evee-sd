const express = require('express')
const app = express()
const port = process.env.PORT || 3000;

const axios = require('axios')

const config = require('./config.json');

// Load add-ons
const addons = {
    EventDatesFormatter: require('./addons/EventDatesFormatter')
}

// Authentication [Basic Auth] middleware

app.use((req, res, next) => {

    const auth = {login: config.scraper.username, password: config.scraper.password}
    // parse login and password from headers
    const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')

    // Verify login and password are set and correct
    if (!login || !password || login !== auth.login || password !== auth.password) {
        res.set('WWW-Authenticate', 'Basic realm="401"')
        res.status(401).send('Authentication failure.')
        return
    }
    // Access granted...
    next()
})

// Scrape events GET endpoint

app.get('/scrape/events', (req, res) => {
    axios.get('https://www.sandiego.org/handler/getfilterdata',{
        params: {
            s: 10000,
            t: 'e'
        }
    }).then(response=>{
        addons.EventDatesFormatter(response.data.results, resultsDateFormatted =>{
            axios.put(
                `${config.db.firebase.databaseURL}/scraped_events.json?auth=${config.db.firebase.authSecret}`, 
                JSON.stringify(resultsDateFormatted)
            ).then(()=>{
                res.json(200);
            });
        });
    }).catch(err=>{
        res.status(500).json({ error: err})
    });
});

app.listen(port, () => console.log(`[sandiego.org] scraper app listening on port ${port}!`));