let socialMediaExpanded = false;

function validateRegistration() {
  // if all fields not null and passwords match...
  // Write this code better
  if ($('#fname').val() != '') {
    if ($('#lname').val() != '') {
      $('#lname').css({ 'border-color': 'initial' });
      if ($('#email').val() != '') {
        $('#email').css({ 'border-color': 'initial' });
        if ($('#password').val() != '') {
          $('#password').css({ 'border-color': 'initial' });
          if ($('#password').val() == $('#confirmpassword').val()) {
            $('#confirmpassword').css({ 'border-color': 'initial' });
            // display submitButton
            $('#submitButton').css({ display: 'inherit' });
          } else {
            $('#confirmpassword').css({ 'border-bottom': '1px solid red' });
            hideSubmitButton();
          }
        } else {
          $('#password').css({ 'border-bottom': '1px solid red' });
          hideSubmitButton();
        }
      } else {
        $('#email').css({ 'border-bottom': '1px solid red' });
        hideSubmitButton();
      }
    } else {
      $('#lname').css({ 'border-bottom': '1px solid red' });
      hideSubmitButton();
    }
  } else {
    $('#fname').css({ 'border-bottom': '1px solid red' });
    hideSubmitButton();
  }
}

$(document).ready(() => {
  // Check registration form for validity as fields are populated
  // NET THESE WITH A CLASS?
  $('#fname').change(() => {
    validateRegistration();
  });

  $('#lname').change(() => {
    validateRegistration();
  });

  $('#email').change(() => {
    validateRegistration();
  });

  $('#password').change(() => {
    validateRegistration();
  });

  $('#confirmpassword').change(() => {
    validateRegistration();
  });

  $('#addnewproject').click(() => {
    $('#myModal').modal();
  });

  // Listen for clicks on the social media button
  $('#socialMediaParent').on('click', () => {
    if (socialMediaExpanded == false) {
      socialMediaExpanded = true;
      $('#socialMediaLinks').fadeIn('slow');
    } else {
      socialMediaExpanded = false;
      $('#socialMediaLinks').fadeOut('slow');
    }
  });

  // Listen for clicks on the portfolio nav
  $('.qap-nav').on('click', function () {
    const clickedPort = this.id;

    // Iterate through the item(s) and display the selected project. Hide all others
    $('.portfolio-section').each(function (index) {
      const thisPortSection = this.id;
      // Bring up large display for the selected project
      if (thisPortSection == `main-${clickedPort}`) {
        $(`#${thisPortSection}`).addClass('fade-in');
        $(`#${thisPortSection}`).css('display', 'inherit');
      // Hide all other projects
      } else {
        $(`#${thisPortSection}`).removeClass('fade-in');
        $(`#${thisPortSection}`).css('display', 'none');
      }
    });
  });

  // Populate Footer
  const today = new Date();
  const thisYear = today.getFullYear();
  $('#footer-div').html(`&copy;${thisYear}`);
});
