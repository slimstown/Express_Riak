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

//Refresh view of bucket
getBucket = function(bucketName){
  var text = '';
  $.ajax({
    type: 'post',
    url: '/getBucket',
    data: 'bucket='+bucketName,
    success: function(data){
      if(data.error){
        console.log(data.error.message);
        return;
      }
      if(data){
        for(obj in data){
          if(bucketName === 'users'){
            text += '<tr>';
            //TODO FINISH testing / filling this in
            if(data[obj].key) text += '<td><a class="id" href="#">'+ data[obj].key +'</a></td>'; else text += '<td></td>';
            if(data[obj].data.name) text += '<td>'+ data[obj].data.name +'</td>'; else text += '<td></td>';
            if(data[obj].data.fbConnect) text += '<td>'+ data[obj].data.fbConnect +'</td>'; else text += '<td></td>';
            if(data[obj].data.favCat) text += '<td>'+ data[obj].data.favCat +'</td>'; else text += '<td></td>';
            if(data[obj].data.posts.length > 0) text += '<td>'+ data[obj].data.posts + ' ('+ data[obj].data.posts.length+ ')' +'</td>'; else text += '<td></td>';
            if(data[obj].data.likes.length > 0) text += '<td>'+ data[obj].data.likes + ' ('+ data[obj].data.likes.length+ ')' +'</td>'; else text += '<td></td>';
            text += '<td><button class="delete">Delete</button><button class="edit">Edit</button></td>';
            text += '</tr>';
          }
          else if(bucketName === 'gamepins'){
            text += '<tr>';
            if(data[obj].key) text += '<td><a class="id" href="#">'+ data[obj].key +'</a></td>'; else text += '<td></td>';
            if(data[obj].data.posterId) text += '<td>'+ data[obj].data.posterId +'</td>'; else text += '<td></td>';
            if(data[obj].data.category) text += '<td>'+ data[obj].data.category +'</td>'; else text += '<td></td>';
            if(data[obj].data.description) text += '<td>'+ data[obj].data.description +'</td>'; else text += '<td></td>';
            if(data[obj].data.likedBy.length > 0) text += '<td>'+ data[obj].data.likedBy +'</td>'; else text += '<td></td>';
            text += '<td><button class="delete">Delete</button><button class="edit">Edit</button></td>';
            text += '</tr>';
          }
          else if(bucketName === 'storepins'){
            text += '<tr>';
            if(data[obj].key) text += '<td><a class="id" href="#">'+ data[obj].key +'</a></td>'; else text += '<td></td>';
            if(data[obj].data.price) text += '<td>'+ data[obj].data.price +'</td>'; else text += '<td></td>';
            if(data[obj].data.category) text += '<td>'+ data[obj].data.category +'</td>'; else text += '<td></td>';
            text += '<td><button class="delete">Delete</button><button class="edit">Edit</button></td>';
            text += '</tr>';
          }
        }
      }
      $('#object_table').empty();
      switch(bucketName){
        case 'users':
          $('#object_table').append('<tr><th>Email</th><th>Name</th><th>fbConnect</th><th>FavCat</th><th>Posts</th><th>Likes</th><th>Options</th><tr>');
          break;
        case 'gamepins':
          $('#object_table').append('<tr><th>ID</th><th>Poster ID</th><th>Category</th><th>Description</th><th>likedBy</th><th>Options</th><tr>');
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