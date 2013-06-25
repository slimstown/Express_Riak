var express = require('express');
var http = require('http');
var fs = require('fs');
var mr = require('./mapreduce');
var util = require('./utility');
var bcrypt = require('bcrypt-nodejs');
var request = require('request');
var config = require('./config');
var mandrill = exports.mandrill = require('node-mandrill')('rRK6Fs7T1NKpMbJZKxpJfA');

var app = exports.self = express();

var production = false;

//setup Redis and Riak
var RedisStore = require('connect-redis')(express);
if(production){
  var riak = exports.riak = require('nodiak').getClient('http', 'riak3.quyay.com', 8098);
  console.log('DB Interface on Production Data');
}
else{
  console.log(config.db_host);
  var riak = exports.riak = require('nodiak').getClient('http', config.db_host, 8100);
  console.log('DB Interface on Dev Data');
}

var api = require('./routes/api');

//IT ALL STARTS HERE
/*riak.ping(function(err, response){
  if(err){
    console.log(err);
    return;
  }
  console.log('Connection to Riak: ' + response);
  util.generateId(function(id){
    if(id) console.log('Connection to nodeflake: OK');
  });
});*/

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(express.cookieParser());
  //logging middleware
  app.use(function(req, res, next){
    next();
  });
});

//serve main page
app.get('/', function(req, res){
  res.render('main');
});
//contains api functions
api();

app.listen(3003, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});