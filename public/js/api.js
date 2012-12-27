//Return all bucket names
getBuckets = function(){
  var text = '';
  $.ajax({
    type: 'get',
    url: '/getBuckets',
    success: function(data){
      if(data.arr){
        for(bucket in data.arr){
          text += '<button class="'+ data.arr[bucket] +'">'+data.arr[bucket]+'</button>';
        }
        $('.buckets span').html(text);
      }
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
          if(bucketName === 'users'){
            text += '<tr>';
            if(data.arr[bucket].email) text += '<td><a class="id" href="#">'+ data.arr[bucket].email +'</a></td>'; else text += '<td></td>';
            if(data.arr[bucket].name) text += '<td>'+ data.arr[bucket].name +'</td>'; else text += '<td></td>';
            if(data.arr[bucket].fbConnect) text += '<td>'+ data.arr[bucket].fbConnect +'</td>'; else text += '<td></td>';
            if(data.arr[bucket].favCat) text += '<td>'+ data.arr[bucket].favCat +'</td>'; else text += '<td></td>';
            text += '<td><button class="delete">Delete</button><button class="edit">Edit</button></td>';
            text += '</tr>';
          }
          else if(bucketName === 'gamepins'){
            text += '<tr>';
            if(data.arr[bucket].id) text += '<td><a class="id" href="#">'+ data.arr[bucket].id +'</a></td>'; else text += '<td></td>';
            if(data.arr[bucket].poster_id) text += '<td>'+ data.arr[bucket].poster_id +'</td>'; else text += '<td></td>';
            if(data.arr[bucket].category) text += '<td>'+ data.arr[bucket].category +'</td>'; else text += '<td></td>';
            text += '<td><button class="delete">Delete</button><button class="edit">Edit</button></td>';
            text += '</tr>';
          }
          else if(bucketName === 'storepins'){
            text += '<tr>';
            if(data.arr[bucket].id) text += '<td><a class="id" href="#">'+ data.arr[bucket].id +'</a></td>'; else text += '<td></td>';
            if(data.arr[bucket].price) text += '<td>'+ data.arr[bucket].price +'</td>'; else text += '<td></td>';
            if(data.arr[bucket].category) text += '<td>'+ data.arr[bucket].category +'</td>'; else text += '<td></td>';
            text += '<td><button class="delete">Delete</button><button class="edit">Edit</button></td>';
            text += '</tr>';
          }
        }
      }
      $('#object_table').empty();
      switch(bucketName){
        case 'users':
          $('#object_table').append('<tr><th>Email</th><th>Name</th><th>fbConnect</th><th>FavCat</th><th>Options</th><tr>');
          break;
        case 'gamepins':
          $('#object_table').append('<tr><th>ID</th><th>Poster ID</th><th>Category</th><th>Options</th><tr>');
          break;
        case 'storepins':
          $('#object_table').append('<tr><th>ID</th><th>Price</th><th>Category</th><th>Options</th><tr>');
          break;
      }
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
          text += '<td>' + data.arr[key] + '</td>';
          if(count%6 === 0) text += '</tr><tr>';
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
//Delete a Key
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
//Update an entry

//