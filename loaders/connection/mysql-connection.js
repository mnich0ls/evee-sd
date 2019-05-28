var mysql = require('mysql');
var config = require('./aws-rds.config.json');
var pool = mysql.createPool(config);

module.exports = {
    query: function(SQL,values,cb){
        pool.getConnection(function (err, connection) {
            connection.query(SQL, values, function (error, results, fields) {
                connection.release();
                cb(error,results,fields);
            });
        });
    }
}