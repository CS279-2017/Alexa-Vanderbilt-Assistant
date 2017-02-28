var http = require('http');
var request = require("request");

console.log("Test")

function testRequest() {
		var location = "2"
		var date = "2/20/2017"
		var meal = "2"
		$.ajax({
			type: "post",
			url: 'https://app.mymenumanager.net/vanderbilt/ajax/get.ajax.php',
			data: {
				location: location,
				date: date,
				meal: meal
			},
			
			success: function(response) {
				console.log(response);
			},
			error: function() {
				console.log('An error occurred. Please try again later.');
			}
		});
}

testRequest();


//https://campusdining.vanderbilt.edu/vu-meal-plans/special-events/

//$(".specialevents").children()[1]
