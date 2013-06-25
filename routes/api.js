var mr = require('../mapreduce');
var util = require('../utility');
var bcrypt = require('bcrypt-nodejs');
var async = require('async');
var app = require('../app');
var riak = require('../app').riak;
var mandrill = require('../app').mandrill;

console.log(mandrill);

var pinSchema = require('../schema/gamepin');
var userSchema = require('../schema/user');

// If out of date, update and save
// callback(err, user)
function reindexUser(userId, callback){
  //get RObject
  //console.log('reindexUser');
  console.log('fetching '+userId);
  riak.bucket('users').objects.get(userId, function(err, ROuser){
    if(err) return callback(new Error(err.message), null);
    //if out of date, reindex (skip validation checks)
    if(!ROuser.data.version || (ROuser.data.version !== userSchema.userInstance.version)){
      ROuser.data['version'] = userSchema.userInstance.version;
      if(ROuser.data['username']) ROuser.data['userName'] = ROuser.data['username'];
      var new_usr = new userSchema.user(ROuser.data);
      ROuser.data = new_usr;
      ROuser.save(function(err, saved){
        if(err) return callback(new Error(err.messsage), null);
        console.log('user '+userId+' reindexed');
        return callback(null, saved);
      });
    }
    else{
      ROuser.save(function(err, saved){
        if(err) return callback(new Error(err.messsage), null);
        console.log('user '+userId+' reindexed');
        return callback(null, saved);
      });
    }
  });
}

// Update userRef to have correct property names.  Trash the old ones. {username, imgUrl} => {userName, profileImg}
// callback(error)
function reindexUserRef(userId, callback){
  riak.bucket('userReference').objects.get(userId, function(err, usr_ref){
    if(err) callback(new Error(err.message));
    //clean up garbage null values
    if(usr_ref.data.imgUrl === null) delete usr_ref.data.imgUrl;
    if(usr_ref.data.username === null) delete usr_ref.data.username;
    if(usr_ref.data.username){
      usr_ref.data.userName = usr_ref.data.userName || usr_ref.data.username;
      delete usr_ref.data.username;
    }
    if(usr_ref.data.imgUrl){
      usr_ref.data.profileImg = usr_ref.data.profileImg || usr_ref.data.imgUrl;
      delete usr_ref.data.imgUrl;
    }
    usr_ref.save(function(err, saved){
      if(err) return callback(new Error('reindexUserRef error: '+ err.message));
      console.log('userReference '+saved.key+' reindexed');
      return callback(null);
    });
  });
}

var convertUserFlakes = function(){
  console.log('convertFlakes');
  var keys = [];
  var group_keys = [];
  var activity_keys = [];
  //get users - posts - user activity - user groups - 
  mr.listKeys('users', function(results){
    for(k in results.data){
      if(results.data[k].indexOf('-groups') !== -1)
        group_keys.push(results.data[k]);
      else if(results.data[k].indexOf('-activity') !== -1)
        activity_keys.push(results.data[k]);
      else
        keys.push(results.data[k]);
    }
    next();
  });
  
  function next(){
    console.log('next');
    //get users, convert posts to string
    riak.bucket('users').objects.get(keys, function(errs, RO_usrs){
      for(i = 0, len = RO_usrs.length; i < len; i++){
        var posts = RO_usrs[i].data.posts;
        for(j = 0, jlen = posts.length; j < jlen; j++){
          posts[j] = posts[j].toString();
        }
      }
      //save back into DB
      async.each(RO_usrs,
        function(RO_usr, callback){
          RO_usr.save(function(_err, saved){
            if(_err) return callback(_err);
            if(saved.data.posts.length > 0){
              console.log(typeof saved.data.posts[0]);
              return callback(null);
            }
            else return callback(null);
          });
        },
        function(err){
          if(err) console.log('something fucked up');
          else next2();
        }
      );
    });
  }
  function next2(){
    console.log('next2');
    //get user-groups K:user-group V:{group1: [], group2: []}
    riak.bucket('users').objects.get(group_keys, function(errs, RO_groups){
      //console.log(RO_groups);
      for(i = 0, len = RO_groups.length; i < len; i++){
        var groupObj = RO_groups[i].data;
        for(g in groupObj){
          var currGroup = groupObj[g];
          for(c = 0, _len = currGroup.length; c < _len; c++){
            currGroup[c] = currGroup[c].toString();
          }
        }
      }
      //save back into DB
      async.each(RO_groups,
        function(RO_group, callback){
          RO_group.save(function(_err, saved){
            if(_err) return callback(_err);
            if(saved.data['Arcade']){
              console.log(typeof saved.data['Arcade'][0]);
              return callback(null);
            }
            else return callback(null);
          });
        },
        function(err){
          if(err) console.log('something fucked up');
          else next3();
        }
      );
    });
  }
  function next3(){
    console.log('next3');
    ///get user-activity K:user-activity V: {evtIds: []}
    riak.bucket('users').objects.get(activity_keys, function(errs, RO_acts){
      for(i = 0, len = RO_acts.length; i < len; i++){
        var act_evts = RO_acts[i].data.evtIds;
        for(e = 0, _len = act_evts.length; e < _len; e++){
          act_evts[e] = act_evts[e].toString();
        }
      }
      async.each(RO_acts,
        function(RO_act, callback){
          RO_act.save(function(_err, saved){
            if(_err) return callback(_err);
            if(saved.data.evtIds[0]){
              console.log(typeof saved.data.evtIds[0]);
              return callback(null);
            }
            else return callback(null);
          });
        },
        function(err){
          if(err) console.log('something fucked up');
          else next4();
        }
      );
    });
  }
  function next4(){
    console.log('next4');
    console.log('Converted all user nodeflakes to strings');
  }
  //get gamepins - comments
  
  //get comments - pin
}

var convertPinFlakes = function(){
  var keys;
  mr.listKeys('gamepins', function(results){
    console.log(results.data);
    keys = results.data;
    next();
  });
  //get all gampins, if comments, convert comments list to string values
  function next(){
    riak.bucket('gamepins').objects.get(keys, function(err, pin_ROs){
      for(p = 0, len = pin_ROs.length; p < len; p++){
        var comments = pin_ROs[p].data.comments;
        for(c = 0, _len = comments.length; c < _len; c++){
          comments[c] = comments[c].toString();
        }
      }
      async.each(pin_ROs,
        function(pinRO, callback){
          pinRO.save(function(err, saved){
            if(err) return callback(err, null);
            console.log(saved.data.comments);
            return callback(null, saved);
          });
        },
        function(err, results){
          if(err) console.log('something fucked up');
          next2();
        }
      );
    });
  }
  function next2(){
    console.log('gamepin nodeflakes converted to String');
  }
}

var convertCommentFlakes = function(){
  console.log('comment flakes');
    var keys;
  mr.listKeys('comments', function(results){
    //console.log(results.data);
    keys = results.data;
    next();
  });
  function next(){
    riak.bucket('comments').objects.get(keys, function(err, cmt_ROs){
      for(i = 0, len = cmt_ROs.length; i < len; i++){
        cmt_ROs[i].data.pin = cmt_ROs[i].data.pin.toString();
      }
      async.each(cmt_ROs,
        function(cmtRO, callback){
          cmtRO.save(function(_err, saved){
            if(err) return callback(_err, null);
            console.log(saved.data.pin);
            console.log(typeof saved.data.pin);
            return callback(null, saved);
          });
        },
        function(err, results){
          next2();
        }
      );
    });
  }
  function next2(){
    console.log('comment nodeflakes converted to Strings');
  }
}

function reindexGamepin(pinId, callback){
  //get RObject
  console.log('fetching '+pinId);
  riak.bucket('gamepins').objects.get(pinId, function(err, ROpin){
    if(err){
      console.log('Error '+err.message);
      return callback(new Error(err.message), null);
    }
    //if out of date, reindex (skip validation checks)
    if(!ROpin.data.version || (ROpin.data.version !== pinSchema.gamepinInstance.version)){
      ROpin.data['version'] = pinSchema.gamepinInstance.version;
      var new_pin = new pinSchema.gamepin(ROpin.data);
      ROpin.data = new_pin;
      ROpin.save(function(err, saved){
        if(err) return callback(new Error(err.messsage), null);
        console.log('gamepin '+pinId+' reindexed');
        return callback(null, saved);
      });
    }
    else{
      ROpin.save(function(err, saved){
        if(err) return callback(new Error(err.messsage), null);
        console.log('gamepin '+pinId+' reindexed');
        return callback(null, saved);
      });
    }
  });
}

//get and delete KV pair. Generic. Accepts {key: '', bucket: ''}. callback(error)
var get_and_delete = exports.get_and_delete = function(obj, callback){
  riak.bucket(obj.bucket).objects.get(obj.key, function(err, _obj){
    if(err && err.status_code !== 404) return callback(new Error(err.message));
    if(err && err.status_code === 404) return callback(null);
    _obj.delete(function(_err, deleted){
      if(_err) return callback(new Error(err.message));
      return callback(null);
    });
  });
}

module.exports = function(){
  
  app = app.self;
  
  //take a look and see what user emails are in the graveyard
  app.get('/queryGraveyard', function(req, res){
    console.log('querygraveyard');
    var keys = [];
    mr.listKeys('graveyard', function(results){
      for(k in results.data){
        console.log(results.data[k]);
      }
    });
  });
  
  app.get('/deletePendingUsers', function(req, res){
    var keys = [];
    //get all pendingUsers
    mr.listKeys('pendingUsers', function(results){
      for(k in results.data){
        console.log(results.data[k]);
        keys.push(results.data[k]);
      }
      next();
    });
    //fetch and delete them one by one, in series
    function next(){
      async.eachSeries(keys, function(key, callback){
        riak.bucket('pendingUsers').objects.get(key, function(err, usr){
          if(err) return callback(err);
          usr.delete(function(_err, deleted){
            if(_err) return callback(_err);
            console.log('pendingUser '+deleted.key+' deleted!');
            return callback(null);
          });
        });
      },
      function(err){
        if(err) return res.json({ error: 'deletePendingUsers error '+err.message });
        return res.json({ success: 'all pendingUsers cleared!' });
      });
    }
  });
  
  //convertUserFlakes();
  //convertPinFlakes();
  //convertCommentFlakes();
  util.generateId(function(id){
    //console.log(id);
    //console.log(typeof id);
  });
  
  app.get('/indexUserRef', function(req, res){
    var keys;
    console.log('indexUserRef FUCK');
    mr.listKeys('userReference', function(results){
      keys = results.data;
      if(keys.length > 0) next();
      else return res.json({ error: 'no keys specified' });
    });
    function next(){
      async.eachSeries(keys, reindexUserRef, function(err){
        if(err) return res.json({ error: err.message });
        else return res.json({ success: 'all userReferences reindexed' });
      });
    }
  });
  
  app.get('/indexUsers', function(req, res){
    var objList = [];
    var keys = [];
    //list all keys from users, done sequentially to emphasize how slow it will be
    mr.listKeys('users', function(results){
      for(k in results.data){
        if(results.data[k].indexOf('-') === -1){
          keys.push(results.data[k]);
        }
      }
      if(keys.length > 0) next();
      else {
        return res.json(objList);
      }
    });
    //GET and reindex every out of date user
    function next(){
      async.eachSeries(keys, reindexUser, function(err){
        if(err) return res.json({error: err.message});
        else return res.json({ success: 'All users reindexed' });
      });
    }
  });
  app.get('/indexGamepins', function(req, res){
    var objList = [];
    var keys = [];
    mr.listKeys('gamepins', function(results){
      for(k in results.data){
        if(results.data[k].indexOf('-') === -1){
          keys.push(results.data[k]);
        }
      }
      if(keys.length > 0) next();
      else return res.json(objList);
    });
    function next(){
      async.eachSeries(keys, reindexGamepin, function(err){
        if(err) return res.json({error: err.message});
        else return res.json({ success: 'All gamepins reindexed' });
      });
    }
  });
  
  //get all objects in bucket, resolving conflicts along the way
  app.post('/getBucket', function(req, res){
    var objList = [];
    var keys = [];
    //get all keys in bucket
    mr.listKeys(req.body.bucket, function(results){
      for(k in results.data){
        if(results.data[k].indexOf('-') === -1){
          keys.push(results.data[k]);
        }
      }
      if(keys.length > 0) next();
      else {
        return res.json(objList);
      }
    });
    function next(){
      //get objects
      riak.bucket(req.body.bucket).objects.get(keys, function(err, objs){
        if(err){
          console.log('Error:' + err.message);
          return res.json({ error: err.message });
        }
        //if nodiak gives us a single object, convert that into an array with 1 element
        if(objs && Object.prototype.toString.call( objs ) === '[object Object]')
          objs = [objs];
        //Add conflicts to queue to be resolved
        for(var o in objs){
          objList.push({ key: objs[o].key, val: objs[o].data})
        }
        return res.json(objList);
      });
    }
  });
  
  app.post('/getGroups', function(req, res){
    riak.bucket('users').objects.get(req.body.key+'-groups', function(err, obj){
      if(err && err.status_code === 404){
        console.log(err);
        console.log('not found, creating groups entry now');
        var group_obj = riak.bucket('users').objects.new(err.data, {"Action & Adventure":[]});
        group_obj.save(function(err, saved){
          if(err) return({ error: "Could not create group entry" });
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
  
  //activate a pendingUser, making him a real Quyay user
  //generated tmp password, create user, send email, delete pending user
  //pending user's params are passed in
  app.post('/activatePending', function(req, res){
    var new_user;
    var tmp_pass;
    var user_key = req.body.email;
    var user_data = {
                  version: '0.0.2',
                  email: req.body.email,
                  passHash: null,
                  userName: req.body.name,
                  fbConnect: false,
                  favCat: [],
                  profileImg: null,
                  gender: null,
                  bio:null,
                  dateJoined: util.getDate(),
                  posts:[],
                  likes:[],
                  followers:[],
                  following:[]
    };
    
    //generate tmp password from nodeflake
    util.generateId(function(id){
      temp_pass = id;
      user_data.passHash = bcrypt.hashSync(id);
      next();
    });
    //create user (4 step process)
    //create user object
    function next(){
      new_user = riak.bucket('users').objects.new(user_key, user_data);
      new_user.addToIndex('username', user_data.userName);
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
      var usr_ref = riak.bucket('userReference').objects.new(user_key, {userName: user_data.userName,
                                                                        profileImg: null});
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
    if(!req.body.key) return res.json({ error: 'email required to delete user' });
    var email = req.body.key;
    var name;
    
    //check if user exists
    riak.bucket('uses').object.exists(email, function(err, result){
      if(err) return res.json({ error: 'Delete user error: '+result });
      if(result) return res.json({ error: 'User does not exist' });
      else next();
    });
    
    function next(){
      //delete user, user-groups, user-activity, userReference
      async.each(
        [{key: email, bucket: 'users'}, {key: email+'-groups', bucket:'users'}, {key: email+'-activity', bucket:'users'},
        {key: email, bucket: 'userReference' }],
        get_and_delete,
        function(err){
          if(err){
            errlog.info('get_and_delete error: '+err.message);
            return res.json({ error: 'get_and_delete error: '+err.message });
          }
          //add user to graveyard
          else{
            var dead_usr = riak.bucket('graveyard').objects.new(email, {userName: name});
            dead_usr.save(function(_err, obj){
              if(_err){
                errlog.info('save to graveyward failed: '+_err.message)
                return res.json({ error: 'save to graveyard failed: '+_err.message });
              }
              else return res.json({ success: 'delete ' + email + ' success!' });
            });
          }
        }
      );
    }
    
    
    /*riak.bucket('users').object.get(req.body.key, function(err, obj){
      if(err) return res.json({ err: "not found"});
      obj.delete(function(err, deleted){
        if(err) return res.json({ error: "Delete User failed" });
        console.log('deleted ' + deleted.key);
        next();
      });
    });
    function next(){
      riak.bucket('userReference').object.get(req.body.key, function(err, obj){
        if(err) return res.json({ err: "not found"});
        obj.delete(function(err, deleted){
          if(err) return res.json({ error: "Delete User failed" });
          console.log('deleted ' + deleted.key);
          return res.json({deleted: req.body.key});
        });
      });
    }*/
  });
}