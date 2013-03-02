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
            if(data[obj].data.username) text += '<td>'+ data[obj].data.username +'</td>'; else text += '<td></td>';
            if(data[obj].data.fbConnect) text += '<td>'+ data[obj].data.fbConnect +'</td>'; else text += '<td></td>';
            if(data[obj].data.favCat.length > 0){
              text += '<td><select>';
              for(c in data[obj].data.favCat){
                text += '<option>' + data[obj].data.favCat[c] + '</option>';
              }
              text += '</select></td>';
            }
            else text += '<td></td>';
            if(data[obj].data.posts.length > 0){
              text += '<td><select>';
              for(p in data[obj].data.posts){
                text += '<option>' + data[obj].data.posts[p] + '</option>';
              }
              text += '</select><span>' + ' ('+ data[obj].data.posts.length+ ')' + '<span></td>';
            }
            else text += '<td></td>';
            if(data[obj].data.likes.length > 0) text += '<td>'+ data[obj].data.likes + ' ('+ data[obj].data.likes.length+ ')' +'</td>'; else text += '<td></td>';
            if(data[obj].data.followers.length > 0) text += '<td>'+ data[obj].data.followers + '</td>'; else text += '<td></td>';
            if(data[obj].data.following.length > 0) text += '<td>'+ data[obj].data.following + '</td>'; else text += '<td></td>';
            text += '<td><button class="user_groups">groups</button><button class="user_activity">activity</button></td>';
            text += '<td><button class="user_delete">delete</button><button class="user_index">index</button></td>';
            text += '</tr>';
          }
          else if(bucketName === 'gamepins'){
            text += '<tr>';
            if(data[obj].key) text += '<td><a class="id" href="#">'+ data[obj].key +'</a></td>'; else text += '<td></td>';
            if(data[obj].data.posterId) text += '<td>'+ data[obj].data.posterId +'</td>'; else text += '<td></td>';
            if(data[obj].data.category) text += '<td>'+ data[obj].data.category +'</td>'; else text += '<td></td>';
            if(data[obj].data.description) text += '<td>'+ data[obj].data.description +'</td>'; else text += '<td></td>';
            if(data[obj].data.likedBy.length > 0) text += '<td>'+ data[obj].data.likedBy +'</td>'; else text += '<td></td>';
            if(data[obj].data.comments.length > 0){
              text += '<td><select>';
              for(c in data[obj].data.comments){
                text += '<option>' + data[obj].data.comments[c] + '</option>';
              }
              text += '</select></td>';
            }
            else{
              text += '<td></td>';
            }
            text += '</tr>';
          }
          else if(bucketName === 'comments'){
            text += '<tr>';
            if(data[obj].key) text += '<td><a class="id" href="#">'+ data[obj].key +'</a></td>'; else text += '<td></td>';
            if(data[obj].data.pin) text += '<td>'+ data[obj].data.pin +'</td>'; else text += '<td></td>';
            if(data[obj].data.poster) text += '<td>'+ data[obj].data.poster +'</td>'; else text += '<td></td>';
            if(data[obj].data.content) text += '<td>'+ data[obj].data.content +'</td>'; else text += '<td></td>';
            text += '</tr>';
          }
          else if(bucketName === 'userReference'){
            text += '<tr>';
            if(data[obj].key) text += '<td>' + data[obj].key + '</td>'; else text += '<td></td>';
            if(data[obj].data.username) text += '<td>' + data[obj].data.username + '</td>'; else text += '<td></td>';
            text += '</tr>';
            console.log(data[obj]);
            console.log('userReference');
          }
        }
      }
      $('#object_table').empty();
      switch(bucketName){
        case 'users':
          $('#object_table').append('<tr><th>Email</th><th>Username</th><th>fbConnect</th><th>FavCat</th><th>Posts</th><th>Likes</th>' +
                                    '<th>Followers</th><th>Following</th><th>GetData</th><th>Actions</th><tr>');
          break;
        case 'gamepins':
          $('#object_table').append('<tr><th>ID</th><th>Poster ID</th><th>Category</th><th>Description</th><th>likedBy</th><th>Comments</th><tr>');
          break;
        case 'comments':
          $('#object_table').append('<tr><th>ID</th><th>Pin</th><th>Poster</th><th>Content</th><tr>');
          break;
        case 'userReference':
          $('#object_table').append('<tr><th>Key</th><th>Username</th><tr>');
          break;
      }
      $('#object_table').append(text);
    },
    error: function(data){
      console.log('error');
    }
  });
}
