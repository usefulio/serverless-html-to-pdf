'use strict';

// add wkhtmltopdf to the execute path
process.env['PATH'] = [process.env['PATH'], __dirname + '/bin', process.env['LAMBDA_TASK_ROOT'] + '/bin'].join(':');

var fs = require('fs');
var path = require('path');
var fetch = require('node-fetch');
var wkhtmltopdf = require('wkhtmltopdf');
var read = require('read-all-stream');

function renderPdf(html, options) {
  return read(wkhtmltopdf(html, options), null);
};

module.exports.htmlToPdf = function(event, context, callback) {
  var input = JSON.parse(event.body);
  var debug = input.debug === true;
  
  if(debug){
    console.log('received input');
    console.log(event.body);
  }

  var promises = [];

  if(input.options){
    // download and cache the footer html
    if(input.options['footer-html']){
      promises.push(
        fetch(input.options['footer-html'])
        .then(function(res) {
          return res.text();
        })
        .then(function(content){
          var footerPath = path.join('/', 'tmp', 'footer.html');
          if(debug){
            console.log('Received footer html and storing in', footerPath);
            console.log(content);
          }
          fs.writeFileSync(footerPath, content);
          input.options['footer-html'] = footerPath;
        })
      );
    }
    if(input.options['header-html']){
      // download and cache the header html
      promises.push(
        fetch(input.options['header-html'])
        .then(function(res) {
          return res.text();
        })
        .then(function(content){
          var headerPath = path.join('/', 'tmp', 'header.html');
          if(debug){
            console.log('Received header html and storing in', headerPath);
            console.log(content);
          }

          fs.writeFileSync(headerPath, content);
          input.options['header-html'] = headerPath;
        })
      );
    }
  }

  Promise.all(promises).then(function(){
    renderPdf(input.html, input.options)
    .then(function(result){
      if(debug){
        console.log('returning result with length', result.length);
      }
      callback(null, result);
    })
    .catch(function(err){
      console.log("Error");
      console.log(err);
      callback(err);
    });
  });
};
