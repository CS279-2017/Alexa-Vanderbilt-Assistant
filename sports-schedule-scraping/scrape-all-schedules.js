var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');
var async 	= require('async');
var path = require('path');

var s3 = new AWS.S3({apiVersion: '2006-03-01'});
var uploadParams = {Bucket: "vanderbilt-sports-schedules", Key: '', Body: ''};

var teamUrlHash = {};
teamUrlHash["mens baseball"] = "http://www.vucommodores.com/sports/m-basebl/sched/vand-m-basebl-sched.html";
teamUrlHash["mens basketball"] = "http://www.vucommodores.com/sports/m-baskbl/sched/vand-m-baskbl-sched.html";
teamUrlHash["mens cross country"] = "http://www.vucommodores.com/sports/m-xc/sched/vand-m-xc-sched.html";
teamUrlHash["mens football"] = "http://www.vucommodores.com/sports/m-footbl/sched/vand-m-footbl-sched.html";
teamUrlHash["mens golf"] = "http://www.vucommodores.com/sports/m-golf/sched/vand-m-golf-sched.html";
teamUrlHash["mens tennis"] = "http://www.vucommodores.com/sports/m-tennis/sched/vand-m-tennis-sched.html";
teamUrlHash["womens basketball"] = "http://www.vucommodores.com/sports/w-baskbl/sched/vand-w-baskbl-sched.html";
teamUrlHash["womens bowling"] = "http://www.vucommodores.com/sports/w-bowl/sched/vand-w-bowl-sched.html";
teamUrlHash["womens cross country"] = "http://www.vucommodores.com/sports/w-xc/sched/vand-w-xc-sched.html";
teamUrlHash["womens golf"] = "http://www.vucommodores.com/sports/w-xc/sched/vand-w-xc-sched.html";
teamUrlHash["womens lacrosse"] = "http://www.vucommodores.com/sports/w-lacros/sched/vand-w-lacros-sched.html"
teamUrlHash["womens swimming"] = "http://www.vucommodores.com/sports/w-swim/sched/vand-w-swim-sched.html";
teamUrlHash["womens soccer"] = "http://www.vucommodores.com/sports/w-soccer/sched/vand-w-soccer-sched.html";
teamUrlHash["womens swimming"] = "http://www.vucommodores.com/sports/w-swim/sched/vand-w-swim-sched.html";
teamUrlHash["womens tennis"] = "http://www.vucommodores.com/sports/w-tennis/sched/vand-w-tennis-sched.html";
teamUrlHash["womens track"] = "http://www.vucommodores.com/sports/w-track/sched/vand-w-track-sched.html";
function doRequest(sport, sportUrl){
	request(sportUrl, function(error, response, html){
    if(!error){
        var $ = cheerio.load(html);
        var eventArray = [];
    
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
	        //Write the file
	        console.log(eventArray);
	        var sportName = './' + sport + '.js'
	        fs.writeFileSync(sportName, JSON.stringify(eventArray, null, 4));
	        //Upload it to S3
	        var fileParam = sportName;
	        uploadToS3(fileParam);

	        
	    })
	}
	})
}

function uploadToS3(file){
	var fileStream = fs.createReadStream(file);
	fileStream.on('error', function(err) {
			  console.log('File Error', err);
	});
	uploadParams.Body = fileStream;
	uploadParams.Key = path.basename(file);
	// call S3 to retrieve upload file to specified bucket

	s3.upload (uploadParams, function (err, data) {
			  if (err) {
			    console.log("Error", err);
			  } if (data) {
			    console.log("Upload Success", data.Location);
			  }
	});

}

function main(){
	for(var key in teamUrlHash) {
		doRequest(key, teamUrlHash[key]);
	}		
}

main();




