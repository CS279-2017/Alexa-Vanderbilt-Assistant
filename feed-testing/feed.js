
var request = require('request'); // for fetching the feed
var cheerio = require('cheerio');
var moment = require('moment');
var createTextVersion = require("textversionjs");
var fs = require('fs');
var path = require('path');


var AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');
var s3 = new AWS.S3({apiVersion: '2006-03-01'});
var uploadParams = {Bucket: "vanderbilt-events", Key: '', Body: ''};

const feedparser = require('feedparser-promised');
var listOfItems = [];
const url = 'https://anchorlink.vanderbilt.edu/EventRss/EventsRss';


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
var listOfCategories = [];
feedparser.parse(url).then( (items) => {

    for(var i = 0; i < items.length; i++){
      var item = items[i];
      //console.log(item.location)
      itemDescription = cheerio.load(item['description']);
      var itemJSON = {};
      var dateClass = itemDescription(".dtstart")['0']['children'][0]['attribs'];
      //Check if time is valid
      if(itemDescription(".dtstart")['0']['children'] &&  itemDescription(".dtstart")['0']['children'][2]){
          //console.log(itemDescription(".dtstart")['0']['children'][2]['attribs']['title']);
          itemJSON['time'] = itemDescription(".dtstart")['0']['children'][2]['attribs']['title'];
      }
      //Check if date is valid
      if(dateClass){
        itemJSON['date'] =  dateClass['title'];
      } 
      itemJSON['text'] = item['description']
      itemJSON['title'] = item['title'];
      itemJSON['summary'] = item['summary'];
      itemJSON['categories'] = item['categories'];

      listOfCategories.push(itemJSON['categories']);
      itemJSON['location'] = itemDescription(".location")['0']['children'][0]['data'];
      var description = createTextVersion(itemDescription(".description"))

      
      //CLEAN UP STRINGS
      description = description.replace(/&quot/g, "\"");
      description = description.replace(/&apos/g, "'");
      description = description.replace(/&amp/g, "&");
      description = description.replace(/\n/g, " ");
      description = description.replace(/\nA/g, " ");
      description = description.replace(/&#xA0/g, " ");
      itemJSON['description'] = description;
      listOfItems.push(itemJSON);

      
    }
  }).then(() => {
    //console.log(listOfItems);
    listOfCategories = listOfCategories.filter(function(n){ return n.length > 0 }); 
    //console.log(listOfCategories);

    var listOfCategoriesNoHash = [];
    for(var i = 0; i < listOfCategories.length; i++){
       for(var j = 0; j < listOfCategories[i].length; j++){
          console.log(listOfCategories[i][j]);
          listOfCategoriesNoHash.push(listOfCategories[i][j]);
       }
    }

      //Remove duplicates from the list of categories

      var unique = listOfCategoriesNoHash.filter(function(elem, index, self) {
        return index == self.indexOf(elem);
      })


      var logger = fs.createWriteStream('categories.txt', {
      flags: 'a' // 'a' means appending (old data will be preserved)
      })
      for(var i = 0; i < unique.length; i++){
            logger.write(unique[i] + '\n');
      }
      logger.end();
      console.log(unique);

    
    

    //Writes the categories with quotes
    fs.writeFile("./categories.js", JSON.stringify(unique), () => {
      uploadToS3("./categories.js")
    })

    //Vanderbilt Events    
    var name = './' + 'vanderbilt-events' + '.js'
    fs.writeFile(name, JSON.stringify(listOfItems, null, 4), () => {
      uploadToS3(name);
    });

    
});






