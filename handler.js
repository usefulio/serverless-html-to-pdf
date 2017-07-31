'use strict';

// add wkhtmltopdf to the execute path
process.env['PATH'] = [process.env['PATH'], __dirname + '/bin', process.env['LAMBDA_TASK_ROOT'] + '/bin'].join(':');

var fs = require('fs');
var path = require('path');
var fetch = require('node-fetch');
var wkhtmltopdf = require('wkhtmltopdf');
var read = require('read-all-stream');

// const Promise = require('bluebird');
const zip = require('./lib/zip');

function renderPdf(html, options) {
  return read(wkhtmltopdf(html, options), null);
};

module.exports.htmlToPdf = function(event, context, callback) {
  let input = {};
  if (event.body) {
    // REST call
    input = JSON.parse(event.body);    
  } else {
    // API call
    input = event;
  }

  const zippedHtml = input.options && input.options.zippedHtml,
        zippedPdf = input.options && input.options.zippedPdf,
        zippedPdfFilename = input.options && input.options.zippedPdfFilename;

  input.options && (delete input.options.zippedHtml);
  input.options && (delete input.options.zippedPdf);
  input.options && (delete input.options.zippedPdfFilename);

  var debug = input.debug === true;
  
  if(debug){
    console.log('received input');
    console.log(input);
  }

  var promises = [];

  if(input.options){
    if(zippedHtml) {
      var g = JSON.stringify(input.html).replace(/[\[\]\,\"]/g,''); //https://stackoverflow.com/a/19354869/4076776
      console.log(`zipped input length (bytes): ${g.length}`);
      delete input.options.zipped;
      promises.push(
          zip.decompress(input.html)
                  .then((res)=>{
                    input.html = res;
                  })
        );
    }
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
    .then(function(pdfFile){
      var g = JSON.stringify(pdfFile).replace(/[\[\]\,\"]/g,''); //https://stackoverflow.com/a/19354869/4076776
      console.log(`pdf: ${g.length} bytes`);      
      if(zippedPdf) {
        zip.compress(pdfFile, `${zippedPdfFilename}.pdf`, {
           type:"binarystring"
          , compression: "DEFLATE"
          , compressionOptions : { level: 9 }         
        })
        .then((zipFile)=>{
          var g = JSON.stringify(zipFile).replace(/[\[\]\,\"]/g,''); //https://stackoverflow.com/a/19354869/4076776
          console.log(`output zip ${g.length} bytes`);      

          callback(null, { data: zipFile });
        });
      } else {
        callback(null, pdfFile);
      }


    })
    .catch(function(err){
      console.log("Error");
      console.log(err);
      callback(err);
    });
  });
};
