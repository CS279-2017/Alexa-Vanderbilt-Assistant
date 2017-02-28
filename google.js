var Horseman = require('node-horseman');
var async = require("async");
var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();


var htmlstring;
var horseman = new Horseman();
async.series([
    function(callback){ 
    console.log("Starting  first function");
    horseman
	  .userAgent('Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0')
	  .open('https://app.mymenumanager.net/vanderbilt/')
	  .evaluate( function(){
	  	  $('.tab[mealid="1"]').removeClass('selected');     
	      $('.tab[mealid="2"]').addClass('selected');      
	    })
	  .html('.menu_blocks', 'output.html')
	  .then(function(body) {
	    htmlstring = body;
	    callback();
	  })
    },
    function(callback){ 
    	console.log("done:");
    	//console.log(htmlstring);
    	callback();
    },
    function(callback){
    	var $ = cheerio.load(htmlstring);
    	console.log($)
    	callback();
    }
]);












