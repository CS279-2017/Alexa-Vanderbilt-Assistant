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
var chefJamesMeal = [];
var piAndLeafMeal = [];
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
			  .click('.tab[mealid="3"]')
		      .wait(5000)
			  .html('#data_area',"/tmp/output.html")
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
		            chefJamesMeal = [];
		            for(var i = 0; i < blocksArray.length; i++){
		                console.log(blocksArray[i]['children'][0]['children'][0]['data']);
		                if(blocksArray[i]['children'][0]['children'][0]['data'] == 'Chef James Bistro'){
		                   $ = cheerio.load(blocksArray[i])
		                   //console.log($);
		                   var listelements = $('li');
		                   for(var p = 0; p < listelements.length; p++){
		                       //console.log(listelements[p]);
		                       var children = listelements[p]['children'];
		                       for(var k = 0; k < children.length; k++){
		                           console.log(children[k]);
		                           if(children[k]['data']){
		                              chefJamesMeal.push(children[k]['data']);
		                           }
		                       }
		                   }
		                } 


		                if(blocksArray[i]['children'][0]['children'][0]['data'] == 'Pi & Leaf'){
		                    var informationArray = blocksArray[i];

		                    if(informationArray['children'][1]['next']['children']){
		                        //Mushroom
		                        console.log(informationArray['children'][1]['next']['children'][3]['children'][0]['data']);    
		                        var special1 = informationArray['children'][1]['next']['children'][3]['children'][0]['data'];
		                        //Buffalo
		                        console.log(informationArray['children'][1]['next']['children'][5]['children'][0]['data']); 
		                        var special2 = informationArray['children'][1]['next']['children'][5]['children'][0]['data']     
		                        piAndLeafMeal.push(special1);
		                        piAndLeafMeal.push(special2);  
		                    }     
		                }       
		            }
		            console.log(piAndLeafMeal);
		            console.log(chefJamesMeal);
		        })
		    	callback();
		    },
		    function(callback){
		            var params = {Bucket: 'vanderbilt-specials', Key: 'chef-james-special-dinner', Body: JSON.stringify(chefJamesMeal)};
		            s3.upload(params, function(err, data) {
		                if (err) {
		                    console.log("Error", err);
		                } if (data) {
		                    console.log("Upload Success", data.Location);
		                    callback();
		                }
		            });
		    },
		    function(callback){
		    		var params = {Bucket: 'vanderbilt-specials', Key: 'pi-and-leaf-special-dinner', Body: JSON.stringify(piAndLeafMeal)};
		            s3.upload(params, function(err, data) {
		                if (err) {
		                    console.log("Error", err);
		                } if (data) {
		                    console.log("Upload Success", data.Location);
		                    callback();
		                }
		            });

		    }
		], function (err, results) {
		    console.log("Menu scraped and processing finished.");
		    })
		});
};