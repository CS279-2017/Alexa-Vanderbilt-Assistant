
var request = require('request'); // for fetching the feed
var fs = require('fs');
var path = require('path');


var AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');
var s3 = new AWS.S3({apiVersion: '2006-03-01'});
var uploadParams = {Bucket: "vanderbilt-news", Key: '', Body: ''};

const feedparser = require('feedparser-promised');
var listOfItems = [];
const url = 'http://feeds.feedburner.com/vanderbilt-news';


function uploadToS3(file){
  var fileStream = fs.createReadStream(file);
  fileStream.on('error', function(err) {
        console.log('File Error', err);
  });
  uploadParams.Body = fileStream;
  uploadParams.Key = path.basename(file);
  // call S3 to retrieve upload file to specified bucket
  console.log("In uploadToS3")
  s3.upload (uploadParams, function (err, data) {
        if (err) {
          console.log("Error", err);
        } if (data) {
          console.log("Upload Success", data.Location);
        }
  });
}

var listOfArticles = [];
feedparser.parse(url).then( (items) => {

    for(var i = 0; i < items.length; i++){
      var item = items[i];
      console.log(item.title);
      console.log(item.summary);
      console.log(item.date);
      var itemJSON = {};
      itemJSON["title"] = item.title;
      itemJSON["summary"] = item.summary;
      itemJSON["date"] = item.date;
      listOfArticles.push(itemJSON);
    }
  }).then(() => {
    //Vanderbilt Events    
    var name = './' + 'vanderbilt-news' + '.js'
    fs.writeFile(name, JSON.stringify(listOfArticles, null, 4), () => {
      uploadToS3(name);
    });    
});






