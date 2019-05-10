// ---------------------------------------------------------------
// Import modules
// ---------------------------------------------------------------
var express = require('express');
var path    = require('path');
var fs      = require('fs');
var bodyParser = require('body-parser')
var request = require('request');

// ---------------------------------------------------------------
// Instantiate the app
// ---------------------------------------------------------------

var app = express();

// Serve 'dynamic' jsx content being transformed if needed
var srcDir = path.resolve(__dirname);
var file;

// parse application/json
//app.use(bodyParser.json())

app.post('/api/detect', function(req, res){
  parseJSONBody(req, function(j){
    console.log(j)
  })
  /*
  callLML("https://sandbox.api.sap.com/ml/api/v2alpha1/text/lang-detect/", , function(body){
    console.log(JSON.parse(body));
  });*/
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

function callLML(url, data, callback){
  request.post({
      url: url, 
      body: JSON.stringify(data),
      headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "APIKey": "nqahOCuNFAIw0inHUbKBJXcsCZf9rIs5"//TODO put your api key here
        }
    }, function optionalCallback(err, httpResponse, body) {
        if (err) {
          return console.error('upload failed:', err);
        }
        callback(body);
  });
}

// ---------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------
var server = app.listen(process.env.PORT || 1666, function () {
    process.stdout.write('Started dashboard dev server on port ' + server.address().port + '\n');
});
