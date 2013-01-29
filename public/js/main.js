$(document).ready(function(e){
  //Get list of objects in bucket
  $(document).on('click', '.buckets button', function(e){
    $('.selected').removeClass('selected');
    $(this).addClass('selected');
    getBucket($(this).text());
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
  //add user (not functional, kept as reference)
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
  //TODO: add gamepin
  
  //display correct form to add object
  $('#obj_select').change(function(e){
    $('.visible').removeClass('visibe').addClass('hidden');
    var obj = $('#obj_select option').filter(':selected').text();
    $('#add_'+obj).removeClass('hidden').addClass('visible');
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
              if(data.objects[obj].data.posterId) text += '<td>'+ data.objects[obj].data.posterId +'</a></td>'; else text += '<td></td>';
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
          if(data.objects[obj].fields.posterId) text += '<td>'+ data.objects[obj].fields.posterId +'</a></td>'; else text += '<td></td>';
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
});