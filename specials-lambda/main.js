
var Horseman = require('node-horseman');
var async   = require("async");
var express = require('express');
var fs      = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var AWS = require('aws-sdk');
var path = require('path');



var phantomJS= require('phantomjs');
var htmlstring;
var horseman = new Horseman({phantomPath: phantomJS.path})
AWS.config.loadFromPath('./config.json');
var uploadParams = {Bucket: "vanderbilt-specials", Key: '', Body: ''};
// Create S3 service object
var s3 = new AWS.S3({apiVersion: '2006-03-01'});
async.series([
    function(callback){ 
    console.log("Starting first function");
    horseman
	  .userAgent('Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0')
	  .open('https://app.mymenumanager.net/vanderbilt/')
	  .click('.tab[mealid="2"]')
      .wait(5000)
	  .html('#data_area',"output.html")
	  .then(function(body) {
        console.log("Processing of menu web page done.")
	    htmlstring = body;
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
            fs.writeFile('./chef-james-special.js',
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
        var file = "chef-james-special.js"
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
});












