//Return all bucket names
getBuckets = function(){
  var text = '';
  $.ajax({
    type: 'get',
    url: '/getBuckets',
    success: function(data){
      if(data.arr){
        for(bucket in data.arr){
          text += data.arr[bucket];
        }
      }
      $('.buckets span').html('<button class="'+ text +'">'+text+'</button>');
    },
    error: function(data){
      console.log('error');
    }
  });
}

//Return all objects of given bucket
getBucket = function(bucketName){
  var text = '';
  $.ajax({
    type: 'post',
    url: '/getBucket',
    data: 'bucket='+bucketName,
    success: function(data){
      if(data.arr){
        for(bucket in data.arr){
          text += '<tr>';
          if(data.arr[bucket].email) text += '<td>'+ data.arr[bucket].email +'</td>'; else text += '<td></td>';
          if(data.arr[bucket].name) text += '<td>'+ data.arr[bucket].name +'</td>'; else text += '<td></td>';
          if(data.arr[bucket].passHash) text += '<td>'+ data.arr[bucket].passHash +'</td>'; else text += '<td></td>';
          if(data.arr[bucket].fbConnect) text += '<td>'+ data.arr[bucket].fbConnect +'</td>'; else text += '<td></td>';
          if(data.arr[bucket].favCat) text += '<td>'+ data.arr[bucket].favCat +'</td>'; else text += '<td></td>';
          text += '</tr>';
        }
      }
      $('#object_table').empty();
      $('#object_table').append('<tr><th>Email</th><th>Name</th><th>Hash</th><th>fbConnect</th><th>FavCat</th><tr>');
      $('#object_table').append(text);
    },
    error: function(data){
      console.log('error');
    }
  });
}

//Return array of all keys given bucket
getKeys = function(bucketName){
  var text = '';
  $.ajax({
    type: 'post',
    url: '/getKeys',
    data: 'bucket='+bucketName,
    success: function(data){
      var count = 0;
      if(data.arr){
        text += '<tr>';
        for(key in data.arr){
          count++;
          text += '<td>' + data.arr[key] + '<td/>';
          if(count%4 === 0) text += '</tr><tr>';
        }
        text += '</tr>';
      }
      $('.keys').html(text);
    },
    error: function(data){
      console.log('error');
    }
  });
}
deleteKey = function(bucketName, keyName){
  $.ajax({
    type: 'post',
    url: '/delete',
    data: 'bucket='+bucketName+'&key='+keyName,
    success: function(data){
      if(data.deleted);
    }
  });
}