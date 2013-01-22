var express = require('express');
var http = require('http');
var winston = require('winston');
var fs = require('fs');
var random = require('secure_random');
var mr = require('./mapreduce');
var util = require('./utility');
var bcrypt = require('bcrypt-nodejs');
var app = express();

//global vars
var s;

//setup Redis and Riak
var RedisStore = require('connect-redis')(express);
var riak = exports.riak = require('nodiak').getClient('http', '10.0.1.49', 8100);

winston.add(winston.transports.File, { filename: 'web.log'});
winston.remove(winston.transports.Console);

merge_resolve = function(siblings) {
  function siblingLastModifiedSort(a, b) {
    if(!a.metadata.last_modified || new Date(a.metadata.last_modified) < new Date(b.metadata.last_modified)) {
      return 1;
    }
    else {
      return -1;
    }
  }
  siblings.sort(siblingLastModifiedSort);
  //merge posts together
  console.log('mergeresolve!');
  for(var i = 1; i < siblings.length; i++){
    siblings[0].data.posts.concat(siblings[i].data.posts);
  }
  return siblings[0];
}

//IT ALL STARTS HERE
riak.ping(function(err, response){
  //util.generateUsers(0, 10);
  //util.generatePins(0, 20);
  //util.link('user1@gmail.com', 101);
  //util.link('user1@gmail.com', 102);
  //util.clearLinks('user1@gmail.com');
  //util.clearConflicts();
  //util.readAndResolve('user1@gmail.com');
  //util.like('user1@gmail.com', 109);
  
  /******TODO*****/
  //add dateJoined & datePosted
  //fill in other relevant fields
  //util.unlike()
  //util.follow('user1@gmail.com', 'user3@gmaill.com') //follow is a 1 way procss
  //util.friend('user1@gmail.com', 'user2@gmail.com') //friend sends request. Upon confirmation, 2 way friendship and followership is achieved
  //util.unfollow(user1, user2);
  //util.defriend();
  //util.postPin();
  //util.rePin();
  //util.editPin();
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
  
  //customResolve();
  //mr.listKeys('gamepins', function(results){
  //  console.log(results);
  //});
  //mr.listKeys('gamepins');
  
  //mr.deleteObjects('gamepins');
  //mr.deleteObjects('users');
  
  //populateUsers();
  //populatePins();
  //link();
  //unlink();
  //query('139');
  //addPin();
  //removeConflict();
  
  //removeSiblings();
  //getSiblings();
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
//get all objects in bucket, resolving conflicts along the way
app.post('/getBucket', function(req, res){
  var objList = [];
  var keys = [];
  mr.listKeys(req.body.bucket, function(results){
    keys = results.data;
    console.log(results.data);
    if(keys.length > 0) next();
    else{
      console.log('No '+ req.body.bucket +' in db.');
      return 0;
    }
  });
  //READ AND RESOLVE!!!
  function next(){
    conflicted = [];
    riak.bucket(req.body.bucket).objects.get(keys, util.user_resolve, function(err, objs){
      if(err){
        console.log('Error:');
        console.log(err);
        return res.json({error: 'object is missing or other error. Bad news :( '});
      }
      //if nodiak gives us a single object, convert that into an array with 1 element
      if(objs && Object.prototype.toString.call( objs ) === '[object Object]')
        objs = [objs];
      //loop through all found objects and overwrite them
      for(o in objs){
        //if siblings, write to resolve conflict
        if(objs[o].siblings){
          conflicted.push(objs[o]);
        }
        //if no siblings, push this to the array to be sent to front end
        else{
          objList.push(objs[o]);
        }
        //if(objList.length === objs.length) next2();
      }
      //resove conflicts
      var len = conflicted.length;
      //if no conflicts, return objList
      if(len <= 0){
        return res.json(objList);
      }
      //if conflicts, write them to resolve.
      else{
        for(var c = 0; c < conflicted.length; c++){
          (function(c){
            conflicted[c].save(function(err, saved){
              console.log('conflict resolved');
              //clear siblings so we can convert to JSON
              saved.siblings = null;
              objList.push(saved);
              if(c === len-1) next2();
            });
          })(c);
        }
      }
    });
    function next2(){
      console.log('got all '+req.body.bucket+' objects');
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