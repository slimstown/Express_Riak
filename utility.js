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
  for(var s=0; s < siblings.length; s++){
    console.log(siblings[s]);
  }
  console.log('End Siblings');
  var resolved = siblings.pop();
  return resolved;
}
var last_write_wins = exports.last_write_wins = function(siblings){
  console.log('last_write_wins()');
  function siblingLastModifiedSort(a, b) {
    if(!a.metadata.last_modified || new Date(a.metadata.last_modified) < new Date(b.metadata.last_modified)) {
        return 1;
    }
    else {
        return -1;
    }
  }
  siblings.sort(siblingLastModifiedSort);
  return siblings[0];
}

//resolution for conflicting user objects
//we will use last write wins to get the latest sibling
//we will MERGE all sibling's posts
var user_resolve = exports.user_resolve = function(siblings){
  //If called on non user, alert and call default resolver.
  if(!siblings[0].data.passHash){
    console.log('user_resolve called on non user: calling default resolver');
    return last_write_wins(siblings);
  }
  console.log('user_resolve()');
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
  //merge all posts & likes into siblings[0]
  for(var s = 0; s < siblings.length; s++){
    if(s === 0) continue;
    siblings[0].data.posts = siblings[0].data.posts.concat(siblings[s].data.posts);
    siblings[0].data.likes = siblings[0].data.likes.concat(siblings[s].data.likes);
  }
  //enforce uniqueness. Probably unnecesarry and duplicate posting should be prevented from front end.
  siblings[0].data.posts = arrayUnique(siblings[0].data.posts);
  siblings[0].data.likes = arrayUnique(siblings[0].data.likes);
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
  var clock = s;
  for(var i = s; i < n; i++){
    userIds.push('user' + i + '@gmail.com');
    //user schema
    userArray.push(
      { email: 'user' + i + '@gmail.com',
        //passHash: bcrypt.hashSync('user'+i),
        passHash: 'user'+i,
        name: 'user' + i,
        fbConnect: i%2==0 ? true : false,
        favCat: null,
        profileImg: '/images/profile/profile'+i%10+'.png',
        gender: null,
        bio:null,
        dateJoined:null,
        currXP:0,
        nextXP:100,
        level:1,
        posts:[],
        likes:[],
        followers:[],
        following:[],
        friends:[],
        recentActivity:[]
      }
    );
  }
  //set random favorite category
  for(var i = s; i < n; i++){
    (function(i){
      random.getRandomInt(0, 11, function(err, rand) {
        userArray[i].favCat = categories[rand];
        if(i === n-1) next();
      });
    })(i);
  }
  //create new user. If one exists with given key, overwrite it.
  function next(){
    //Returns an array of err objects for users not found, and objs for found users
    app.riak.bucket('users').objects.get(userIds, user_resolve, function(err, objs){
      var sub;
      //if nodiak gives us a single object, convert that into an array with 1 element.
      if(err && Object.prototype.toString.call( err ) !== '[object Array]')
        err = [err];
      //loop through all not found keys and create objects for these
      for(var e = 0; e < err.length; e++){
        if(err[e].status_code === 404){
          sub = err[e].data.substring(err[e].data.indexOf('r') + 1, err[e].data.indexOf('@'));
          key = parseInt(sub, 10);
          var new_usr = app.riak.bucket('users').objects.new(err[e].data, userArray[key]);
          new_usr.save(function(err, saved){
            console.log('User not found. New user created: ');
            console.log(saved.data.email);
          });
        }
      }
      //if nodiak gives us a single object, convert that into an array with 1 element
      if(objs && Object.prototype.toString.call( objs ) !== '[object Array]')
        objs = [objs];
      //loop through all found objects and overwrite them
      for(var o = 0; o < objs.length; o++){
        sub = objs[o].key.substring(objs[o].key.indexOf('r') + 1, objs[o].key.indexOf('@'));
        key = parseInt(sub, 10);
        if(objs[o].siblings) console.log('siblings found and resolved');
        var merge_user = app.riak.bucket('users').objects.new(objs[o].key, userArray[key]);
        merge_user.metadata.vclock = objs[o].metadata.vclock;
        merge_user.save(function(err, saved){
          console.log('User updated');
          console.log(saved.data.email);
        });
      }
    });
  }
}

exports.clearConflicts = function(){
  var pinIds = [];
  for(var i = 0; i < 50; i++){
    pinIds.push(100 + i);
  }
  console.log(pinIds);
  app.riak.bucket('gamepins').objects.get(pinIds, last_write_wins, function(err, objs){
    for(var o = 0; o < objs.length; o++){
      //console.log(objs[o].key);
      var merge_pin = app.riak.bucket('gamepin').objects.new(objs[o].key, {dummy: '1'});
      merge_pin.metadata.vclock = objs[o].metadata.vclock;
      merge_pin.save(function(err, saved){
        console.log(saved.key);
      });
    }
  });
}

//generate n pins. range s to n-1
exports.generatePins = function(s, n){
  var pinArray = [];
  var pinIds = [];
  var clock;
  var user_keys = [];
  
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
    var clock = s;
    for(var i = s; i < n; i++){
      pinIds.push(100 + i);
      //gamepin schema
      pinArray.push(
        { posterId: null,
          repinBy: null,
          category: null,
          content: null,
          sourceUrl: null,
          gameName: null,
          publisher: null,
          description: 'This is pin ' + i,
          datePosted: null,
          groupId: null,
          returnAll: 'y'
        }
      );
    }
    //set random category
    for(var i = s; i < n; i++){
      (function(i){
        random.getRandomInt(0, 11, function(err, rand) {
          pinArray[i].category = categories[rand];
          if(i === n-1) next2();
        });
      })(i);
    }
  }
  //set random posterId
  function next2(){
    clock = s;
    for(var i = s; i < n; i++){
      (function(i){
        random.getRandomInt(0, user_keys.length-1, function(err, rand) {
          pinArray[i].posterId = user_keys[rand];
          if(i === n-1) next3();
        });
      })(i);
    }
  }
  //create new pin.  If one exists with current key, overwrite it.
  function next3(){
    clock = s;
    console.log(pinIds);
    app.riak.bucket('gamepins').objects.get(pinIds, user_resolve, function(err, objs){
      //if nodiak gives us a single object, convert that into an array with 1 element.
      if(err && Object.prototype.toString.call( err ) !== '[object Array]')
        err = [err];
      //loop through all not found keys and create objects for these
      for(var e = 0; e < err.length; e++){
        if(err[e].status_code === 404){
          var new_pin = app.riak.bucket('gamepins').objects.new(err[e].data, pinArray[err[e].data - 100]);
          new_pin.save(function(err, saved){
            console.log('new gamepin created');
            link(saved.data.posterId, saved.key);
          });
        }
      }
      //if nodiak gives us a single object, convert that into an array with 1 element.
      if(objs && Object.prototype.toString.call( objs ) !== '[object Array]')
        objs = [objs];
      //loop through all found objects and overwrite them
      for(var o = 0; o < objs.length; o++){
        var merge_pin = app.riak.bucket('gamepin').objects.new(objs[o].key, pinArray[objs[o].key - 100]);
        merge_pin.metadata.vclock = objs[o].metadata.vclock;
        merge_pin.save(function(err, saved){
          console.log('gamepin updated');
          link(saved.data.posterId, saved.key);
        });
      }
    });
  }
  //fetch owner and add this post to his posts list
  function userLink(ownerId, postId){
    var update_user = app.riak.bucket('users').objects.new(ownerId);
    update_user.fetch(user_resolve, function(err, obj){
      if(obj.siblings) console.log('siblings found and resolved');
      console.log(obj);
      update_user.data.posts.push(postId);
      update_user.save(function(err, saved){
        console.log('link');
      });
    });
  }
}

//adds gamepin to user's posts
var link = exports.link = function(userId, pinId){
  usr = app.riak.bucket('users').objects.new(userId);
  usr.fetch(user_resolve, function(err, obj){
    if(err){
      console.log('err');
      console.log(err);
    }
    console.log('userId: '+userId + ' pinId:' + pinId);
    console.log('before: [' + obj.data.posts + ']');
    //add this pin to the user object
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
  usr.fetch(user_resolve, function(err, obj){
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

var like = exports.like = function(userId, pinId){
  usr = app.riak.bucket('users').objects.new(userId);
  usr.fetch(user_resolve, function(err, obj){
    if(err){
      console.log('err:');
      console.log(err);
    }
    console.log(userId + ' liked pin #'+pinId);
    if(obj.data.likes.indexOf(pinId) === -1)
      obj.data.likes.push(pinId);
    obj.save(function(err, saved){
      console.log('like added: [' +saved.data.likes + ']');
    })
  });
}