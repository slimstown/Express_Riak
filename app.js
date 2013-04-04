var express = require('express');
var http = require('http');
var winston = require('winston');
var fs = require('fs');
var mr = require('./mapreduce');
var util = require('./utility');
var bcrypt = require('bcrypt-nodejs');
var request = require('request');
var rackit = require('rackit');
var config = require('./config');
var mandrill = exports.mandrill = require('node-mandrill')('rRK6Fs7T1NKpMbJZKxpJfA');

//create rackspace image, define name of container we will push images to
rackit.init({
  user: 'happyspace',
  key: '1b5a100b899c44633dbda1aa93ea6237',
  prefix: 'test',
  tempURLKey : null, // A secret for generating temporary URLs
  useSNET : false,
  useCDN : true,
  useSSL : true, // Specifies whether to use SSL (https) for CDN links
  verbose : false, // If set to true, log messages will be generated
  logger : console.log // Function to receive log messages
}, function(err){
  if(err) console.log('error:' + err);
});

var app = express();

//global vars
var s;

//setup Redis and Riak
var RedisStore = require('connect-redis')(express);
var riak = exports.riak = require('nodiak').getClient('http', 'riak3.quyay.com', 8098);
//var riak = exports.riak = require('nodiak').getClient('http', config.db_host, 8100);

winston.add(winston.transports.File, { filename: 'web.log'});
winston.remove(winston.transports.Console);

winston.log('info', 'Hello from Winston!');
winston.info('This also works');

//IT ALL STARTS HERE
riak.ping(function(err, response){
  if(err){
    console.log(err);
    return;
  }
  console.log('riak connected: ' + response);
  /*riak.bucket('user').getProps(function(err, props){
    console.log(props);
  });*/
  /*riak.bucket('gamepins').getProps(function(err, props){
    console.log(props);
  });*/
  //util.clearTony();
  //util.getUser('user1@gmail.com');
  //util.getUserbyIndex('user1');
  //util.createUser('user1@gmail.com', 'user1', ['Shooter', 'Action', 'Adventure']);
  //util.createGamepin(owner, category, description);
  //util.createGamepin('user1@gmail.com', 'user1', 'Shooter', 'This is a shooter game. BANG!');
  //util.generateUsers(0, 20, function(){});
  //util.generatePins(0, 200);
  //util.populateDb();
  //util.clearPosts('amar.gavhane@gmail.com');
  //util.wipeDb();
  /*mr.deleteObjects('gamepins');
  mr.deleteObjects('users');
  mr.deleteObjects('comments');
  mr.deleteObjects('userReference');
  mr.deleteObjects('pendingUsers');*/
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
  //util.like('user3@gmail.com', 108);
  //util.unlike('user7@gmail.com', 102);
  //util.follow('user4@gmail.com', 'user9@gmail.com');
  //util.unfollow('user4@gmail.com', 'user8@gmail.com');
  //util.addComment(102, 'user9@sgmail.com', 'This game was fun 9/10!!!');
  //util.addComment(104, 'user4@gmail.com', 'This game was fun 4/10!!!');
  //util.deleteComment('200117125921247230');
});

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

//serve main page
app.get('/', function(req, res){
  res.render('main');
});

app.get('/auth', function(req, res){
  var options = {
    host: 'identity.api.rackspacecloud.com',
    port: '80',
    path: '/v1.0',
    method: 'GET',
    headers: {
      'X-Auth-User': 'happyspace',
      'X-Auth-Key': '1b5a100b899c44633dbda1aa93ea6237'
    }
  };
  var R = http.request(options, function(response) {
    var token = null;
    console.log('frackspace');
    response.on('data', function(data) {
      token += data;
      console.log('data?');
    });
    response.on('end', function(thing) {
      console.log(response.res);
      //console.log(response);
      console.log(token);
      console.log('end?');
    });
  });
  R.end();
});

/*app.post('/testAjax', function(req, res){
  console.log('testAJAX');
  console.log(req.body);
  return res.json({ response: 'Test Successful!' });
});*/

app.post('/postImage', function(req, res){
  console.log(req.files.image);
  console.log(req.files.image.path);
  console.log(req.files.image.size);
  console.log(req.files.image.type);
  fs.rename(req.files.image.path, req.files.image.path)
  rackit.add(req.files.image.path, {type: req.files.image.type}, function(err, cloudpath){
    if(err) return;
    console.log('file added');
    console.log(cloudpath);
    var viewUrl = rackit.getURI(cloudpath);
    console.log(rackit.getURI(cloudpath));
    return res.json({ url: viewUrl });
  });
});

app.post('/imgUpload', function(req, res){
  console.log(req.files.image);
  console.log(req.files.image.path);
  console.log(req.files.image.size);
});

app.post('urlUpload', function(req, res){
  console.log('urlUpload');
  rackit.add(imageUrl, function(err, cloudpath){
    if(err) return;
    console.log('file added!');
    console.log('see it here:', rackit.getURI(cloudpath));
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
  console.log('getBucket');
  var objList = [];
  var keys = [];
  mr.listKeys(req.body.bucket, function(results){
    console.log(results.data);
    console.log('listKeys');
    for(k in results.data){
      if(results.data[k].indexOf('-') === -1){
        keys.push(results.data[k]);
      }
    }
    if(keys.length > 0) next();
    else{
      console.log('No '+ req.body.bucket +' in db.');
      return res.json(objList);
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
        console.log('!');
        var clock = 0;
        for(var c = 0; c < conflicted.length; c++){
          (function(d){
            console.log('!!!');
            conflicted[d].save(function(err, saved){
              console.log(err);
              //console.log(saved);
              console.log('conflict resolved');
              util.clearChanges(saved);
              //clear siblings so we can convert to JSON
              saved.siblings = null;
              objList.push(saved);
              if(clock === conflicted.length-1) next2();
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

app.post('/getGroups', function(req, res){
  console.log(req.body);
  console.log(req.body.key+'-groups');
  riak.bucket('users').objects.get(req.body.key+'-groups', function(err, obj){
    if(err && err.status_code === 404){
      console.log(err);
      console.log('not found, creating groups entry now');
      var group_obj = riak.bucket('users').objects.new(err.data, {"Action & Adventure":[]});
      group_obj.save(function(err, saved){
        if(err) return({ error: "Could not create group entry" });
        console.log(saved.data);
        //else return res.json({ groups: saved.data })
      });
      //return res.json({error: "Error: user does not have groups list"});
    }
    console.log(obj);
    return res.json({groups: obj.data});
  });
});

app.post('/getActivity', function(req, res){
  console.log(req.body);
  riak.bucket('users').objects.get(req.body.key+'-activity', function(err, obj){
    if(err && err.status_code === 404){
      console.log('not found');
      return res.json({error: "Error: user does not have an activity list"});
    }
    return res.json({activity: obj.data});
  });
});

app.post('/getIndex', function(req, res){
  console.log(req.body);
  riak.bucket('users').objects.get(req.body.key, function(err, obj){
    return res.json({ username: obj.getIndex('username') });
  });
});

app.post('/deletePending', function(req, res){
  riak.bucket('pendingUsers').object.get(req.body.key, function(err, obj){
    if(err) return res.json({ err: "not found"});
    obj.delete(function(err, deleted){
      if(err) return res.json({ error: "Delete Pending User failed" });
      console.log("Pending User " + req.body.key + " Deleted");
      return res.json({deleted: req.body.key});
    });
  });
});

//resend confirmation email
/*app.post('/resendEmail', function(req, res){
  console.log(req.body);
  mandrill('messages/send', {
      message: {
        to: [{ email: req.body.email }],
        from_email: 'info@quyay.com',
        subject: "Quyay Alpha Access",
        text: "Congratulations, You have been granted access to Quyay Alpha! \n\n" +
        "You can sign in using this email and the temporary password shown below:\n\n" +
        "Temporary Password: " + req.body.pass + " \n\n" +
        "Go to http://www.quyay.com/ and scroll to the bottom of the page to find the 'Sign In' area. \n\n" +
        "Once you have signed in, you can change your password.  " +
        "Click the profile tab in the top right, and select 'Settings'.\n" +
        "From here, type your new password into the 'Change Password' and 'Confirm Changes' input areas, and click 'Save Settings'.\n\n" +
        "Hope to see you soon!\n\n" +
        "-Team Quyay"
      }
    }, function(err, response){
      if(err){
        console.log(JSON.stringify(err));
        return res.json({ error: err });
      }
      else{
        console.log(response);
        return res.json({ email: req.body.email });
      }
    });
  
});*/

//activate a pendingUser, making him a real Quyay user
//generated tmp password, create user, send email, delete pending user
//pending user's params are passed in
app.post('/activatePending', function(req, res){
  console.log(req.body);
  var new_user;
  var tmp_pass;
  var user_key = req.body.email;
  var user_data = {
                email: req.body.email,
                passHash: null,
                username: req.body.name,
                fbConnect: false,
                favCat: [],
                profileImg: null,
                gender: null,
                bio:null,
                dateJoined: util.getDate(),
                posts:[],
                likes:[],
                followers:[],
                following:[],
                changes:{
                  posts: {add:[], remove:[]},
                  likes: {add:[], remove:[]},
                  followers: {add:[], remove:[]},
                  following: {add:[], remove:[]},
                }
    };
  
  //generate tmp password from nodeflake
  util.generateId(function(id){
    temp_pass = id;
    console.log('NODEFLAKE ID, TAKE NOTE:')
    console.log(id);
    user_data.passHash = bcrypt.hashSync(id);
    next();
  });
  //create user (4 step process)
  //create user object
  function next(){
    new_user = riak.bucket('users').objects.new(user_key, user_data);
    new_user.addToIndex('username', user_data.username);
    new_user.save(function(err, saved){
      if(err) return res.json({ error: "create pending error: " + err });
      next2();
    });
  }
  //create user-groups
  function next2(){
    var group_data = {};
    var group_key = user_key + '-groups';
    new_group = riak.bucket('users').objects.new(group_key, group_data);
    new_group.save(function(err, saved){
      if(err) return res.json({ error: "create groups error: " + err });
      next3();
    });
  }
  //create user-activity
  function next3(){
    var activity_data = {evtIds:[]};
    var activity_key = user_key + '-activity';
    var new_activity = riak.bucket('users').objects.new(activity_key, activity_data);
    new_activity.save(function(err, saved){
      if(err) return res.json({ error: "create activity error: " + err });
      next4();
    });
  }
  //create user quick-reference
  function next4(){
    var usr_ref = riak.bucket('userReference').objects.new(user_key, {username: user_data.username,
                                                                      imgUrl: null});
    usr_ref.save(function(err, saved){
      if(err) return res.json({ error: "create activity error: " + err });
      next5();
    });
  }
  //send email
  function next5(){
    mandrill('messages/send', {
      message: {
        to: [{email: user_key}],
        from_email: 'info@quyay.com',
        subject: "Quyay Alpha Access",
        text: "Congratulations, You have been granted access to Quyay Alpha! \n\n" +
        "You can sign in using this email and the temporary password shown below:\n\n" +
        "Temporary Password: " + temp_pass + " \n\n" +
        "Go to http://www.quyay.com/ and scroll to the bottom of the page to find the 'Sign In' area. \n\n" +
        "Once you have signed in, you can change your password.  " +
        "Click the profile tab in the top right, and select 'Settings'.\n" +
        "From here, type your new password into the 'Change Password' and 'Confirm Changes' input areas, and click 'Save Settings'.\n\n" +
        "Hope to see you soon!\n\n" +
        "-Team Quyay"
      }
    }, function(err, response){
      if(err){
        console.log(JSON.stringify(err));
        return res.json({error: err});
      }
      else{
        console.log(response);
        next6();
      }
    });
  }
  //delete pending user
  function next6(){
    //delete pending user
    riak.bucket('pendingUsers').object.get(user_key, function(err, obj){
      if(err) return res.json({error: "delete pendingUser Error: " + err});
      obj.delete(function(err, deleted){
        return res.json({ success: true });
      });
    });
  }
});

app.post('/deleteUser', function(req, res){
  console.log(req.body);
  riak.bucket('users').object.get(req.body.key, function(err, obj){
    if(err) return res.json({ err: "not found"});
    obj.delete(function(err, deleted){
      console.log(req.body.key);
      return res.json({deleted: req.body.key});
    });
  });
  /*riak.bucket('users').object.delete(req.body.key, function(err, obj){
    if(err && err.status_code === 404){
      console.log('not found');
      return res.json({error: "Error: user does not have an activity list"});
    }
    return res.json({deleted: obj.data});
  });*/
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

//query via text
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

app.listen(3003, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});