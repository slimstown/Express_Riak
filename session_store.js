(function() {
  var SessionStore, Store;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  Store = require('express').session.Store;
  Store.prototype.constructor = Store;
  SessionStore = (function() {
    __extends(SessionStore, Store);
    function SessionStore(options) {
      SessionStore.__super__.constructor.call(this, options);
      this.client = options.client;
      this.bucket = options.bucket || '_sessions';
    }
    SessionStore.prototype.set = function(sid, sess, cb) {
      return this.client.save(this.bucket, encodeURIComponent(sid), sess, cb);
    };
    SessionStore.prototype.get = function(sid, cb) {
      return this.client.get(this.bucket, encodeURIComponent(sid), function(err, data, meta) {
        if (err != null) {
          if (cb) {
            return cb(err, null);
          }
        } else {
          if (cb) {
            return cb(null, data);
          }
        }
      });
    };
    SessionStore.prototype.destroy = function(sid, cb) {
      return this.client.remove(this.bucket, sid, cb);
    };
    SessionStore.prototype.all = function(cb) {
      return this.client.getAll(this.bucket, function(err, sessions) {
        if (err) {
          if (cb) {
            return cb(err, null);
          }
        } else {
          if (cb) {
            return cb(null, sessions.map(function(i) {
              return i.data;
            }));
          }
        }
      });
    };
    SessionStore.prototype.length = function(cb) {
      return this.client.count(this.bucket, cb);
    };
    return SessionStore;
  })();
  module.exports = SessionStore;
}).call(this);