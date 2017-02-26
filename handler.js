'use strict';

// add wkhtmltopdf to the execute path
process.env['PATH'] = [process.env['PATH'], __dirname + '/bin', process.env['LAMBDA_TASK_ROOT'] + '/bin'].join(':');

var wkhtmltopdf = require('wkhtmltopdf');
var read = require('read-all-stream');

function renderPdf(html, options) {
  return read(wkhtmltopdf(html, options), null);
};

module.exports.htmlToPdf = function(event, context, callback) {
  var input = JSON.parse(event.body);
  renderPdf(input.html, input.options)
  .then(function(result){
    callback(null, result);
  })
  .catch(function(err){
    callback(err);
  });
};
