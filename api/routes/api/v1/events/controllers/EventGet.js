var db = require('../../../../../database/mysql-connection');

var validations = {
    isDate_ISO8601: (val) => val.match(/^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])/g)
}

module.exports = function(values, callback){

    var filters = Object.keys(values);
    var SQL = null;
    var limit = 50;
    var offset = 0;

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
    if(filters.length === 0){
        values = []
        SQL = "SELECT * FROM events WHERE status = 'active'";
    }
    else if(filters.length === 1){
        if(filters.includes('category')){
            // Setup a query to filter events only by category
            values = [(values['category']).toLowerCase()];
            SQL = "SELECT * FROM events WHERE status = 'active' AND category = ?";
        }
        else if(filters.includes('start_date')){
            // Setup a query to filter events only by start_date
            values = [values['start_date']];
            SQL = "SELECT * FROM events WHERE status = 'active' AND start_date >= ?";
        }
    }
    else if(filters.length === 2){
        // Setup a query to filter events both by category and start_date
        values = [values['category'],values['start_date']];
        SQL = "SELECT * FROM events WHERE status = 'active' AND category = ? AND start_date >= ?";
    } 

    SQL += " limit ? offset ?";
    values.push(limit);

    if(!filters.page) {
        filters.page = 1;
    }
    values.push(((filter.page - 1) * limit));

    db.query(SQL, values, (err,results)=>{
        callback({
            response: results
        });
    });

}