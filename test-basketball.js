
var fs = require('fs')
var moment = require('moment')
//var obj = JSON.parse(fs.readFileSync('basketball.js', 'utf8'));


var currenttime = moment.now();
var duration =  moment.duration("P1W");


var currentDate = moment(currenttime);
var currentDateAfterRange = moment(currenttime + duration);
var eventsWithinTheRange = [];

/*
for(var i = 0; i < obj.length; i++){
	var date = new Date(obj[i]['date'])
	if((date >= currentDate.toDate()) && (date <= currentDateAfterRange.toDate())){
		eventsWithinTheRange.push(obj[i])
	}
}
*/



function speakEvent(event){
    return "On " + event['date'] + " Vanderbilt plays " + event['opponent'] + 
    " in " + event['location'] + " at " + event['time'];
}

/*
var responseString = "";
for(var i = 0; i < eventsWithinTheRange.length; i++){
            responseString = responseString + speakEvent(eventsWithinTheRange[i]);
}
*/

//console.log(eventsWithinTheRange);
//console.log(responseString);


var jdate = new Date(moment.now());

console.log(jdate);