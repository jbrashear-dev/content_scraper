// set requirements

const cheerio = require('cheerio');
const fs = require('fs');
const json2csv = require('json2csv');
const Json2csvParser = require('json2csv').Parser;
const moment = require('moment');
const request = require('request');
const path = require('path');

// set variables

const urlBase = 'http://shirts4mike.com/shirts.php';
const shirtHref =[];
const fields = [{ label: 'Title',
                  value: 'title'
              },{ label: 'Price',
                  value: 'price'
              },{ label: 'Image URL',
                  value: 'imageURL'
              },{ label:'URL',
                  value: 'URL'
              },{ label: 'Time',
                  value: 'time'}];

const json2csvParser = new Json2csvParser({ fields });
let shirt = {};
let shirtArray = [];
let time = moment().format('YYYY[-]MM[-]DD');
let dir = './data';

//friendly error message
let alarm = (error) => {
  console.log('There has been an error it is ' + error.message + ' Please try your request later.');
}
//set up directory and file structure

if (!fs.existsSync(dir)){
  fs.mkdirSync(dir);
}

fs.readdir(dir, (error, files) => {
  if (error) {
    alarm(error)
  }
  for (const file of files) {
    fs.unlink(path.join(dir, file), error =>{
      if (error) {alarm(error)};
    });
  }
});

// get urls for individual shirts
request(urlBase, (error, response, body) => {
  if(!error && response.statusCode === 200) {
    let $ = cheerio.load(body);
    let items = $('.products a');
    for(let i = 0; i < items.length; i++) {
      shirtHref.push('http://shirts4mike.com/' + $(items[i]).attr('href'));
    }
} else {
  alarm(error);
}

shirtHref.forEach((url) => {
  request(url, (error, response, body) => {
    if(!error && response.statusCode === 200){
      let $ = cheerio.load(body);
      let shirt = {};
      shirt.title = $('title').text();
      shirt.price = $('.price').text();
      shirt.imageURL = $('img').attr('src');
      shirt.URL = url;
      shirt.time = time;
      shirtArray.push(shirt);

    } else {
      alarm(error);
    }
    if (shirtArray.length == 8){
      const csv = json2csvParser.parse(shirtArray, {fields});
      fs.writeFile(dir + '/'+ time + ".csv", csv, function(error) {
        if (error) alarm(error);
      });
    }
  })
});

});
