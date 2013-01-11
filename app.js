var express = require('express');
var http = require('http');
var winston = require('winston');
var fs = require('fs');
var random = require('secure_random');
var mr = require('./mapreduce');
var app = express();

//setup Redis and Riak
var RedisStore = require('connect-redis')(express);
var riak = exports.riak = require('nodiak').getClient('http', '10.0.1.49', 8100);


winston.add(winston.transports.File, { filename: 'web.log'});
winston.remove(winston.transports.Console);

/*random.getRandomInt(10, 15, function(err, value) {
  console.log(value);
});*/

//fill db up with 20 users and 50 gamepins
function populateDb(){
  var userArray = [];
  //12 categories
  var categories = ['Casino', 'Casual', 'Shooter', 'Action',
                    'Simulation', 'Racing', 'Puzzle', 'Fighting',
                    'Social', 'Space', 'Horror', 'Strategy'];
  var randNums = [];
  //generate 20 rand numbers and store in array
  for(var i = 0; i < 20; i++){
    var count = 0;
    random.getRandomInt(0, 11, function(err, value) {
      randNums.push(value);
      count++;
      if(count === 20) next();
    });
  }
  //create 20 users
  function next(){
    var emailStr, nameStr, fb, cat;
    for(var i = 0; i < 20; i++){
      emailStr = 'user' + i + '@gmail.com';
      nameStr = 'user' + i;
      fb = i < 10 ? true : false;
      var user = riak.bucket('users').objects.new(emailStr,
        { email: emailStr, name: nameStr, fbConnect:fb, favCat:categories[randNums[i]],
        profileImg:'/images/profile/profile'+i+'.png' });
      userArray.push(user);
    }
    console.log(userArray);
    //save these into DB
    riak.bucket('users').objects.save(userArray, function(errs, objs) {
      console.log('saved');
    });
  }
}

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(express.cookieParser());
  //logging middleware
  app.use(function(req, res, next){
    winston.info(req.method)
    winston.info(req.url);
    next();
  });
});

//Test db connection
riak.ping(function(err, response){
  console.log('Connection to riak db: ' + response);
  mr.listObjects('users');
  //listObjects('gamepins');
  //listKeys('users');
  //listKeys('detail');
  //deleteObjects('users');
  //populateDb();
});

winston.log('info', 'Hello from Winston!');
winston.info('This also works');

/* AJAX API */
//edit user
app.post('/edit', function(req, res){
  console.log(req.body.key);
  //declare obj with key
  var my_obj = riak.bucket('users').objects.new(req.body.key);
  //fill its data in
  my_obj.fetch(function(err, obj) {
    console.log(obj);
    next(obj);
  });
  function next(obj){
    //update
    if(req.body.email) obj.data.email = req.body.email;
    if(req.body.name) obj.data.name = req.body.name;
    if(req.body.passHash) obj.data.passHash = req.body.passHash;
    if(req.body.fbConnect) obj.data.fbConnect = req.body.fbConnect;
    if(req.body.favCat) obj.data.favCat = req.body.favCat;
    //save
    obj.save(function(err, obj){
      console.log(obj);
      return res.json({ success: true });
    });
  }
});
//delete key & corresponding data
app.post('/delete', function(req, res){
  //riak.bucket(req.body.bucket).objects.delete()
  riak.bucket(req.body.bucket).objects.get(req.body.key, function(err, obj){
    console.log(obj);
    next(obj);
  });
  function next(obj){
    riak.bucket(req.body.bucket).objects.delete(obj, function(err, obj){
      console.log("delete success");
      return res.json({ success: true });
    });
  }
});
app.post('/delete_all', function(req, res){
  //get all objects in bucket
  riak.bucket(req.body.bucket).objects.all(function(err, objs){
    next(objs);
  });
  function next(objs){
    riak.bucket(req.body.bucket).objects.delete(objs, function(errs, objs){
      console.log("All objects in " + req.body.bucket + " deleted!");
      return res.json({ success: true });
    });
  }
});
app.get('/getBuckets', function(req, res){
  var result = {arr: []};
  db.buckets(function(err, buckets, meta){
    for(bucket in buckets){
      if(buckets.hasOwnProperty(bucket)){
        result.arr.push(buckets[bucket]);
      }
    }
    return res.json(result);
  });
});
//get all objects in bucket
app.post('/getBucket', function(req, res){
  riak.bucket(req.body.bucket).objects.all(function(err, r_objs){
    for(obj in r_objs){
      console.log(r_objs[obj].siblings);
      console.log('_____________________');
    }
    //return res.json(r_objs);
  });
});

app.get('/', function(req, res){
  res.render('main');
});

//add User
app.post('/register', function(req, res){
  var count = null;
  var newUser = req.body;
  
  var user = riak.bucket('users').objects.new(newUser.email, newUser);
  user.addToIndex('name', newUser.name);
  user.save(function(err, obj){
    console.log("Registered!");
  });
  return res.json({success: true});
});
//add gamepin
app.post('/postGamePin', function(req, res){
  var newObj = req.body;
  
  // make a GET request to nodeflake to get an ID
  var ID_obj;
  var options = {
    host: '10.0.1.29',
    port: 1337,
    path: '/',
    method: 'GET',
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:17.0) Gecko/20100101 Firefox/17.0" }
  };
  var R = http.request(options, function(response) {
    var ID = "";
    
    // keep track of the data you receive
    response.on('data', function(data) {
      ID += data;
    });
    response.on('end', function() {
      ID_obj = JSON.parse(ID);
      next();
    });
  });
  R.end();
  
  //save the object with generated ID
  function next(){
    var gamePin = riak.bucket('gamepins').objects.new(ID_obj.id, newObj);
    gamePin.addToIndex('category', newObj.category);
    gamePin.save(function(err, obj){
      console.log("Gamepin saved");
      return res.json({success: true});
    });
  }
});
//add storepin
app.post('/postStorePin', function(req, res){
  var newObj = req.body;
  
  // make a GET request to nodeflake to get an ID
  var ID_obj;
  var options = {
    host: '10.0.1.29',
    port: 1337,
    path: '/',
    method: 'GET',
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:17.0) Gecko/20100101 Firefox/17.0" }
  };
  var R = http.request(options, function(response) {
    var ID = "";
    
    // keep track of the data you receive
    response.on('data', function(data) {
      ID += data;
    });
    response.on('end', function() {
      ID_obj = JSON.parse(ID);
      next();
    });
  });
  R.end();
  
  //save the object with generated ID
  function next(){
    var storePin = riak.bucket('storepins').objects.new(ID_obj.id, newObj);
    storePin.addToIndex('category', newObj.category);
    storePin.addToIndex('price', newObj.price);
    storePin.save(function(err, obj){
      console.log("Storepin saved");
      return res.json({success: true});
    });
  }
});
//query via category
app.post('/categorySearch', function(req, res){
  var objArray = [];
  console.log(req.body);
  riak.bucket(req.body.bucket).search.twoi(req.body.category, 'category', function(err, keys){
    if(keys.length == 0) return res.json({ error: 'Not found' });
    var len = keys.length;
    var count = 0;
    for(key in keys){
      riak.bucket(req.body.bucket).objects.get(keys[key], function(err, obj){
        objArray.push(obj);
        count++;
        if(count === len) next();
      });
    }
    function next(){
      return res.json({ objects: objArray });
    }
  });
});

app.get('/getImg', function(req, res){
  console.log('getting img');
});

app.get('/saveImg', function(req, res){
  console.log('uploading img');
  fs.readFile('public/images/images (1).jpg', 'utf8', function(err, data){
    if (err) {
      return console.log(err);
    }
    console.log(data);
    var img = riak.bucket('images').objects.new('i');
    img.save(function(err, data){
      if(err) return console.log(err);
      return res.json({ success: true });
    });
  });
});

app.post('/textSearch', function(req, res){
  var objArray = [];
  console.log(req.body);
  var query = {
    q: 'description:' + '"' + req.body.text + '"'
  }
  riak.bucket(req.body.bucket).search.solr(query, function(err, response){
    return res.json({ objects: response.response.docs });
  });
});

app.listen(3002, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});