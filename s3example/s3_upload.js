var AWS = require('aws-sdk');
// Load credentials and set region from JSON file
AWS.config.loadFromPath('./config.json');

// Create S3 service object
s3 = new AWS.S3({apiVersion: '2006-03-01'});

// call S3 to retrieve upload file to specified bucket
var uploadParams = {Bucket: "vanderbilt-specials", Key: '', Body: ''};
var file = "test.txt"

// call S3 to retrieve upload file to specified bucket
var fs = require('fs');

var fileStream = fs.createReadStream(file);
fileStream.on('error', function(err) {
  console.log('File Error', err);
});
uploadParams.Body = fileStream;
var path = require('path');
uploadParams.Key = path.basename(file);
// call S3 to retrieve upload file to specified bucket

//Upload Test
s3.upload (uploadParams, function (err, data) {
  if (err) {
    console.log("Error", err);
  } if (data) {
    console.log("Upload Success", data.Location);
  }
});

//Download the object
s3.getObject(
        { Bucket: "vanderbilt-sports-schedules", Key: "mens baseball.js" },
          function (error, data) {
            if (error != null) {
              console.log("Failed to retrieve an object: " + error);
            } else {
              console.log("Loaded " + data.ContentLength + " bytes");
              var schedule = JSON.parse(data.Body.toString());
              console.log(schedule);
              console.log(schedule[0]);
            }
          }
        );
