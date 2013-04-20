/* Here lies javascript routines that call useful mapreduce functions */

var app = require('./app.js');

exports.listObjects = function(bucket, callback){
  app.riak.mapred.inputs(bucket)
    .map({
        language: 'erlang',
        module: 'riak_mapreduce_utils',
        function: 'map_id' })

    .execute(function(err, results) {
        if(!err){
          if(callback) callback();
        }
        else if(err){
          console.log('mapreduce error1');
        }
    }
  );
}

exports.listKeys = function(bucket, callback){
  app.riak.mapred.inputs(bucket)
    .map({
        language: 'erlang',
        module: 'riak_mapreduce_utils',
        function: 'map_key' })

    .execute(function(err, results) {
        if(!err){
          callback(results);
        }
        else if(err){
          console.log('mapreduce error2');
          console.log(err);
        }
    }
  );
}

exports.deleteObjects = function(bucket, callback){
  app.riak.mapred.inputs(bucket)
    .map({
        language: 'erlang',
        module: 'riak_mapreduce_utils',
        function: 'map_delete',
        keep: false })
    
    .reduce({
        language: 'erlang',
        module: 'riak_kv_mapreduce',
        function: 'reduce_sum'}) 
    
    .execute(function(err, results) {
        if(!err){
          console.log(results);
          if(callback) callback();
        }
        if(err){
          console.log('mapreduce error');
          console.log(err);
        }
    }
  );
}