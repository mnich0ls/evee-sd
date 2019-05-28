var db = require('../../../../../database/mysql-connection');

var validations = {
    isDate_ISO8601: (val) => val.match(/^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])/g)
}

module.exports = function(values, callback){

    var filters = Object.keys(values);
    var whiteListedValues = []
    var SQL = "SELECT * FROM events WHERE status = 'active'";
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
    if(filters.includes('category')){
        // Setup a query to filter events only by category
        whiteListedValues.push((values['category']).toLowerCase());
        SQL += " AND category = ?";
    }
    if(filters.includes('start_date')){
        // Setup a query to filter events only by start_date
        whiteListedValues.push(values['start_date']);
        SQL = " AND start_date >= ?";
    }

    SQL += " ORDER BY start_date LIMIT ? OFFSET ?";
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