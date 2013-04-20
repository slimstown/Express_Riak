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
          var key = data[obj].key;
          var val = data[obj].val;
          //console.log(key);
          //console.log(val);
          if(bucketName === 'users'){
            text += '<tr>';
            //TODO FINISH testing / filling this in
            if(key) text += '<td><a class="id" href="#">'+ key +'</a></td>'; else text += '<td></td>';
            if(val.username) text += '<td>'+ val.username +'</td>'; else text += '<td></td>';
            if(val.fbConnect) text += '<td>'+ val.fbConnect +'</td>'; else text += '<td></td>';
            if(val.favCat.length > 0){
              text += '<td><select>';
              for(c in val.favCat){
                text += '<option>' + val.favCat[c] + '</option>';
              }
              text += '</select></td>';
            }
            else text += '<td></td>';
            if(val.posts.length > 0){
              text += '<td><select>';
              for(p in val.posts){
                text += '<option>' + val.posts[p] + '</option>';
              }
              text += '</select><span>' + ' ('+ val.posts.length+ ')' + '<span></td>';
            }
            else text += '<td></td>';
            if(val.likes.length > 0){
              text += '<td><select>';
              for(l in val.likes.length){
                text += '<option>' + val.length[f] + '</option>';
              }
              text += '</select><span>' + ' ('+ val.likes.length + ')' + '<span></td>';
            }
            else text += '<td></td>';
            if(val.followers.length > 0){
              text += '<td><select>';
              for(f in val.followers){
                text += '<option>' + val.followers[f] + '</option>';
              }
              text += '</select><span>' + ' ('+ val.followers.length+ ')' + '<span></td>';
            }
            else text += '<td></td>';
            if(val.following.length > 0){
              text += '<td><select>';
              for(f in val.following){
                text += '<option>' + val.following[f] + '</option>';
              }
              text += '</select><span>' + ' ('+ val.following.length+ ')' + '<span></td>';
            }
            else text += '<td></td>';
            text += '<td><button class="user_groups">groups</button><button class="user_activity">activity</button></td>';
            text += '<td><button class="user_delete">delete</button><button class="user_index">index</button></td>';
            text += '</tr>';
          }
          else if(bucketName === 'userReference'){
            text += '<tr>';
            if(key) text += '<td>' + key + '</td>'; else text += '<td></td>';
            if(val.username) text += '<td>' + val.username + '</td>'; else text += '<td></td>';
            if(val.imgUrl) text += '<td><img src="' + val.imgUrl + '" height="22" width="22" /></td>'; else text += '<td></td>';
            text += '</tr>';
          }
          else if(bucketName === 'pendingUsers'){
            text += '<tr>';
            if(key) text += '<td class="id">' + key + '</td>'; else text += '<td></td>';
            if(val.email) text += '<td>' + val.email + '</td>'; else text += '<td></td>';
            if(val.userName) text += '<td class="name">' + val.userName + '</td>'; else text += '<td></td>';
            if(val.company) text += '<td>' + val.company + '</td>'; else text += '<td></td>';
            text += '<td><button class="activate_pending" >Activate</button><button class="reject_pending">Reject</button></td>';
            text += '</tr>';
          }
          else if(bucketName === 'gamepins'){
            text += '<tr>';
            if(key) text += '<td><a class="id" href="#">'+ key +'</a></td>'; else text += '<td></td>';
            if(val.posterId) text += '<td>'+ val.posterId +'</td>'; else text += '<td></td>';
            if(val.category) text += '<td>'+ val.category +'</td>'; else text += '<td></td>';
            if(val.description) text += '<td>'+ val.description +'</td>'; else text += '<td></td>';
            console.log(val.likedBy);
            if(val.likedBy && val.likedBy.length > 0){
              text +='<td><select>';
              for(c in val.likedBy.length){
                text += '<option>' + val.comments[c] + '</option>';
              }
              text += '</select></td>';
            }
            else text += '<td></td>';
            if(val.comments.length > 0){
              text += '<td><select>';
              for(c in val.comments){
                text += '<option>' + val.comments[c] + '</option>';
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
            if(key) text += '<td><a class="id" href="#">'+ key +'</a></td>'; else text += '<td></td>';
            if(val.pin) text += '<td>'+ val.pin +'</td>'; else text += '<td></td>';
            if(val.poster) text += '<td>'+ val.poster +'</td>'; else text += '<td></td>';
            if(val.content) text += '<td>'+ val.content +'</td>'; else text += '<td></td>';
            text += '</tr>';
          }
        }
      }
      $('#object_table').empty();
      switch(bucketName){
        case 'users':
          $('#object_table').append('<tr><th>Email</th><th>Username</th><th>fbConnect</th><th>FavCat</th><th>Posts</th><th>Likes</th>' +
                                    '<th>Followers</th><th>Following</th><th>GetData</th><th>Actions</th><tr>');
          break;
        case 'userReference':
          $('#object_table').append('<tr><th>Key</th><th>Username</th><th>imgUrl</th><tr>');
          break;
        case 'pendingUsers':
          $('#object_table').append('<tr><th>Key</th><th>email</th><th>userName</th><th>company</th><th>options</th><tr>');
          break;
        case 'gamepins':
          $('#object_table').append('<tr><th>ID</th><th>Poster ID</th><th>Category</th><th>Description</th><th>likedBy</th><th>Comments</th><tr>');
          break;
        case 'comments':
          $('#object_table').append('<tr><th>ID</th><th>Pin</th><th>Poster</th><th>Content</th><tr>');
          break;
        
      }
      $('#object_table').append(text);
    },
    error: function(data){
      console.log('error');
    }
  });
}
