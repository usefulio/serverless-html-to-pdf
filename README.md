Don't forget to `npm install` when cloning this repo.

A serverless service using `wkhtmltopdf` to render html to pdf and return the result as a binary string.

It includes the Amazon Linux compatible binary (64bit) of wkhtmltopdf in the `./bin` directory.

Deploy using `sls deploy` using sls version 1.5.1+. You must have the AWS profile `usefulio` configured with access to Useful IO's AWS account.

This service is configured to be available from APIGold at https://layer.api.gold/html-to-pdf.

Example using this service from Meteor

```js
Meteor.methods({
  renderHTMLToPDF: function(...) {

    const html = ''; // either inline html as a string, or a url to a page you want to render to PDF

    var result = HTTP.post("https://layer.api.gold/html-to-pdf", {
      data: {
        html: html,
        options: {
          "orientation": "Landscape",
          "javascript-delay": 10000,
          ... all wkhtmltopdf options are supported.
        }
      },
      headers: {
        APIKEY: "<YOUR API KEY>"
      }
    });

    // console.log(result.data);

    var pdf = new Uint8Array(new Buffer(result.data.data));
    return pdf;
  }
});
```