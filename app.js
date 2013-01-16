var express = require('express');
var app = express();

//db and session setup
var RedisStore = require('connect-redis')(express);
var db = require('riak-js').getClient({host: "10.0.1.49", port: "8100"});

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(express.cookieParser());
});
/* AJAX API */
//delete key & corresponding data
app.post('/delete', function(req, res){
  db.remove(req.body.bucket, req.body.key, function(err, data){
    return res.json({
      deleted: true
    });
  });
});
app.post('/delete_all', function(req, res){
  getKeys(req.body.bucket, function(keyArr){
    for(key in keyArr){
      db.remove(req.body.bucket, keyArr[key]);
    }
    return res.json({ success: true });
  });
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

function dostuff(){
  console.log('dostuff');
  //for (var i = 0; i < 5; i++) {
    db.get('tweets', '41399579391950848',function(error, object, meta) {
      db.save('tweets', '41399579391950848', object);
      console.log(meta.vclock);
    });
  //}
}

app.get('/', function(req, res){
  res.render('main');
  dostuff();
});

//add User
app.post('/register', function(req, res){
  var count = null;
  var newUser = req.body;
  db.save('users', newUser.email, newUser, {returnbody: true}, function(err, data){
    return res.json(data);
  });
  return res.json({success: true});
});
//add gamepin
app.post('/postGamePin', function(req, res){
  var count = null;
  var newObj = req.body;
  console.log(req.body);
  db.save('gamepins', '', newObj, {returnbody: true}, function(err, data, meta){
    console.log(data);
    console.log(data.id);
    console.log(meta.key);
    data.id = meta.key;
    db.save('gamepins', data.id, data, {returnbody: true}, function(err, data){
      console.log(data);
      console.log('saved');
      return res.json({success: true});
    });
  });
});
//add storepin
app.post('/postStorePin', function(req, res){
  var count = null;
  var newObj = req.body;
  db.save('storepins', '', newObj, {returnbody: true}, function(err, data, meta){
    data.id = meta.key;
    db.save('storepins', data.id, data, {returnbody: true}, function(err, data){
      console.log(data);
      console.log('saved');
      return res.json({success: true});
    });
  });
});

//clears bucket of all keyse
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