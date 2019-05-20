# Web Scraper for sandiego.org 

Deploys a tiny Express app that listens for **GET** request on **/scrape/events**. The service will perform a request to sandiego.org and pull all of the available events. After the events are obtained it will send them to Firebase for database storage.

### Installation
***
1. Modify **config.json** and set the `scraper.username` and `scraper.password`. These parameters are used for the authentication using **Basic Auth**. The scraper requires that you pass them when calling the endpoint for the request to process and begin scrape.

2. Modify **config.json** and set the `db.firebase.databaseURL` and `db.firebase.authSecret`. These parameters are required for the scraper to store the latest scraped events on the Firebase database.
 
3. Deploy this application to a public server such as Heroku, Digital Ocean, etc.

4. Final step is to schedule when to trigger the scraper. Go to: http://cron-job.org and setup the days/times pointing to the public url for this hosted appication.  

### Example screenshot of cron.job.org configuration
***
- Set the correct url for this deployed service endpoint.
- Enter the correct username/password for the HTTP authentication. These settings are configured in step 1 above via `scraper.username` and `scraper.password`

![scheduling screenshot](https://i.imgur.com/DUGhzhr.png
 "Screenshot scheduling example")