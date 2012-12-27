$(document).ready(function(e){
  getBucket('users');
  getKeys('users');
  
  function refreshAll(bucket){
    getBucket(bucket);
    getKeys(bucket);
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
    })
  });
  return false;
});