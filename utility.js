var app = require('./app.js');
var random = require('secure_random');
var bcrypt = require('bcrypt-nodejs');
var mr = require('./mapreduce');

// need this to unforce uniqueness, consider replacing with nodejs set:
// https://github.com/PeterScott/simplesets-nodejs
function arrayUnique(array) {
    var a = array.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j, 1);
        }
    }
    return a;
};

//conflict resolution
var stupid_resolve = exports.stupid_resolve = function(siblings){
  console.log('stupid resolve');
  for(s in siblings){
    console.log(siblings[s]);
  }
  console.log('End Siblings');
  var resolved = siblings.pop();
  return resolved;
}
//resolution for conflicting user objects
//we will use last write wins to get the latest sibling
//we will MERGE all sibling's posts
var user_resolve = exports.user_resolve = function(siblings){
  console.log('user resolve');
  function siblingLastModifiedSort(a, b) {
    if(!a.metadata.last_modified || new Date(a.metadata.last_modified) < new Date(b.metadata.last_modified)) {
        return 1;
    }
    else {
        return -1;
    }
  }
  //sort by timestamp to get last written user at siblings[0]
  siblings.sort(siblingLastModifiedSort);
  //merge all posts into siblings[0]
  for(var s = 0; s < siblings.length; s++){
    if(s === 0) continue;
    siblings[0].data.posts = siblings[0].data.posts.concat(siblings[s].data.posts);
  }
  siblings[0].data.posts = arrayUnique(siblings[0].data.posts);
  return siblings[0];
}

//12 categories
var categories = ['Casino', 'Casual', 'Shooter', 'Action',
                  'Simulation', 'Racing', 'Puzzle', 'Fighting',
                  'Social', 'Space', 'Horror', 'Strategy'];

//generate n users. Range s to n-1.
exports.generateUsers = function(s, n){
  var userArray = [];
  var userIds = [];
  var clock = 0;
  for(var i = s; i < n; i++){
    userIds.push('user' + i + '@gmail.com');
    userArray.push(
      { email: 'user' + i + '@gmail.com',
        //passHash: bcrypt.hashSync('user'+i),
        passHash: 'user'+i,
        name: 'user' + i,
        fbConnect: i%2==0 ? true : false,
        favCat: null,
        profileImg: '/images/profile/profile'+i%10+'.png',
        posts:[]
      }
    );
  }
  //set random favorite category
  for(var i = s; i < n; i++){
    random.getRandomInt(0, 11, function(err, rand) {
      userArray[clock].favCat = categories[rand];
      clock++;
      if(clock === n) next();
    });
  }
  //create new user. If one exists with given key, overwrite it.
  function next(){
    //Returns an array of err objects for users not found, and objs for found users
    app.riak.bucket('users').objects.get(userIds, stupid_resolve, function(err, objs){
      var s;
      //if nodiak gives us a single object, convert that into an array with 1 element.
      if(err && Object.prototype.toString.call( err ) !== '[object Array]')
        err = [err];
      //loop through all not found keys and create objects for these
      for(var e in err){
        if(err[e].status_code === 404){
          s = err[e].data.substring(err[e].data.indexOf('r') + 1, err[e].data.indexOf('@'));
          key = parseInt(s, 10);
          console.log(key);
          var new_usr = app.riak.bucket('users').objects.new(err[e].data, userArray[key]);
          new_usr.save(function(err, saved){
            console.log('User not found. New user created: ');
            console.log(saved.data);
          });
        }
      }
      //if nodiak gives us a single object, convert that into an array with 1 element
      if(objs && Object.prototype.toString.call( objs ) !== '[object Array]')
        objs = [objs];
      //loop through all found objects and overwrite them
      for(o in objs){
        s = objs[o].key.substring(objs[o].key.indexOf('r') + 1, objs[o].key.indexOf('@'));
        key = parseInt(s, 10);
        if(objs[o].siblings) console.log('siblings found and resolved');
        var merge_user = app.riak.bucket('users').objects.new(objs[o].key, userArray[key]);
        merge_user.metadata.vclock = objs[o].metadata.vclock;
        merge_user.save(function(err, saved){
          console.log('User updated');
        });
      }
    });
  }
}

//generate n pins posted by random owners
exports.generatePins = function(n){
  pinArray = [];
  pinIds = [];
  clock = 0;
  user_keys = [];
  
  //get user keys
  mr.listKeys('users', function(results){
    user_keys = results.data;
    if(user_keys.length > 0) next();
    else{
      console.log('No users in db. Unable to generate pins without owners.');
      return 0;
    }
  });
  function next(){
    var clock = 0;
    for(var i = 0; i < n; i++){
      pinIds.push(100 + i);
      pinArray.push(
        { posterId: null,
          category: null,
          description: 'This is pin ' + i,
          returnAll: 'y'
        }
      );
      
    }
    //set random category
    for(var i = 0; i < n; i++){
      random.getRandomInt(0, 11, function(err, rand){
        pinArray[clock].category = categories[rand];
        clock++;
        if(clock === n) next2();
      });
    }
  }
  //set random posterId
  function next2(){
    clock = 0;
    for(var i = 0; i < n; i++){
      random.getRandomInt(0, user_keys.length-1, function(err, rand) {
        pinArray[clock].posterId = user_keys[rand];
        clock++;
        if(clock === n) next3();
      });
    }
  }
  //create new pin.  If one exists with current key, overwrite it.
  function next3(){
    clock = 0;
    console.log(pinIds);
    app.riak.bucket('gamepins').objects.get(pinIds, stupid_resolve, function(err, objs){
      var s;
      //if nodiak gives us a single object, convert that into an array with 1 element.
      if(err && Object.prototype.toString.call( err ) !== '[object Array]')
        err = [err];
      //loop through all not found keys and create objects for these
      for(var e in err){
        console.log(err[e]);
        if(err[e].status_code === 404){
          var new_pin = app.riak.bucket('gamepins').objects.new(err[e].data, pinArray[err[e].data - 100]);
          new_pin.save(function(err, saved){
            console.log('new gamepin created');
            console.log(saved.key);
            console.log(saved.data.posterId);
            link(saved.data.posterId, saved.key);
          });
        }
      }
      //if nodiak gives us a single object, convert that into an array with 1 element.
      if(objs && Object.prototype.toString.call( objs ) !== '[object Array]')
        objs = [objs];
      //loop through all found objects and overwrite them
      for(var o in objs){
        var merge_pin = app.riak.bucket('gamepin').objects.new(objs[o].key, pinArray[objs[o].key - 100]);
        merge_pin.metadata.vclock = objs[o].metadata.vclock;
        merge_pin.save(function(err, saved){
          console.log('gamepin updated');
          console.log(saved.key);
          console.log(saved.data.posterId);
          link(saved.data.posterId, saved.key);
        });
      }
    });
    /*app.riak.bucket('gamepins').objects.get(pinIds).stream(stupid_resolve, function(results){
      results.on('data', function(obj){
        if(obj.siblings) console.log('siblings found and resolved');
        var merge_pin = app.riak.bucket('gamepins').objects.new(obj.key, pinArray[clock]);
        clock++;
        merge_pin.metadata.vclock = obj.metadata.vclock;
        merge_pin.save(function(err, saved){
          console.log('gamepin updated:');
          userLink(saved.data.posterId, saved.key);
        });
      });
      results.on('error', function(err){
        if(err.status_code === 404){
          var new_pin = app.riak.bucket('gamepins').objects.new(err.data, pinArray[clock]);
          clock++;
          new_pin.save(function(err, saved){
            console.log('Gamepin not found, new gamepin created:');
            userLink(saved.data.posterId, saved.key);
          });
        }
      });
      results.on('end', function(){
      });
    });*/
  }
  //fetch owner and add this post to his posts list
  function userLink(ownerId, postId){
    var update_user = app.riak.bucket('users').objects.new(ownerId);
    update_user.fetch(stupid_resolve, function(err, obj){
      if(obj.siblings) console.log('siblings found and resolved');
      console.log(obj);
      //console.log(update_user);
      update_user.data.posts.push(postId);
      update_user.save(function(err, saved){
        console.log('user posts updated');
        console.log(saved.data.posts);
      });
    });
  }
}

//adds gamepin to user's posts
var link = exports.link = function(userId, pinId){
  console.log(userId);
  console.log(pinId);
  usr = app.riak.bucket('users').objects.new(userId);
  usr.fetch(stupid_resolve, function(err, obj){
    if(err){
      console.log('err');
      console.log(err);
    }
    console.log('userId: '+userId + ' pinId:' + pinId);
    console.log('before: [' + obj.data.posts + ']');
    if(obj.data.posts.indexOf(pinId) === -1){
      obj.data.posts.push(pinId);
      console.log('happening');
    }
    obj.save(function(err, saved){
      console.log('after: [' +saved.data.posts + ']');
      console.log('linked '+ pinId + 'to ' + userId);
    });
  });
}
//clear all posts from a user
var clearLinks = exports.clearLinks = function(userId){
  usr = app.riak.bucket('users').objects.new(userId);
  usr.fetch(stupid_resolve, function(err, obj){
    obj.data.posts = [];
    obj.save(function(err, saved){
      console.log('after: [' +saved.data.posts + ']');
    });
  });
}

//read and resolve siblings for a single object
var readAndResolve = exports.readAndResolve = function(userId){
  usr = app.riak.bucket('users').objects.new(userId);
  usr.fetch(user_resolve, function(err, obj){
    obj.save(function(err, saved){
      console.log(saved);
    });
  });
}