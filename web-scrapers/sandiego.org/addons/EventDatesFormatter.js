/**
 * 
 *  [Filename] 
 * 
 *  /web-scrapers/sandiego.org/addons/EventDatesFormatter.js
 *  
 *  [Description]
 *  
 *  Small addon module plugin that ../app.js calls after obtaining event data results
 *  from sandiego.org. This module updates each returned event and formats dates for 
 *  ISO 8601 (YYYY-MM-DDDD) standard. 
 * 
 *  The module makes the following changes to each object in the input array:
 * 
 *      event.original_date [Added] - (Contains the original data from event.dates)
 *      event.dates [Modified] - (Contains the start date of event in ISO 8601)
 *      event.end_date [Added] - (Contains the end date of event in ISO 8601)
 * 
 */

var moment = require('moment');

module.exports = (scrapedData, callback)=>{
    
    var currentDate = moment().format('YYYY-MM-DD');
    var scrapedDataDateFormatted = scrapedData.map(event=>{
    
        event.original_date = event.dates;
        
        let datesSplitString = event.dates.split('-')
            
        // If we can split the date range then we will perform additional logic

        if(datesSplitString.length > 1){ 

            let datesSplitStringEndDate = datesSplitString[datesSplitString.length-1].trim();
            let datesSplitStringStartDate = datesSplitString[0].trim();
    
            /*  
                If date range format then the first date needs year added 
                to make ISO 8601 date formatting easier Check if the start date contains YYYY
            */

            if(!datesSplitStringStartDate.match(',')){
                
                let YYYY = null;

                if(datesSplitStringEndDate === 'ongoing'){
                    YYYY = moment().year();
                } else{
                    YYYY = moment(datesSplitStringEndDate, 'MMM DD, YYYY').format('YYYY');
                    datesSplitStringStartDate += `, ${YYYY}`;  
                }

            }

            let formattedStartDate = moment(datesSplitStringStartDate,'MMM DD, YYYY').format('YYYY-MM-DD');
            
            /*
                Check if the start date is after current date of this scraper execution process
                If this is true then set the date property of object to the ISO formatted start date.
                If false then we will set the property to todays date.
            */

            if(moment(formattedStartDate).isAfter(currentDate)){
                event.dates = formattedStartDate;
            } else {
                event.dates = currentDate;
            }
                                  
            if(datesSplitStringEndDate !== 'ongoing'){
                event.end_date = moment(datesSplitStringEndDate, 'MMM DD, YYYY').format('YYYY-MM-DD');
            } else {
                event.end_date = datesSplitStringEndDate;
            }
            
        } else {
            event.dates = moment(event.dates, 'MMM DD, YYYY').format('YYYY-MM-DD');
            event.end_date = '';        
        }

        return event;

    });

    callback(scrapedDataDateFormatted);
}