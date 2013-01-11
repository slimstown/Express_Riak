var app = require('./app.js')

exports.listObjects = function(bucket){
  console.log('List all objects in this bucket!');
  app.riak.mapred.inputs(bucket)
    .map({
        language: 'erlang',
        module: 'riak_mapreduce_utils',
        function: 'map_id' })

    .execute(function(err, results) {
        if(!err) console.log(results);
    }
  );
}

exports.listKeys = function(bucket){
  console.log('List all objects in this bucket!');
  app.riak.mapred.inputs(bucket)
    .map({
        language: 'erlang',
        module: 'riak_mapreduce_utils',
        function: 'map_key' })

    .execute(function(err, results) {
        if(!err) console.log(results);
    }
  );
}

exports.deleteObjects = function(bucket){
  console.log('Delete all objects in this bucket');
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
        if(!err) console.log(results);
    }
  );
}