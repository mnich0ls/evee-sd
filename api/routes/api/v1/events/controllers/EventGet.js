let moment = require('moment')

var db = require('../../../../../database/mysql-connection');

var validations = {
    isDate_ISO8601: (val) => val.match(/^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])/g)
}

module.exports = function(values, callback){

    var filters = Object.keys(values);
    var whiteListedValues = []
    var SQL = "SELECT e.* FROM events e";
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
            whiteListedValues.push(locations.shift() + '%')
            SQL += " AND (e.location like ?"
            locations.forEach((l) => {
                whiteListedValues.push(l + '%')
                SQL += " OR e.location like ?"
            })
            SQL += ")"
        } else {
            console.log('Search by string location', locations)
            whiteListedValues.push(locations + '%')
            SQL += " AND e.location like ?"
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

    SQL += " ORDER BY e.start_date LIMIT ? OFFSET ?";
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