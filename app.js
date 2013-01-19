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
  //util.generatePins(5);
  //util.link('user1@gmail.com', 101);
  //util.link('user1@gmail.com', 102);
  //util.clearLinks('user1@gmail.com');
  
  //util.readAndResolve('user1@gmail.com');
  
  //customResolve();
  //mr.listKeys('users', function(results){
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

//fill each user's posts array with relevant posts
function link(){
  var gpArr = [];
  var arr = [];
  c = '101';
  for(var i = 0; i < 80; i++){
    arr.push(c);
    c++;
  }
  //console.log(arr);
  riak.bucket('gamepins').objects.get(arr, function(err, gamepin){
    for(gp in gamepin){
      console.log(gamepin[gp].key);
      //console.log(gamepin[gp].data.posterId);*/
      gpArr.push(gamepin[gp].data.posterId);
      linkIt(gamepin[gp].data.posterId, gamepin[gp].key);
    }
  });
  function linkIt(userId, pinId){
    riak.bucket('users').objects.get(userId, function(err, usr){
      console.log('link ' + userId + ' with ' + pinId + ' via: ');
      //console.log(usr.data.posts);
      //console.log(usr.siblings);
      //console.log(usr.metadata);
      usr.data.posts.push(pinId);
      usr.save(function(err, saved){
        console.log(saved.data.posts);
      });
    });
  }
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

  /*my_pin.save(function(err, obj) {
      console.log(obj);
  });*/
}

function removeConflict(){
  riak.bucket('gamepins').objects.get(101, function(err, objs){
    console.log(objs);
  });
  /*pin0.fetch(function(err, obj) {
    console.log(obj);
  });*/
}

//12 categories
var categories = ['Casino', 'Casual', 'Shooter', 'Action',
                  'Simulation', 'Racing', 'Puzzle', 'Fighting',
                  'Social', 'Space', 'Horror', 'Strategy'];
//40 users
var userEmails = [];
for(var i = 0; i < 40; i++){
  userEmails.push('user'+i+'@gmail.com');
}

//Populate db with 40 users
function populateUsers(){
  var randNums = [];
  var users = [];
  var userKeys = [];
  var c = -1;
  //generate 40 rand numbers and store in array
  for(var i = 0; i < 40; i++){
    var count = 0;
    random.getRandomInt(0, 11, function(err, value) {
      randNums.push(value);
      count++;
      if(count === 40) next();
    });
  }
  //create 40 users
  function next(){
    var emailStr, nameStr, fb, cat;
    for(var i = 0; i < 40; i++){
      emailStr = userEmails[i];
      nameStr = 'user' + i;
      fb = i < 10 ? true : false;
      var hash = bcrypt.hashSync(nameStr);
      userKeys.push(emailStr);
      users.push({email: userEmails[i], passHash:hash, name:nameStr, fbConnect:fb, favCat:categories[randNums[i]],
       profileImg:'/images/profile/profile'+i+'.png', posts:[] });
    }
    
    riak.bucket('users').objects.get(userKeys).stream(function(results) {
      results.on('data', function(obj) {
        c++;
        console.log(obj.key);
        console.log('found');
        
        s1 = obj.key.indexOf('r') + 1;
        s2 = obj.key.indexOf('@');
        s = obj.key.substring(s1, s2);
        key = s.parseInt(s);
        console.log(key + ' !!! ');
        console.log(obj.key);
        
        newObj = riak.bucket('users').objects.new(obj.key, users[key]);
        newObj.metadata.vclock = obj.metadata.vclock;
        newObj.save(function(err, saved){
          console.log('user overwritten');
        });
      });
      results.on('error', function(err){
        c++;
        //if not found, create new obj.
        if(err.status_code === 404){
          console.log('not found');
          //console.log(err.data);
          console.log(err.data);
          s1 = err.data.indexOf('r') + 1;
          s2 = err.data.indexOf('@');
          s = err.data.substring(s1, s2);
          key = parseInt(s, 10);
          
          newObj = riak.bucket('users').objects.new(err.data, users[key]);
          newObj.save(function(err, saved){
            console.log('new user saved!');
          });
        }
      });
      results.on('end', function(){
        console.log('done');
      });
    });
  }
}

var test_resolve = function(siblings){
  for(var sib in siblings){
    console.log(siblings[sib])
  }
}

//Populate db with 80 gamepins
function populatePins(){
  var randCategories = [];
  var randPosters = [];
  var pinArray = [];
  var pinKeys = [];
  var c = -1;
  //generate 80 random categories (12 categories) and 80 unique descriptions
  for(var i = 0; i < 80; i++){
    var count = 0;
    random.getRandomInt(0, 11, function(err, value) {
      randCategories.push(categories[value]);
      count++;
      if(count === 80) next();
    });
  }
  function next(){
    //generate 80 random posters (40 users)
    for(var i = 0; i < 80; i++){
      var count = 0;
      var id = 101+i;
      pinKeys.push(id);
      random.getRandomInt(0, 39, function(err, value) {
        randPosters.push(userEmails[value]);
        count++;
        if(count === 80) next2();
      });
    }
    
  }
  function next2(){
    //add the pin ID to the user
    //get all these gamepin keys to see if the obj exists
    riak.bucket('gamepins').objects.get(pinKeys).stream(function(results) {
      // on data returns each object. Confirmed.
      results.on('data', function(obj) {
        console.log('found');
        //Overwrite old object.
        c = parseInt(obj.key, 10) - 101;
        
        newObj = riak.bucket('gamepins').objects.new(obj.key,
          { posterId: userEmails[c%30], category: randCategories[c], description:'This is a pin '+c, returnAll:'y'});
        //Must set vclock to match old object to overwrite it.
        newObj.metadata.vclock = obj.metadata.vclock;
        newObj.addToIndex('category', randCategories[c]);
        newObj.save(function(err, saved){
          console.log('gamepin overwritten:');
          console.log(saved);
        });
        linkUsr = riak.bucket('users').objects.new('user'+c+'@gmail.com', function(err, usr){
          usr.posts.push(obj.key);
          usr.save(function(err, saved){
          });
        });
      });
  
      results.on('error', function(err) {
        //if not found, create new obj.
        if(err.status_code === 404){
          console.log('not found');
          c = parseInt(err.data, 10) - 100;
          newObj = riak.bucket('gamepins').objects.new(err.data,
            { posterId: userEmails[c%30], category: randCategories[c], description:'This is a pin '+c, returnAll:'y' });
          newObj.addToIndex('category', randCategories[c]);
          newObj.save(function(err, saved){
            console.log('new gamepin created:');
            console.log(saved);
          });
        }
        //console.warn(err);
      });
      results.on('end', function() {
        console.log('done');
      });
    });
    //add pin ID to user's post list
  }
}

function removeSiblings(){
  riak.bucket('gamepins').objects.all(function(err, objs){
    for(obj in objs){
      //objs[obj].siblings = null;
      console.log(objs[obj]);
      //objs[obj].save(function(err, obj){
      //  console.log("Registered!");
      //});
    }
  });
}

function getSiblings(){
  var deletes = [];
  riak.bucket('gamepins').objects.all(function(err, objs){
    for(var obj in objs){
      console.log(objs[obj].siblings);
    }
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
    if(keys.length > 0) next();
    else{
      console.log('No '+ req.body.bucket +' in db. Unable to generate pins without owners.');
      return 0;
    }
  });
  //READ AND RESOLVE!!!
  function next(){
    riak.bucket(req.body.bucket).objects.get(keys, util.stupid_resolve, function(err, objs){
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
          objs[o].save(function(err, saved){
            console.log('conflict resolved');
            objList.push(saved);
          });
        }
        else{
          objList.push(objs[o]);
        }
        if(objList.length === objs.length) next2();
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