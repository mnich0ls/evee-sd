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
    if(values.start_date){
        if(!validations.isDate_ISO8601(values.start_date)){
            callback({
                message: 'You have invalid values provided for parameters.',
                error_code: 'INVALID_PARAM_VALUES',
                errors: '[start_date] must be in ISO-8601 date format (YYYY-MM-DD).'
            });
            return;
        }
    }

    // Check if the values from GET request contain start_date and/or category
    if(filters.includes('categories')){
        // Setup a query to filter events only by category
        whiteListedValues.push((values['categories']))
        SQL += " JOIN category_map m ON m.original_category = e.category AND m.mapped_category in (?)"
    }

    SQL += " WHERE e.status = 'active'"
    // todo - refactor the start_date param - 
    // the goal is to search for events on or after a certain date (which means we need to search the end_date event property)
    let today = moment().format('YYYY-MM-DD')
    if(filters.includes('start_date') && moment(today).isBefore(moment(values['start_date']))){
        // Setup a query to filter events only by start_date
        // only if the start date is later than today 
        whiteListedValues.push(values['start_date'])
        SQL += " AND e.end_date >= ?"
    } else {
        // default to events ending today or later
        whiteListedValues.push(today)
        SQL += " AND e.end_date >= ?"
    }

    if (filters.includes('search')) {
        whiteListedValues.push('%' + values['search'] + '%')
        SQL += " AND e.title like ?"
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