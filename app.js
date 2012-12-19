var express = require('express');
var app = express();

//db and session setup
var RedisStore = require('connect-redis')(express);
var db = require('riak-js').getClient({host: "10.0.1.49", port: "8098"});

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(express.cookieParser());
  app.use(express.session({ secret: "keyboard cat", store: new RedisStore}));
});
/* AJAX API */
app.post('/delete', function(req, res){
  db.remove(req.body.bucket, req.body.key, function(err, data){
    return res.json({
      deleted: true
    });
  })
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
app.post('/getBucket', function(req, res){
  var result = {arr: []};
  db.getAll(req.body.bucket , function(err, objArray, meta){
    for(obj in objArray){
      result.arr.push(objArray[obj]);
    }
    return res.json(result);
  });
});
//return array of all keys given bucket
app.post('/getKeys', function(req, res){
  var result = {arr: []};
  getKeys(req.body.bucket, function(keyArr){
    for(key in keyArr){
      result.arr.push(keyArr[key]);
    }
    return res.json(result);
  });
});

app.get('/', function(req, res){
  var sess = req.session;
  // get objects in selected bucket
  
  res.render('main');
});
app.get('/login', function(req, res){
  var html = '';
  html += '<form method="post" action="/login" >' +
  'Name<input type="text" name="username"></input><br />' +
  'Password<input type="text" name="password"></input><br />' +
  '<input type="Submit" value="Submit"></form>';
  res.send(html);
});
app.post('/login', function(req, res){
  //check db for user and log in if exists
  console.log(req.body);
  db.exists('users', req.body.userName, function(err, exists){
    if(!exists){
      return res.json({response: "User not found"});
    }
    console.log(req.body.userName);
    db.get('users', req.body.userName, function(err, user){
      console.log(user);
      if(req.body.userPass !== user.password){
        return res.json({response: "Wrong Password"});
      }
      req.session.loggedIn = true;
      req.session.userName = user.username;
      return res.json({response: "Login Success", user: req.session.userName});
    });
  });
});
app.get('/logout', function(req, res){
  req.session.destroy();
  res.redirect('/');
});
//register user
app.get('/register', function(req, res){
  var html = '';
  html += '<form method="post" action="/register" >' +
  'Name<input type="text" name="username"></input><br />' +
  'Password<input type="text" name="password"></input><br />' +
  '<input type="Submit" value="Submit"></form>';
  res.send(html);
});
app.post('/register', function(req, res){
  var count = null;
  var newUser = req.body;
  console.log('email:' + newUser.userEmail);
  console.log(newUser);
  db.save('users', newUser.userEmail, newUser, {returnbody: true}, function(err, data){
    console.log(data);
    console.log('saved into DB');
    return res.json(data);
  });
});

app.get('/dbData', function(req,res){
  var html;
  //db.getAll('users', function(err, data){
  //  console.log(data);
  //  html += data;
    db.get('users', 'user_count', function(err, data){
      html += data;
      res.send(JSON.stringify(data));
    });
  //});
});

app.get('/clearUsers', function(req, res){
  db.remove('users', '', function(err, data){
    console.log(data);
    res.send(data);
  });
});
app.get('/getKeys', function(req, res){
  var event2 = db.keys('users');
  var func = event2.on('keys', test
  );
  function test(data){
    var prop;
    for(prop in data){
      if(data.hasOwnProperty(prop)){
        console.log(data[prop]);
      }
    }
  }
  func.start();
});
app.get('/viewBucket', function(req, res){
  var dataStr = '';
  
  db.getAll('users', function(err, objArray, meta){
    res.send(dataStr);
  })
});
app.get('/buckets', function(req, res){
  db.buckets(function(err, buckets, meta){
    console.log(buckets);
    console.log(meta);
    res.send('buckets');
  });
});

app.get('/clearBucket', function(req, res){
  clearBucket('users');
  res.send('users bucket cleared');
});

//clears bucket of all keys
function clearBucket(bucketName){
  getKeys(bucketName, function(keys){
    for(key in keys){
      if(keys.hasOwnProperty(key)){
        console.log(keys[key] + " removed from " + bucketName);
        db.remove(bucketName, keys[key]);
      }
    }
    return true;
  });
}

//get keys and return array into callback
//key stream can return duplicates of key, so enforce unique set rules
function getKeys(bucketName, callback){
  var keyArray = [];
  var set = {};
  //get event listener which has 'keys' and 'end' event
  var event2 = db.keys(bucketName);
  var func = event2.on('keys', getKey).start();
  var func2 = event2.on('end', end).start();
  function getKey(data){
    var prop;
    for(prop in data){
      if(data.hasOwnProperty(prop)){
        set[data[prop]] = 1;
      }
    }
  }
  function end(data){
    for(key in set){
      keyArray.push(key);
    }
    return callback(keyArray);
  }
}

app.listen(3002, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});