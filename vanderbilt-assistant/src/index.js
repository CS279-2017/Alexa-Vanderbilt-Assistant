
/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.
    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
        http://aws.amazon.com/apache2.0/
    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * This sample shows how to create a Lambda function for handling Alexa Skill requests that:
 *
 * - Custom slot type: demonstrates using custom slot types to handle a finite set of known values
 *
 * Examples:
 * One-shot model:
 *  User: "Alexa, ask Vanderbilt what the hours for rand are?""
 *  Alexa: "(reads what the hours for rand are"
 */

'use strict';

var AlexaSkill = require('./AlexaSkill');
var fs = require('fs');
//Configure AWS 
var AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');
// Create S3 service object
var s3 = new AWS.S3({apiVersion: '2006-03-01'});
var moment = require('moment-timezone')
var data = require('./data/restaurants')
var async = require('async')
var APP_ID = 'amzn1.ask.skill.f10cb500-8fd5-4fbb-9e19-cee9b1427b51'; //OPTIONAL: replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

/**
 * Vanderbilt is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */

 
//





function speakEvent(event){
    return "On " + event['date'] + " Vanderbilt plays " + event['opponent'] + 
    " in " + event['location'] + " at " + event['time'] + ".";
}

function speakResult(event){
    return "On " + event['date'] + " Vanderbilt played " + event['opponent'] + 
    " in " + event['location'] + " and " + event['time'] + ".";
}

function giveResponse(eventsWithinTheRange,speak){
    var responseString = "";
    for(var j = 0; j < eventsWithinTheRange.length; j++){
            responseString = responseString + speak(eventsWithinTheRange[j]) + " ";
    }
    return responseString;
}

function foodResponse(special){
    var responseString = "The food today is: ";
    for(var i = 0; i < special.length; i++){
        if(special[i] == "Entrees:" || special[i] == "Sides:"){
            continue;
        }
        responseString = responseString + special[i]+ " , ";
    }
    responseString = responseString + ".";
    return responseString.replace(/&/g, "and");
}

function checkCategory(event, categoryGiven){
    var categories = event["categories"];

    if(categories.length == 0  || categoryGiven == "none"){
        return false;
    } else{
        for(var i = 0; i < categories.length; i++){
            if(categories[i].toUpperCase() == categoryGiven.toUpperCase()){
                return true;
            }
        }
    }
}

function speakStudentEvent(event){
    if(!event){
        return "";
    }
    var responseString = event["title"] + " is on " + event["date"] + " at " + event["time"] + 
    " at the location " + event["location"];
    //Remove ampersands because SSML can't parse it 
    return responseString.replace(/&/g, "and")
}

function speakArticle(article){
    var articleDate = moment(article["date"]).format("dddd, MMMM Do YYYY, h:mm:ss a");
    var responseString = article["title"] + " published at " + articleDate;
    return responseString.replace(/&/g, "and")
}
 

var HowTo = function() {
    AlexaSkill.call(this, APP_ID);
};


// Extend AlexaSkill
HowTo.prototype = Object.create(AlexaSkill.prototype);
HowTo.prototype.constructor = HowTo;

HowTo.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    var speechText = "Welcome to the How To Helper. You can ask a question like, what's the hours are for rand ... Now, what can I help you with.";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "For instructions on what you can say, please say help me.";
    response.ask(speechText, repromptText);
};

HowTo.prototype.intentHandlers = {
    "GetHoursIntent": function (intent, session, response) {
        var restaurantSlot = intent.slots.Restaurant,
            restaurantName;
        if (restaurantSlot && restaurantSlot.value){
            restaurantName = restaurantSlot.value.toLowerCase();
        }

        var dateName;
        if(!intent.slots.Date.value){
            dateName = new Date();
        } else {
            dateName = intent.slots.Date.value;
            dateName = dateName.toLowerCase();
        }

        var currentDate = new Date(dateName);       
        var hoursForRestaurant = data[restaurantName][currentDate.getDay().toString()];


        var cardTitle = "Hours for " + restaurantName,
            restaurant = restaurantName,
            speechOutput,
            repromptOutput;
        if (restaurant) {
            speechOutput = {
                speech: restaurantName + " is open from " + hoursForRestaurant,
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
            response.tellWithCard(speechOutput, cardTitle, restaurant);
        } else {
            var speech;
            if (restaurantName) {
                speech = "I'm sorry, I currently do not know the hours for " + restaurant + ". What else can I help with?";
            } else {
                speech = "I'm sorry, I currently do not know that restaurant. What else can I help with?";
            }
            speechOutput = {
                speech: speech,
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
            repromptOutput = {
                speech: "What else can I help with?",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
            response.ask(speechOutput, repromptOutput);
        }
    },

    "GetTimesOfGamesIntent": function (intent, session, response){
        //Handles getting the file
        var schedule;
        async.series([ 

        function(callback){
        var sportSlot = intent.slots.Sport;
        var sportValue = sportSlot.value;
        //Removes punctuation and set to lowercase
        sportValue = sportValue.replace(/'/,'');
        sportValue = sportValue.toLowerCase();
        
        //Need to download file from S3
        var awsFilename = '' + sportValue + '.js';

        s3.getObject(
        { Bucket: "vanderbilt-sports-schedules", Key: awsFilename },
          function (error, data) {
            if (error != null) {
              console.log("Failed to retrieve an object: " + error);
            } else {
              console.log("Loaded " + data.ContentLength + " bytes");
              schedule = JSON.parse(data.Body.toString());
              callback();
            }
          }
        );
        },

        function(callback){   
        //Get next game
        console.log("Processing the schedule.")
        if(!intent.slots.Duration.value){
            var currentDate = moment.now();
            for(var i = 0; i < schedule.length; i++){
                var date = new Date(schedule[i].date);
                if(schedule[i]['time'].includes("CT")  || 
                   schedule[i]['time'].includes("All") ||
                   schedule[i]['time'].includes("TBA")){
                    response.tell(speakEvent(schedule[i]))
                    return;
                }
            }
        }

        //Using durations        
        var durationSlot = intent.slots.Duration;
        var durationValue = durationSlot.value;
        var currentTime = moment.now();
        //Begin getting getting events
        var currentDate = moment(currentTime).tz("America/Chicago");
        var currentDateAfterRange = moment(currentDate + moment.duration(durationValue));
        var eventsWithinTheRange = [];

        for(var i = 0; i < schedule.length; i++){
            var date = moment(new Date(schedule[i].date));
            var isFutureEvent = schedule[i]['time'].includes("CT")  || 
                                schedule[i]['time'].includes("All") || 
                                schedule[i]['time'].includes("TBA");
            var inRange = (date  > currentDate && date < currentDateAfterRange) ||
               (date.format("MM-DD-YYYY") == currentDate.format("MM-DD-YYYY"))  ||
               (date.format("MM-DD-YYYY") == currentDateAfterRange.format("MM-DD-YYYY"));

            if(inRange && isFutureEvent) {
                eventsWithinTheRange.push(schedule[i]);
            }
        }

        response.tell(giveResponse(eventsWithinTheRange,speakEvent));
        callback();
        }
        ]);        
    },
    "GetResultsOfGamesIntent": function (intent, session, response){
        //Handles getting the file

        var schedule;
        async.series([

        function(callback){
        var sportSlot = intent.slots.Sport;
        var sportValue = sportSlot.value;
        //Removes punctuation 
        sportValue = sportValue.replace(/'/,'');
        sportValue = sportValue.toLowerCase();
        
        var awsFilename = '' + sportValue + '.js';
        s3.getObject(
        { Bucket: "vanderbilt-sports-schedules", Key: awsFilename },
          function (error, data) {
            if (error != null) {
              console.log("Failed to retrieve an object: " + error);
            } else {
              console.log("Loaded " + data.ContentLength + " bytes");
              schedule = JSON.parse(data.Body.toString());
              callback();
            }
          }
        );
        },

        function(callback){
        //Get last result 
        if(!intent.slots.Duration.value){
            var currentDate = moment.now();
            for(var i = schedule.length-1; i >= 0; i--){
                if(schedule[i]['time'].includes("L,") ||
                   schedule[i]['time'].includes("W,") ||
                   schedule[i]['time'].includes("T,") || 
                   schedule[i]['time'].includes("st") ||
                   schedule[i]['time'].includes("th")){
                    response.tell(speakResult(schedule[i]))
                    return;
                }
            }
        }
        //Using durations
        var durationSlot = intent.slots.Duration;
        var durationValue = durationSlot.value;
        var currentTime = moment.now();
        //Begin getting getting events
        var currentDate = moment(currentTime).tz("America/Chicago");
        var currentDateBeforeRange = moment(currentDate - moment.duration(durationValue));
        var eventsWithinTheRange = [];

        for(var i = 0; i < schedule.length; i++){
            var date = moment(new Date(schedule[i].date));
            var isPastResult = schedule[i]['time'].includes("L")  ||
                               schedule[i]['time'].includes("W")  ||
                               schedule[i]['time'].includes("T,") || 
                               schedule[i]['time'].includes("st") ||
                               schedule[i]['time'].includes("th");
            var inRange = (currentDate > date && currentDateBeforeRange < date)   ||
                 (date.format("MM-DD-YYYY") == currentDate.format("MM-DD-YYYY"))  ||
                 (date.format("MM-DD-YYYY") == currentDateBeforeRange.format("MM-DD-YYYY"));
            if(inRange && isPastResult){
                eventsWithinTheRange.push(schedule[i]);
            }
        }
        response.tell(giveResponse(eventsWithinTheRange,speakResult));
        callback();
        }
        ])
        
    },

    "GetFoodSpecialsIntent": function (intent, session, response){
        //Default value
        var awsKey = '' + "chef-james-special-lunch" + '';
        console.log(intent.slots);
        //Restaurant
        var restaurantName = "";
        var restaurantSlot = intent.slots.Restaurant;
        if(restaurantSlot.value){
          restaurantName = restaurantSlot.value;
          restaurantName = restaurantName.toLowerCase();
          restaurantName = restaurantName.replace(/\s+/g, '-');
        } else {
          //Check for error case(no restaurant given)
          response.tell("Invalid Response. Please provide a restaurant.");
        }

        //Meal Type
        var mealType = "";
        var mealTypeSlot = intent.slots.Meal;
        if(mealTypeSlot.value){
          mealType = mealTypeSlot.value;
          mealType = mealType.toLowerCase();
          mealType = mealType.replace(/\s+/g, '-');
        } else {
          //If no meal is provided then default to lunch 
          mealType = "lunch";
        }
        //Change the request into the correct format
        console.log("Restaurant Name: " + restaurantName);
        console.log("Meal Type: " + mealType);

        awsKey = restaurantName + "-special-" + mealType;
        console.log(awsKey);
        var special;
        s3.getObject(
        { Bucket: "vanderbilt-specials", Key: awsKey },
          function (error, data) {
            if (error != null) {
              console.log("Failed to retrieve an object: " + error);
            } else {
              console.log("Loaded " + data.ContentLength + " bytes");
              special = JSON.parse(data.Body.toString());
              var responseString = foodResponse(special);
              response.tell(responseString);  
            }
          }
        );
     },

     "GetEventsIntent" : function(intent, session, response){
        var vanderbiltEventsArray;
        async.series([
        function(callback){
            var awsFilename = '' + "vanderbilt-events" + '.js';
            s3.getObject(
            { Bucket: "vanderbilt-events", Key: awsFilename },
              function (error, data) {
                if (error != null) {
                  console.log("Failed to retrieve an object: " + error);
                } else {
                  console.log("Loaded " + data.ContentLength + " bytes");
                  vanderbiltEventsArray = JSON.parse(data.Body.toString());
                  callback();
                }
              }
            );
        },

        function(callback){
            //Get Duration
            var durationSlot = intent.slots.Duration;
            var durationValue = durationSlot.value;
            //get category  
            var categorySlot = intent.slots.Category;
            var categoryValue = "none";
            if(categorySlot.value){
                categoryValue =  "" + String(categorySlot.value);
            }
            console.log(categoryValue);
            var currentTime = moment.now();
            //Begin getting getting events
            var currentDate = moment(currentTime).tz("America/Chicago");
            var currentDateAfterRange = moment(currentDate + moment.duration(durationValue));
            var eventsWithinTheRange = [];
            //Loop through the event 
            for(var i = 0; i < vanderbiltEventsArray.length; i++){
                //Check if the event has a date property
                if(vanderbiltEventsArray[i]['date']){
                    var date = moment(new Date(vanderbiltEventsArray[i]['date']));
                    //If within the range of the dates, then add the events to array
                    var inRange = (date  > currentDate && date < currentDateAfterRange) ||
                                  (date.format("YYYY-MM-DD") == currentDate.format("YYYY-MM-DD"))  ||
                                  (date.format("YYYY-MM-DD") == currentDateAfterRange.format("YYYY-MM-DD"));

                    var isCategoryValid = checkCategory(vanderbiltEventsArray[i],categoryValue);
                    //If there is no category value and it is in range, push it on
                    if(categoryValue == "none" && inRange){
                        eventsWithinTheRange.push(vanderbiltEventsArray[i]);
                    }
                    //If there is a category value, then it has to be the same as one 
                    // of the categories in the set, and be in range 
                    if(!(categoryValue == "none") && isCategoryValid && inRange){
                        eventsWithinTheRange.push(vanderbiltEventsArray[i]);
                    }
                }
            }
            console.log(eventsWithinTheRange.length);
            console.log(eventsWithinTheRange);
            var responseString = "";
            for(var p = 0; p < eventsWithinTheRange.length; p++){
                responseString = responseString + speakStudentEvent(eventsWithinTheRange[p]) + " . ";
            }
            response.tell(responseString);
            callback();
        }
        ])
     },

     "GetArticlesIntent" : function(intent, session, response){
        var vanderbiltArticlesArray;
        var numberOfArticles = 1;  
        if(intent.slots.Number.value){
            console.log("There was a number given.");
            numberOfArticles = Number.parseInt(intent.slots.Number.value)
        }
        async.series([
        function(callback){
            var awsFilename = '' + "vanderbilt-news" + '.js';
            s3.getObject(
            { Bucket: "vanderbilt-news", Key: awsFilename },
              function (error, data) {
                if (error != null) {
                  console.log("Failed to retrieve an object: " + error);
                } else {
                  console.log("Loaded " + data.ContentLength + " bytes");
                  vanderbiltArticlesArray = JSON.parse(data.Body.toString());
                  callback();
                }
              }
            );
        },
        function(callback){
            var responseString = "";
            //Default is one article
            for(var i = 0; i < numberOfArticles; i++){
                responseString =  responseString + speakArticle(vanderbiltArticlesArray[i]) + " . ";
            }

            response.tell(responseString);
        }
        ])
     },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        var speechText = "You can ask what are the hours of rand or, you can say exit... Now, what can I help you with?";
        var repromptText = "You can ask what are the hours of rand or, you can say exit... Now, what can I help you with?";
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        var repromptOutput = { 
            speech: repromptText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.ask(speechOutput, repromptOutput);
    }
};

exports.handler = function (event, context) {
    var howTo = new HowTo();
    howTo.execute(event, context);
};
