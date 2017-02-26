var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();

app.get('/scrape', function(req, res){

url = 'http://campusdining.vanderbilt.edu/vu-meal-plans/special-events/';

json = "{}"

request(url, function(error, response, html){
    if(!error){
        var $ = cheerio.load(html);

        var eventArray = [];


      	console.log("Did the url load")
	    $('.specialevents').filter(function(){
	        var data = $(this);
	        var events = data.children()[1].children;
	        for(var i = 0; i < events.length; i++){
	        	myEvent = {};
	        	myEvent['name'] = events[i].children[1].children[0].children[0].children[0]['data'];
	        	myEvent['date'] = events[i]['attribs']['date'];
	        	myEvent['description'] = events[i].children[1].children[1].children[0].children[0]['data'];
	        	myEvent['time'] = events[i].children[1].children[2].children[0].children[0].children[0]['data'];
	        	myEvent['location'] = events[i].children[1].children[2].children[0].children[2].children[0]['data'];
	 			//console.log(myEvent)
	        	eventArray.push(myEvent);	
	        }
	        console.log(JSON.stringify(eventArray));


	    })

    
}

// To write to the system we will use the built in 'fs' library.
// In this example we will pass 3 parameters to the writeFile function
// Parameter 1 :  output.json - this is what the created filename will be called
// Parameter 2 :  JSON.stringify(json, null, 4) - the data to write, here we do an extra step by calling JSON.stringify to make our JSON easier to read
// Parameter 3 :  callback function - a callback function to let us know the status of our function

fs.writeFile('output.json', JSON.stringify(json, null, 4), function(err){

    console.log('File successfully written! - Check your project directory for the output.json file');

})
// Finally, we'll just send out a message to the browser reminding you that this app does not have a UI.
	res.send('Check your console!')
    }) ;
})

app.listen('8081')