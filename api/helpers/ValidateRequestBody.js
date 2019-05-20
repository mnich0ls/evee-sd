var RegEx = {
    Currency: (value)=> value.replace(/[^\d.-]/g,'').length > 0 ? true : false,
    Date: {
        ISO_8601: (value)=> value.match(/^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])/g) ? true : false
    },
    Url: (value)=>{
        if(value !== 0){
            return value.match(/^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/g) ? true: false;
        }
    } 
}

var getYYYYMMDD = (value)=> {
    var s = value.split('-');
    return {
        YYYY: s[0],
        MM: s[1],
        DD: s[2]
    }
}

module.exports = function(payload, requiredParams, paramValidations){
    var payloadParams = Object.keys(payload);
    var missingParams = [];
    requiredParams.forEach(function(requiredParam){
        if(!payloadParams.includes(requiredParam)){
            missingParams.push(requiredParam);
        }
    });
    // All of the required parameters are present in the API request payload
    if(missingParams.length === 0){
        // Now we will check the provided parameter values meet validation requirements
        var validationErrors = [];
        for(var param in payload){
            for(var type in paramValidations[param]){
                var validationTypeValue = paramValidations[param][type];
                switch(type){
                    case 'minLength':
                        if(payload[param].length < validationTypeValue)
                            validationErrors.push(`[${param}] must be a minimum of ${validationTypeValue} characters.`);
                        break;
                    case 'maxLength':
                        if(payload[param].length > validationTypeValue)
                            validationErrors.push(`[${param}] must be a maximum of ${validationTypeValue} characters.`);
                        break;
                    case 'type':
                        if(validationTypeValue === 'Currency'){
                            var isValidCurrencyAmount = RegEx.Currency(payload[param].toString());
                            if(!isValidCurrencyAmount){
                                validationErrors.push(`[${param}] must be a number format.`);
                            }
                        }
                        else if(validationTypeValue === 'Date'){
                            var isDateFormatValid = RegEx.Date.ISO_8601(payload[param]);
                            if(!isDateFormatValid)
                                validationErrors.push(`[${param}] must be in ISO-8601 date format (YYYY-MM-DD).`);
                            // Check to make sure the end_date is not before the start_date
                            else if(param === 'end_date'){
                                var start_date = getYYYYMMDD(payload['start_date']);
                                if(payload[param] == "0"){payload[param] = payload['start_date']}
                                var end_date = getYYYYMMDD(payload[param]);
                                if(new Date(end_date.YYYY, end_date.MM, end_date.DD) < new Date(start_date.YYYY, start_date.MM, start_date.DD)){
                                    validationErrors.push(`[${param}] cannot be before start_date.`);
                                }
                            }
                        }
                        else if(validationTypeValue === 'Url'){
                            var isUrlFormatValid = RegEx.Url(payload[param]);
                            if(!isUrlFormatValid)
                                validationErrors.push(`[${param}] must be a valid url address.`);
                        }
                        break;
                    case 'allowedValues':
                        var source = payload[param].split(' ');
                        if(source.length > 1)
                            validationErrors.push(`[${param}] must contain only 1 service provider.`);
                        if(!validationTypeValue.includes(source[0].toLowerCase()))
                            validationErrors.push(`[${param}] is currently not a compatible Evee source provider.`);
                        break;
                }
            }
        }

        if(validationErrors.length === 0) 
            return [];
        return {
            message: 'You have invalid values provided for parameters.',
            error_code: 'INVALID_PARAM_VALUES',
            errors: validationErrors
        }
    }
    // Parameters are missing from the requested API resource payload
    return {
        message: 'You are missing required parameters.',
        error_code: 'MISSING_REQUIRED_PARAMS',
        errors: missingParams
    }
}