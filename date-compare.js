var moment = require('moment-timezone')

/*
var currentTime = moment.now();
//No Time zone
console.log(moment(currentTime).format());

var currentTimeWithTimezone = moment(currentTime).tz("America/Chicago");

//With TZ
console.log(moment(currentTimeWithTimezone).format());
*/

 var currentTime = moment.now();
 //Begin getting getting events
 var currentDate = moment(currentTime).tz("America/Chicago");
 var currentDateAfterRange = moment(currentTime + moment.duration("P3D"));


 var date = new Date("2/28/2017");

 var momentFromJS = moment(date);

 console.log(date);
 console.log(momentFromJS.format());
 console.log(currentDate.format());
 console.log(currentDateAfterRange.format());


 if(momentFromJS.format("MM-DD-YYYY") == currentDate.format("MM-DD-YYYY")){
 	console.log("Same Date!");
 }

