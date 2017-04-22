
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
async.series([
    function(callback){ 
    console.log("Starting first function");
    horseman
	  .userAgent('Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0')
	  .open('https://app.mymenumanager.net/vanderbilt/')
	  .click('.tab[mealid="3"]')
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
            for(var i = 0; i < blocksArray.length; i++){
                console.log(blocksArray[i]['children'][0]['children'][0]['data']);
                if(blocksArray[i]['children'][0]['children'][0]['data'] == 'Chef James Bistro'){
                   $ = cheerio.load(blocksArray[i])
                   var listelements = $('li');
                   for(var p = 0; p < listelements.length; p++){
                       var children = listelements[p]['children'];
                       for(var k = 0; k < children.length; k++){
                           if(children[k]['data']){
                              chefJamesMeal.push(children[k]['data']);
                           }            
                       }
                   }
                }       
            }
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
                }
                callback();
            });
    }
], function (err, results) {
    console.log("Menu scraped and processing finished.");
});












