
var Horseman = require('node-horseman');
var async   = require("async");
var express = require('express');
var fs      = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var AWS = require('aws-sdk');
var path = require('path');



var phantomJS = require('phantomjs');
var htmlstring;
var htmlstring2;
var horseman = new Horseman({phantomPath: phantomJS.path})
AWS.config.loadFromPath('./config.json');
var uploadParams = {Bucket: "vanderbilt-specials", Key: '', Body: ''};
// Create S3 service object
var s3 = new AWS.S3({apiVersion: '2006-03-01'});

var chefJamesMeal = [];
var lunchPaperMeal = [];
var piAndLeafMeal = [];
var pubMeal = [];
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
            chefJamesMeal = [];
            lunchPaperMeal = [];
            piAndLeafMeal = [];
            pubMeal = [];
            for(var i = 0; i < blocksArray.length; i++){
                console.log(blocksArray[i]['children'][0]['children'][0]['data']);
                if(blocksArray[i]['children'][0]['children'][0]['data'] == 'Chef James Bistro'){
                    var informationArray = blocksArray[i]['children'][1]['children'][0]['children'];
                    for(var j = 0; j < informationArray.length; j++){
                        var info = informationArray[j]['children'][0]['data'];
                        chefJamesMeal.push(info);
                    }    
                }
                if(blocksArray[i]['children'][0]['children'][0]['data'] == 'Lunch Paper'){
                    var informationArray = blocksArray[i]['children'][1]['children'][0]['children'];
                    console.log(informationArray.length);                  
                    for(var k = 0; k < informationArray.length; k++){
                        var info = informationArray[k]['children'][0]['data'];
                        lunchPaperMeal.push(info);
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
                if(blocksArray[i]['children'][0]['children'][0]['data'] == 'The Pub'){
                   var informationArray = blocksArray[i]['children'][2]['children'][1]['children'];
                   for(var h = 0; h < informationArray.length; h++){
                       console.log(informationArray[h]['children'][0]['data'])
                       pubMeal.push(informationArray[h]['children'][0]['data'])
                   }
                }       
            }
            console.log(chefJamesMeal);
            console.log(lunchPaperMeal);
            console.log(piAndLeafMeal);
            console.log(pubMeal);
        })
    	callback();
    },
    function(callback){

        async.series([

        function(callback){
            var params = {Bucket: 'vanderbilt-specials', Key: 'chef-james-special-lunch', Body: JSON.stringify(chefJamesMeal)};
            s3.upload(params, function(err, data) {
                if (err) {
                    console.log("Error", err);
                } if (data) {
                    console.log("Upload Success", data.Location);
                }
                callback();
            });
        },
        function(callback){
            var params = {Bucket: 'vanderbilt-specials', Key: 'lunch-paper-special-lunch', Body: JSON.stringify(lunchPaperMeal)};
            s3.upload(params, function(err, data) {
                if (err) {
                    console.log("Error", err);
                } if (data) {
                    console.log("Upload Success", data.Location);
                }
                callback();
            });
        },
        function(callback){
            var params = {Bucket: 'vanderbilt-specials', Key: 'pi-and-leaf-special-lunch', Body: JSON.stringify(piAndLeafMeal)};
            s3.upload(params, function(err, data) {
                if (err) {
                    console.log("Error", err);
                } if (data) {
                    console.log("Upload Success", data.Location);
                }
                callback();
            });

        },
        function(callback){
            var params = {Bucket: 'vanderbilt-specials', Key: 'the-pub-special-lunch', Body: JSON.stringify(pubMeal)};
            s3.upload(params, function(err, data) {
                if (err) {
                    console.log("Error", err);
                } if (data) {
                    console.log("Upload Success", data.Location);
                }
                callback();
            });
        }
        ]);
        callback();
    }
], function (err, results) {
    console.log("Menu scraped and processing finished.");
});












