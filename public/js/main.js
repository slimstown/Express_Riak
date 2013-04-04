$(document).ready(function(e){  
  var options = {
    
  }
  
  var percent = 0;
  
  /*$('#email_btn').click(function(e){
    console.log('Hello button');
    var email = 'footindoorsolutions@gmail.com';
    var pass = '776736869468729300';
    $.ajax({
      type: 'post',
      url: '/resendEmail',
      data: 'email=' + email + '&pass=' + pass,
      success: function(data){
        console.log('emailed' + data.email);
      },
      error: function(data){
        console.log('error');
      }
    });
  });*/
  
  $('#uploadForm').submit(function(){
    $(this).ajaxSubmit({
      beforeSubmit: function(formData, jqForm, options){
        console.log($.param(formData));
        percent = 0;
      },
      uploadProgress: function(event, position, total, percentComplete){
        var percent = percentComplete;
        console.log(percentComplete);
      },
      success: function(responseText, statusText, xhr, $form){
        console.log(responseText);
        console.log(statusText);
        console.log(xhr);
        console.log($form);
        $('#cdnUrl').attr('href', responseText.url);
        $('#uploadForm').append('<img src="'+ responseText.url +'">');
      },
      dataType: 'json'
    });
    return false;
  });
  function showRequest(formData, jqForm, options) { 
    var queryString = $.param(formData); 
    console.log('About to submit: \n\n' + queryString); 
    return true; 
} 
  function showResponse(responseText, statusText, xhr, $form){
    console.log('testSuccess');
    console.log(statusText);
    console.log(responseText);
  }
  
  //Get list of objects in bucket
  $(document).on('click', '.buckets button', function(e){
    $('.selected').removeClass('selected');
    $(this).addClass('selected');
    if($(this).text() === 'pendingUsers'){
      $('#pending_options').removeClass('hidden');
    }
    else{
      $('#pending_options').addClass('hidden');
    }
    getBucket($(this).text());
  });
  //fetch and display image
  
  $('.fetch_img').click(function(e){
    $.ajax({
      type: 'get',
      url: '/fetchImage',
      success: function(data){
        console.log(data.img);
      }
    });
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
  
  //view user groups
  $(document).on('click', '.user_groups', function(e){
    console.log($(this).parent().parent().find('.id').text());
    $.ajax({
      type: 'post',
      url: '/getGroups',
      data: 'key=' + $(this).parent().parent().find('.id').text(),
      success: function(data){
        console.log(data.groups);
        alert(JSON.stringify(data, null, 4));
      }
    });
  });
  //view user activity
  $(document).on('click', '.user_activity', function(e){
    console.log($(this).parent().parent().find('.id').text());
    $.ajax({
      type: 'post',
      url: '/getActivity',
      data: 'key=' + $(this).parent().parent().find('.id').text(),
      success: function(data){
        console.log(data.activity);
        alert(JSON.stringify(data, null, 4));
      }
    });
  });
  //delete user and view success confirmation
  $(document).on('click', '.user_delete', function(e){
    console.log($(this).parent().parent().find('.id').text());
    $.ajax({
      type: 'post',
      url: '/deleteUser',
      data: 'key=' + $(this).parent().parent().find('.id').text(),
      success: function(data){
        alert("deleted: " + JSON.stringify(data, null, 4));
      }
    });
  });
  //delete pending user
  $(document).on('click', '.reject_pending', function(e){
    console.log($(this).parent().parent().find('.id').text());
    $.ajax({
      type: 'post',
      url: '/deletePending',
      data: 'key=' + $(this).parent().parent().find('.id').text(),
      success: function(data){
        alert("deleted: " + JSON.stringify(data, null, 4));
      }
    });
  });
  //accept pending user
  $(document).on('click', '.activate_pending', function(e){
    var email = $(this).parent().parent().find('.id').text();
    var name = $(this).parent().parent().find('.name').text();
    $.ajax({
      type: 'post',
      url: '/activatePending',
      data: 'email=' + email + '&name=' + name,
      success: function(data){
        alert("activated: " + JSON.stringify(data, null, 4));
      }
    });
  });
  
  //get 2i indexes
  $(document).on('click', '.user_index', function(e){
    console.log($(this).parent().parent().find('.id').text());
    $.ajax({
      type: 'post',
      url: '/getIndex',
      data: 'key=' + $(this).parent().parent().find('.id').text(),
      success: function(data){
        alert("index: " + JSON.stringify(data, null, 4));
      }
    });
  });
  $('button.fetchImage').click(function(e){
    $.ajax({
      type: 'get',
      url: '/fetchImage',
      success: function(data){
        console.log(data);
        var htmlStr = '<img src="data:image/png;base64,11224434234322323aLKDJSjwjioj2j32nnndfj23knjknfk2jn23kn32jknfkjfnkj2nkjnewf" >';
        var htmlStrr = '<p>fuck</p>';
        $('body').append(htmlStr);
      }
    });
  });
  $('button.authenticate').click(function(e){
    $.ajax({
      type: 'get',
      url: '/auth',
      success: function(data){
        console.log(data);
      }
    });
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