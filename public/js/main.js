$(document).ready(function(e){
  console.log('yea');
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