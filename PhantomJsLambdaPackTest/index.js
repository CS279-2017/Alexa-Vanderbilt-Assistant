'use strict';
const phantomjsLambdaPack = require('phantomjs-lambda-pack');
const exec = phantomjsLambdaPack.exec;
var fs      = require('fs');
var async   = require("async");
var cheerio = require('cheerio');
var AWS = require('aws-sdk');
var path = require('path');

AWS.config.loadFromPath('./config.json');
var uploadParams = {Bucket: "vanderbilt-specials", Key: '', Body: ''};
// Create S3 service object
var s3 = new AWS.S3({apiVersion: '2006-03-01'});
exports.handler = (event, context, callback) => {
    exec('-v', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }	
 		//Is phantom running?
        console.log(`phantom version: ${stdout}`);
        console.log(`Should have no error: ${stderr}`);
        //Should start horseman with the correct path
        console.log(phantomjsLambdaPack.path);
		var htmlstring;
		var Horseman = require('node-horseman');
		var horseman = new Horseman({phantomPath: phantomjsLambdaPack.path})

		async.series([
		    function(callback){ 
			    console.log("Starting first function");
			    horseman
				  .userAgent('Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0')
				  .open('https://app.mymenumanager.net/vanderbilt/')
				  .click('.tab[mealid="2"]')
			      .wait(5000)
				  .html('#data_area',"/tmp/output.html")
				  .then(function(body) {
			        console.log("Processing of menu web page done.")
				    htmlstring = body;
				    console.log(htmlstring);
				    callback();
				  }).close();
		    },
		    function(callback){
		    	var $ = cheerio.load(htmlstring);
		    	//console.log($)
		        $('#menu_area').filter(function(){
		            var data = $(this);
		            var menu_blocks = data.children()[0];
		            var blocksArray = menu_blocks['children'];   
		            //First child 
		            //console.log(blocksArray[0]['children'][0]['children'][0]['data']);
		            //Get Chef James
		            var meal = [];
		            for(var i = 0; i < blocksArray.length; i++){
		                //console.log(blocksArray[i]['children'][0]['children'][0]['data']);
		                if(blocksArray[i]['children'][0]['children'][0]['data'] == 'Chef James Bistro'){
		                    var informationArray = blocksArray[i]['children'][1]['children'][0]['children'];
		                    for(var i = 0; i < informationArray.length; i++){
		                        var info = informationArray[i]['children'][0]['data'];
		                        meal.push(info);
		                    }    
		                }
		            }
		            console.log(meal);
		            //Write to file
		            fs.writeFile('/tmp/chef-james-special.js',
		            JSON.stringify(meal),
		            function (err) {
		                if (err) {
		                    console.error('Writing to file failed.');
		                }
		            }
		            );
		        })
		    	callback();
		},
		function(callback){
	        var file = "/tmp/chef-james-special.js"
	        var fileStream = fs.createReadStream(file);
	        fileStream.on('error', function(err) {
	          console.log('File Error', err);
	        });
	        uploadParams.Body = fileStream;
	        uploadParams.Key = path.basename(file);

	        s3.upload (uploadParams, function (err, data) {
	          if (err) {
	            console.log("Error", err);
	          } if (data) {
	            console.log("Upload Success", data.Location);
	          }
	        });
	        callback();
    	}
		], function (err, results) {
    		console.log("Menu scraped and processing finished.");
    		callback(error, 'done!');
		})
	//End of series 
    });
};