var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();

app.get('/scrape', function(req, res){

url = 'http://www.vucommodores.com/sports/w-tennis/sched/vand-w-tennis-sched.html';

json = "{}"

request(url, function(error, response, html){
    if(!error){
        var $ = cheerio.load(html);
        var eventArray = [];



      	console.log("Did the url load")
	    $('#schedtable').filter(function(){
	        var data = $(this);
	        events = data.children();



	        for(var i = 0;  i < events.length; i++ ){
	        	var game = {};
	        	var elem = events[i];
	        	//Checks it is a game
	        	if(elem['attribs']['class'] == 'event-listing'){

	        		var elemChildren = elem.children

	        		//Setting Date 
	        		game['date'] = elemChildren[1].children[0]['data']

	        		//Setting opponent
	        		if(typeof(elemChildren[3].children[2]) == "undefined"){
	        			game['opponent'] = elemChildren[3].children[0]['data']
	        		} else {
	        			game['opponent'] = elemChildren[3].children[2]['data']
	        		}
	        		//Setting Location
	        		game['location'] = elemChildren[5].children[0]['data']
	        		

	        		//Setting the time/result 
	        		if(typeof(elemChildren[7].children[0]) == "undefined"){
	        		   game['time'] = "TBA";
	        		} else {
	        		   game['time'] = elemChildren[7].children[0]['data'];
	        		}
	        		//append the game to the end of the array
	        		eventArray.push(game);
	        	}
	        }
	        console.log(eventArray);



	    })

    
}

// To write to the system we will use the built in 'fs' library.
// In this example we will pass 3 parameters to the writeFile function
// Parameter 1 :  output.json - this is what the created filename will be called
// Parameter 2 :  JSON.stringify(json, null, 4) - the data to write, here we do an extra step by calling JSON.stringify to make our JSON easier to read
// Parameter 3 :  callback function - a callback function to let us know the status of our function

fs.writeFile('./data/womens tennis.js', JSON.stringify(eventArray, null, 4), function(err){

    console.log('File successfully written! - Check your project directory for the output.json file');

})
// Finally, we'll just send out a message to the browser reminding you that this app does not have a UI.
	res.send('Check your console!')
    }) ;
})

app.listen('8081')