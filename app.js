var express = require('express');
var http = require('http');
var winston = require('winston');
var fs = require('fs');
var random = require('secure_random');
var mr = require('./mapreduce');
var util = require('./utility');
var bcrypt = require('bcrypt-nodejs');
var flake = require('flake');

var app = express();

//global vars
var s;

//setup Redis and Riak
var RedisStore = require('connect-redis')(express);
var riak = exports.riak = require('nodiak').getClient('http', '10.0.1.49', 8100);

winston.add(winston.transports.File, { filename: 'web.log'});
winston.remove(winston.transports.Console);

winston.log('info', 'Hello from Winston!');
winston.info('This also works');

//IT ALL STARTS HERE
riak.ping(function(err, response){ 
  /******** TESTS *********/
  //util.clearChanges(changes);
  //util.generateUsers(0, 10);
  //util.generatePins(0, 20);
  //mr.deleteObjects('gamepins');
  //mr.deleteObjects('users');
  //mr.deleteObjects('comments');
  //util.addUser();
  //util.deactivateUser('user3@gmail.com');
  /*util.postPin(251, { posterId: 'user1@gmail.com',
          likedBy: [],
          repinVia: null,
          category: 'Shooter',
          content: null,
          sourceUrl: null,
          gameName: null,
          publisher: null,
          description: 'This is pin 151',
          datePosted: null,
          groupId: null,
          returnAll: 'y',
          changes:{ likedBy: {add:[], remove:[]}
                  }
  });*/
  //util.deletePin('116');
  
  //util.link('user1@gmail.com', 101);
  //util.clearLinks('user1@gmail.com');
  //util.clearConflicts();
  //util.readAndResolve('user1@gmail.com');
  //util.like('user3@gmail.com', 108);
  //util.like('user5@gmail.com', 108);
  //util.like('user6@gmail.com', 108);
  //util.like('user7@gmail.com', 108);
  //util.unlike('user3@gmail.com', 108);
  //util.unlike('user7@gmail.com', 102);
  
  /******TODO*****/
  //util.follow('user4@gmail.com', 'user6@gmail.com'); //follow is a 1 way procss
  //util.follow('user4@gmail.com', 'user7@gmail.com');
  //util.follow('user4@gmail.com', 'user8@gmail.com');
  //util.friend('user1@gmail.com', 'user2@gmail.com') //friend sends request. Upon confirmation, 2 way friendship and followership is achieved
  //util.unfollow('user4@gmail.com', 'user8@gmail.com');
  //util.defriend();
  
  /*util.repin(201, { posterId: 'user4@gmail.com',
    repinVia: 'user1@gmail.com',
    category: 'Casino',
    content: '',
    sourceUrl: null,
    gameName: null,
    publisher: null,
    description: 'This is pin 100',
    datePosted: null,
    groupId: null,
    returnAll: 'y'
  });*/
  /*util.editPin(101, { posterId: 'user0@gmail.com',
    repinVia: null,
    category: 'Horror',
    content: '',
    sourceUrl: null,
    gameName: null,
    publisher: null,
    description: 'This is pin 1!',
    datePosted: null,
    groupId: null,
    returnAll: 'y'
  });*/
  //util.addComment(103, 'user9@gmail.com', 'This game was fun!!!');
  //util.addComment(103, 'user0@gmail.com', 'Yea the game was really fun!!!');
  //util.addComment(103, 'user4@gmail.com', 'I did not think this game was fun >:[!!!');
  //util.deleteComment('200117125921247230');
  
  //util.deletePin();
  //util.makeGroup();
  //util.editGroup();
  //util.deleteGroup();
  //util.addToGroup();
  //util.editSettings();
  //util.tagFriend();
  
  /***MORE COMPLEX***/
  //util.friendRequest();
  //util.message();
  //util.createConversation();
  //util.totalUsers();
  //util.totalPins();
  //util.addEvent();
  
  /*** HOLD OFF FOR NOW ****/
  //util.addXP();
  //util.addBadge();
});

function unlink(){
  riak.bucket('users').objects.all(function(err, objs){
    for(obj in objs){
      console.log(objs[obj].key);
      objs[obj].data.posts = [];
      objs[obj].save(function(err, saved){
        console.log(saved.data.posts);
      });
    }
  });
}

function query(key){
  //On 300, default auto-resolution returns latest sibling obj, with all siblings attached to
  //a .siblings property
  riak.bucket('gamepins').objects.get(key, function(err, objs){
    if(objs.length !== 0){
      console.log('object found');
      console.log(objs);
      //if siblings are present, write obj with vec clock to resolve
      if(objs.siblings){
        objs.save(function(err, obj){
          console.log('object saved and conflicts resolved');
          console.log(obj);
        });
      }
      //if no siblings, then no need to write. We are done.
    }
    if(err){
      //object not found, try again or troubleshoot.
      if(err.status_code === 404){
        console.log('object not found');
      }
    }
  });
}

function addPin(){
  //read object
  var my_pin = riak.bucket('users').objects.new('888');
  my_pin.fetch(function(err, obj){
    console.log(obj);
    //Update it if exists.  Create it if empty.  (Its the same thing)
    obj.data = {content: "Second"};
    //overwrite previous version by writing with vector clock
    obj.save(function(err, saved){
      console.log(saved);
    })
  });
}

function configure(){
  var users = riak.bucket('users');
  var pins = riak.bucket('gamepins');
  users.props.allow_mult = false;
  users.props.last_write_wins = true;
  users.saveProps(true, function(err, props) {
  });
  pins.props.allow_mult = false;
  pins.props.last_write_wins = true;
  pins.saveProps(true, function(err, props) {
  });
  console.log('done');
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
    winston.info(req.method);
    winston.info(req.url);
    next();
  });
});


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
//get all objects in bucket, resolving conflicts along the way
app.post('/getBucket', function(req, res){
  var objList = [];
  var keys = [];
  mr.listKeys(req.body.bucket, function(results){
    keys = results.data;
    if(keys.length > 0) next();
    else{
      console.log('No '+ req.body.bucket +' in db.');
      return 0;
    }
  });
  //READ AND RESOLVE!!!
  function next(){
    conflicted = [];
    var resolve_func;
    if(req.body.bucket === 'gamepins') resolve_func = util.pin_resolve;
    else if(req.body.bucket === 'users') resolve_func = util.user_resolve;
    riak.bucket(req.body.bucket).objects.get(keys, resolve_func, function(err, objs){
      if(err){
        console.log('Error:');
        console.log(err);
        return res.json({error: 'object is missing or other error. Bad news :( '});
      }
      //if nodiak gives us a single object, convert that into an array with 1 element
      if(objs && Object.prototype.toString.call( objs ) === '[object Object]')
        objs = [objs];
      //Add conflicts to queue to be resolved
      for(var o in objs){
        util.clearChanges(objs[o]);
        if(objs[o].siblings)
          conflicted.push(objs[o]);
        else
          objList.push(objs[o]);
      }
      var len = conflicted.length;
      //if no conflicts, return objList
      if(len <= 0){
        console.log('no conflicts: Got all '+req.body.bucket+' objects');
        return res.json(objList);
      }
      //if conflicts, resolve them
      else{
        var clock = 0;
        for(var c = 0; c < conflicted.length; c++){
          (function(c){
            conflicted[c].save(function(err, saved){
              console.log('conflict resolved');
              //clear siblings so we can convert to JSON
              saved.siblings = null;
              objList.push(saved);
              if(clock === conflicted.length-1) next2();
              console.log("clock: "+clock);
              clock++;
            });
          })(c);
        }
      }
    });
    function next2(){
      console.log('conflicts solved: got all '+req.body.bucket+' objects');
      return res.json(objList);
    }
  }
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
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:17.0) Gecko/40100101 Firefox/17.0" }
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
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:17.0) Gecko/40100101 Firefox/17.0" }
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
  s = 10;
  var objArray = [];
  console.log(req.body);
  var query = {
    q: 'description:' + '"' + req.body.text + '"',
    start: s,
    rows: 10,
    presort: 'key'
  }
  
  riak.bucket(req.body.bucket).search.solr(query, function(err, response){
    console.log(response);
    console.log(response.response);
    return res.json({ objects: response.response.docs });
  });
});

app.listen(3002, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});