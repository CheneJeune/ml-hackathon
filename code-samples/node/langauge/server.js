// ---------------------------------------------------------------
// Import modules
// ---------------------------------------------------------------
var express = require('express');
var path    = require('path');
var fs      = require('fs');
var bodyParser = require('body-parser')
var request = require('request');
var dotenv = require('dotenv');
dotenv.config();

// ---------------------------------------------------------------
// Instantiate the app
// ---------------------------------------------------------------

var app = express();

var APIKey        = process.env.APIKey;
var clientID      = process.env.clientID;
var clientSecret  = process.env.clientSecret;
var authenticationURL = process.env.authenticationURL;

// Serve 'dynamic' jsx content being transformed if needed
var srcDir = path.resolve(__dirname);
var file;

app.post('/api/detect', function(req, res){
  parseJSONBody(req, function(j){      
    callLML("https://sandbox.api.sap.com/ml/api/v2alpha1/text/lang-detect/", j, function(body){
      console.log(JSON.parse(body));
      res.write(body)
    });
  })
});

app.post('/api/bearer', function(req, res){
  parseJSONBody(req, function(data){
    getBearerToken(function(token){
        request.post({
          url: "https://mlftrial-language-detection.cfapps.eu10.hana.ondemand.com/api/v2alpha1/text/lang-detect/", 
          body: JSON.stringify(data),
          headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
              "Authorization": "Bearer " + token
            }
        }, function optionalCallback(err, httpResponse, body) {
            if (err) {
              return console.error('upload failed:', err);
            }
            console.log("response is: " + body)
            res.send(body)
        });
    });
  })
});

app.use('/', function (req, res) {
    file = srcDir + req.path;
    res.sendFile(file);
});

/*
Express body parser and proxy are incompatible.
*/
function parseJSONBody(res, callback){
    var body = '';
    res.on('data', function (data) {
        body += data;
        // Too much POST data, kill the connection!
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6)
            res.connection.destroy();
    });

    res.on('end', function () {
        var post = JSON.parse(body);
        callback(post);
    });
}

/*
url: is the end point of the call
data: is the message to send (json assumed)
callback: to get the data backout
*/
function callLML(url, oData, callback){
  request.post({
      url: url, 
      body: JSON.stringify(oData),
      headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "APIKey": APIKey
        }
    }, function optionalCallback(err, httpResponse, body) {
        if (err) {
          return console.error('upload failed:', err);
        }
        callback(body);
  });
}

function getBearerToken(callback){
    var token = Buffer.from(clientID + ':' + clientSecret).toString('base64');
    console.log(token)
    request.get({
      url: authenticationURL, 
      headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": "Basic " + token
        }
    }, function optionalCallback(err, httpResponse, body) {
        if (err) {
          return console.error('failed:', err);
        }
        callback(JSON.parse(body).access_token);
  });
}

// ---------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------
var server = app.listen(process.env.PORT || 1666, function () {
    process.stdout.write('Started dashboard dev server on port ' + server.address().port + '\n');
});