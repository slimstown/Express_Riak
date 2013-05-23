/*  Schema for user objs:
 *  user
 *    user-group
 *    user-activity
 *  userReference
 *  pendingUser
 *
 *  user-group and user-activity currently reside in the users bucket, and can be considered extentions of that schema
 *  they are not currently changeable
 */

var util = require('../utility');
var E = require('../customErrors');

//Constructs a new user object.  Accepts no args, or one arg containing data
var user = function user(userInput){
  //set userInput to empty if no args
  if(Object.keys(arguments).length === 0) userInput = {};
  
  //console.trace('NEW USER');
  
  // Set object's properties to userInput if declared, else set them to default values
  this.version = userInput.version       || '0.0.3';
  this.email = userInput.email           || null;           //required, email regex, 5 < chars < 50,... TODO: More validations
  this.passHash = userInput.passHash     || null;           //required, 
  this.userName = userInput.userName     || null;           //required
  this.fbConnect = userInput.fbConnect   || false;
  this.favCat = userInput.favCat         || null;
  this.profileImg = userInput.profileImg || null;
  this.gender = userInput.gender         || null;
  this.bio = userInput.bio               || null;
  this.dateJoined = userInput.dateJoined || util.getDate(); //required
  this.posts = userInput.posts           || [];
  this.likes = userInput.likes           || [];
  this.followers = userInput.followers   || [];
  this.following = userInput.following   || [];
  
  this.timelineEvents = userInput.timelineEvents || [];
  this.userEvents = userInput.userEvents || [];
  this.pinEvents = userInput.pinEvents   || [];
}

//validate a user argument
user.prototype.validate = function(){
  //validate user input
  if(!this.email) return new E.InvalidError('user email missing');
  if(!this.userName) return new E.InvalidError('user name missing');
  if(!this.dateJoined) return new E.InvalidError('user date joined missing');
  
  //TODO: Logical / Data driven validations
  return false;
}

//use this blank user instance to compare to others
var userInstance = new user();

//export public members
module.exports = {
  user: user,
  userInstance: userInstance,
}