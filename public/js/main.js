$(document).ready(function(e){
  getBuckets();
  getBucket('users');
  getKeys('users');
  
  function refreshAll(bucket){
    getBuckets();
    getBucket(bucket);
    getKeys(bucket);
  }
  $(document).on('click', 'button.users', function(e){
    refreshAll($(this).text());
  });
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
  $('#register_form').submit(function(e){
    $.ajax({
      type: 'post',
      url: '/register',
      data: $(this).serialize(),
      success: function(data){
        $('#result').text(data);
      }
    });
    return false;
  });
  $('#login_form').submit(function(e){
    $.ajax({
      type: 'post',
      url: '/login',
      data: $(this).serialize(),
      success: function(data){
        if(data.user){
          $('#result').text(data.response + data.user);
          $('#curr_user').text(data.user);
        }
        else{
          $('#result').text(data.response);
        }
      }
    });
    return false;
  });
  $('#logout_button').submit(function(e){
    return false;
  });
});