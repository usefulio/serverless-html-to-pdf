'use strict';

const JSZip = require('jszip');

module.exports = {
  compress(data, filename, options) {
    const zip = new JSZip();
    zip.file(filename, data);
    return zip.generateAsync(options)
              .then(function(content) {
                return content
              });
  },
  decompress(buffer) {
    const zip = new JSZip();
    return zip.loadAsync(buffer)
              .then(function (res) {
                // this may look bizare but it allows us to unzip a file no matter what the filename or path is
                let files = []
                res.forEach((rel_path, file)=>{
                  files.push(file);
                })
                return files[0].async('string');
              })
  }
};