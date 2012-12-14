// This computer IP: 10.0.1.22

var express = require('express');
var app = express();

//db and session setup
var RedisStore = require('connect-redis')(express);
var db = require('riak-js').getClient({host: "localhost", port: "8098"});

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(express.cookieParser());
  app.use(express.session({ secret: "keyboard cat", store: new RedisStore}));
});

app.get('/', function(req, res){
  var sess = req.session;
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
  //res.redirect('/');
  //res.json({'post login'});
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
  console.log(req.body);
  //if count doesn't exist, add it starting at 0
  db.exists('users', 'user_count', function(err, exists){
    console.log('Exists: ' + exists);
    if(!exists){
      db.save('users', 'user_count', {user_count: 0}, {returnbody: true }, function(err, data){
        console.log('user_count initialized at: ');
        console.log(data);
        next();
      });
    }
    else
      next();
  });
  //If valid, increment count & continue
  function next(){
    //validate form data
    
    //increment count
    db.get('users', 'user_count', function(err, data){
      count = data.user_count + 1;
      console.log('Count = ' + count);
      db.save('users', 'user_count', {user_count: count}, function(err, data){
        next_2();
      });
    });
  }
  //Finally, save user object using username as key
  function next_2(){
    db.save('users', req.body.userName, {name: req.body.userName, password: req.body.userPass },
            {returnbody: true}, function(err, data){
      console.log('User saved: ');
      console.log(data);
      return res.json(JSON.stringify(data));
    });
  }
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
function getKeys(bucketName, callback){
  var keyArray = [];
  //get event listener which has 'keys' and 'end' event
  var event2 = db.keys(bucketName);
  var func = event2.on('keys', getKey).start();
  var func2 = event2.on('end', end).start();
  function getKey(data){
    var prop;
    for(prop in data){
      if(data.hasOwnProperty(prop)){
        keyArray.push([data[prop]]);
      }
    }
  }
  function end(data){
    return callback(keyArray);
  }
}

app.listen(3002, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});