
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

var AlexaSkill = require('./AlexaSkill'),
    restaurants = require('./restaurants');

var data = require('./data')

var APP_ID = 'amzn1.ask.skill.f10cb500-8fd5-4fbb-9e19-cee9b1427b51'; //OPTIONAL: replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

/**
 * Vanderbilt is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */

 
//





var HowTo = function () {
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

        var dateSlot = intent.slots.Date;
        var dateName = dateSlot.value.toLowerCase();

        var currentDate = new Date(dateName);
        var currentDay = currentDate.getDay();        
        var hoursForRestaurant = data[restaurantName][currentDay.toString()];


        var cardTitle = "Hours for " + restaurantName,
            restaurant = restaurantName,
            speechOutput,
            repromptOutput;
        if (restaurant) {
            speechOutput = {
                speech: hoursForRestaurant,
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