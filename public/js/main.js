$(document).ready(function(e){
  //getBucket('users');
  
  //refresh view of all bucket objects
  function refreshAll(bucket){
    getBucket(bucket);
  }
  $(document).on('click', '.buckets button', function(e){
    $('.selected').removeClass('selected');
    $(this).addClass('selected');
    refreshAll($(this).text());
  });
  //toggle options menu
  $('#toggle_options').click(function(e){
    if($('#left').hasClass('hidden')){
      $('#left').removeClass('hidden');
      $(this).text('Hide Options');
    }
    else{
      $('#left').addClass('hidden');
      $(this).text('Show Options');
    }
  });
  //add user
  $('#add_user').submit(function(e){
    $.ajax({
      type: 'post',
      url: '/register',
      data: $(this).serialize(),
      success: function(data){
        refreshAll($('.selected').text());
      }
    });
    return false;
  });
  //add gamepin
  $('#add_gamepin').submit(function(e){
    $.ajax({
      type: 'post',
      url: '/postGamePin',
      data: $(this).serialize(),
      success: function(data){
        refreshAll($('.selected').text());
      }
    });
    return false;
  });
  //add store
  $('#add_storepin').submit(function(e){
    $.ajax({
      type: 'post',
      url: '/postStorePin',
      data: $(this).serialize(),
      success: function(data){
        refreshAll($('.selected').text());
      }
    });
    return false;
  });
  //delete all objects in selected bucket
  $('#delete_all').click(function(e){
    var bucket = $('.selected').text();
    $.ajax({
      type: 'post',
      url: '/delete_all',
      data: 'bucket=' + bucket,
      success: function(data){
        refreshAll(bucket);
        console.log('success');
      }
    });
    return false;
  });
  //display correct form to add object
  $('#obj_select').change(function(e){
    $('.visible').removeClass('visibe').addClass('hidden');
    var obj = $('#obj_select option').filter(':selected').text();
    $('#add_'+obj).removeClass('hidden').addClass('visible');
  });
  //delete obj handler
  $(document).on('click', '.delete', function(e){
    var key = $(this).closest('tr').find('td:first-child a').text();
    var bucket = $('.selected').text();
    $.ajax({
      type: 'post',
      url: '/delete',
      data: 'bucket=' + bucket + '&key=' + key,
      success: function(data){
        refreshAll(bucket);
        console.log('success');
      }
    });
    return false;
  });
  //edit user handler
  $(document).on('click', '.edit', function(e){
    var key = $(this).closest('tr').find('td:first-child a').text();
    var bucket = $('.selected').text();
    $.ajax({
      type: 'post',
      url: '/edit',
      data: $('#add_user').serialize()+'&key='+key,
      success: function(data){
        refreshAll(bucket);
        console.log('success');
      }
    });
    return false;
  });
  //search via category
  $(document).on('submit', '#query_form', function(e){
    var category = $('#query_form select[name=category] option').filter(':selected').val();
    var bucket = $('#query_form select[name=bucket] option').filter(':selected').val();
    if(category === 'All') return false;
    $.ajax({
      type: 'post',
      url: '/categorySearch',
      data: 'bucket=' + bucket + '&category=' + category,
      success: function(data){
        if(data.error){
          console.log(data.error);
          return false;
        }
        switch(bucket){
          case 'gamepins':
            //make proper bucket selected
            $('.selected').removeClass('selected');
            $('.gamepins').addClass('selected');
            var text = '';
            //construct new table
            for(obj in data.objects){
              text += '<tr>'
              if(data.objects[obj].key) text += '<td><a class="id" href="#">'+ data.objects[obj].key +'</a></td>'; else text += '<td></td>';
              if(data.objects[obj].data.poster_id) text += '<td>'+ data.objects[obj].data.poster_id +'</a></td>'; else text += '<td></td>';
              if(data.objects[obj].data.category) text += '<td>'+ data.objects[obj].data.category +'</a></td>'; else text += '<td></td>';
              if(data.objects[obj].data.description) text += '<td>'+ data.objects[obj].data.description +'</td>'; else text += '<td></td>';
              text += '<td><button class="delete">Delete</button><button class="edit">Edit</button></td>';
              text += '</tr>';
            }
            //clear and refresh table
            $('#object_table').empty();
            $('#object_table').append('<tr><th>ID</th><th>Poster ID</th><th>Category</th><th>Description</th><th>Options</th><tr>');
            $('#object_table').append(text);
            break;
          case 'storepins':
            $('.selected').removeClass('selected');
            $('.gamepins').addClass('selected');
            var text = '';
            for(obj in data.objects){
              text += '<tr>';
              if(data.objects[obj].key) text += '<td><a class="id" href="#">'+ data.objects[obj].key +'</a></td>'; else text += '<td></td>';
              if(data.objects[obj].data.price) text += '<td>'+ data.objects[obj].data.price +'</a></td>'; else text += '<td></td>';
              if(data.objects[obj].data.category) text += '<td>'+ data.objects[obj].data.category +'</a></td>'; else text += '<td></td>';
              text += '<td><button class="delete">Delete</button><button class="edit">Edit</button></td>';
              text += '</tr>';
            }
            $('#object_table').empty();
            $('#object_table').append('<tr><th>ID</th><th>Poster ID</th><th>Category</th><th>Options</th><tr>');
            $('#object_table').append(text);
            break;
        }
      }
    });
    return false;
  });
  //Search via text input
  $(document).on('submit', '#search_form', function(e){
    var text = $('.search_input').val();
    var bucket = 'gamepins';
    $.ajax({
      type: 'post',
      url: '/textSearch',
      data: 'bucket=' + bucket + '&text=' + text,
      success: function(data){
        //make proper bucket selected
        $('.selected').removeClass('selected');
        $('.gamepins').addClass('selected');
        //display results of search
        for(obj in data.objects){
          text += '<tr>'
          if(data.objects[obj].id) text += '<td><a class="id" href="#">'+ data.objects[obj].id +'</a></td>'; else text += '<td></td>';
          if(data.objects[obj].fields.poster_id) text += '<td>'+ data.objects[obj].fields.poster_id +'</a></td>'; else text += '<td></td>';
          if(data.objects[obj].fields.category) text += '<td>'+ data.objects[obj].fields.category +'</a></td>'; else text += '<td></td>';
          if(data.objects[obj].fields.description) text += '<td>'+ data.objects[obj].fields.description +'</td>'; else text += '<td></td>';
          text += '<td><button class="delete">Delete</button><button class="edit">Edit</button></td>';
          text += '</tr>';
        }
        //clear and refresh table
        $('#object_table').empty();
        $('#object_table').append('<tr><th>ID</th><th>Poster ID</th><th>Category</th><th>Description</th><th>Options</th><tr>');
        $('#object_table').append(text);
      }
    });
    return false;
  });
  //post image to Riak
  $('#post_img').click(function(e){
    $.ajax({
      url: '/saveImg',
      success: function(data){
      }
    });
  });
});