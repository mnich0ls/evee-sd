let moment = require('moment')

var db = require('../../../../../database/mysql-connection');

var validations = {
    isDate_ISO8601: (val) => val.match(/^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])/g)
}

module.exports = function(values, callback){

    var filters = Object.keys(values);
    var whiteListedValues = []
    var SQL = "SELECT e.*, ifnull(z.location_name, e.location) as location, s.rank FROM events e";
    SQL += " LEFT JOIN zip_codes z on z.zip = e.zip_code"
    SQL += " LEFT JOIN event_sources s on s.url = e.source"
    var limit = 50;

    // Perform a start_date ISO8601 (YYYY-MM-DD) validation
    if(values.date){
        if(!validations.isDate_ISO8601(values.date)){
            callback({
                message: 'You have invalid values provided for parameters.',
                error_code: 'INVALID_PARAM_VALUES',
                errors: '[start_date] must be in ISO-8601 date format (YYYY-MM-DD).'
            });
            return;
        }
    }

    // start with any join queries 
    // we have a lookup table to map categories to our own categories 


    // Check if the values from GET request contain start_date and/or category
    if(filters.includes('categories')){
        // Setup a query to filter events only by category
        whiteListedValues.push((values['categories']))
        SQL += " JOIN category_map m ON m.original_category = e.category AND m.mapped_category in (?)"
    }
    SQL += " WHERE e.status = 'active'"

    if (filters.includes('search')) {
        whiteListedValues.push('%' + values['search'] + '%')
        SQL += " AND e.title like ?"
    }

    if (filters.includes('price')) {
        let price = values['price'];
        if (price === 'free') {
            SQL += " AND e.price = 0"
        } else if (price === 'paid') {
            // a price less than 0 means the price can vary 
            SQL += " AND e.price != 0"
        }
    }

    if (filters.includes('locations')) {
        let locations = values['locations']
        if (Array.isArray(locations)) {
            console.log('Search by array location', locations)
            let firstLocation = locations.shift()
            whiteListedValues.push(firstLocation)
            let EVENT_LOCATION_SQL = " (e.location = ?"
            locations.forEach((l) => {
                EVENT_LOCATION_SQL += " OR e.location = ?"
                whiteListedValues.push(l)
            })
            EVENT_LOCATION_SQL += ")"
            let ZIP_CODE_LOCATION_SQL = "(z.location_name = ?"
            whiteListedValues.push(firstLocation)
            locations.forEach((l) => {
                ZIP_CODE_LOCATION_SQL += " OR z.location_name = ?"
                whiteListedValues.push(l)
            })
            ZIP_CODE_LOCATION_SQL += ")"
            SQL += " AND (" + EVENT_LOCATION_SQL + " OR " + ZIP_CODE_LOCATION_SQL + ")" 
        } else {
            console.log('Search by string location', locations)
            whiteListedValues.push(locations)
            whiteListedValues.push(locations)
            SQL += " AND (e.location = ? OR z.location_name = ?)"
        }
    }

    let today = moment().format('YYYY-MM-DD')
    if(filters.includes('date') && moment(today).isBefore(moment(values['date']))){
        whiteListedValues.push(values['date'])
        SQL += " AND e.end_date >= ?"
    } else {
        // default to events ending today or later
        whiteListedValues.push(today)
        SQL += " AND e.end_date >= ?"
    }

    SQL += " AND datediff(end_date, start_date) <= 7"
    SQL += " ORDER BY date(e.start_date), s.rank LIMIT ? OFFSET ?";
    whiteListedValues.push(limit);

    if(!filters.includes('page')) {
        values['page'] = 1;
    }
    whiteListedValues.push(((values['page'] - 1) * limit));

    db.query(SQL, whiteListedValues, (err,results)=>{
        callback({
            response: results
        });
    });

}