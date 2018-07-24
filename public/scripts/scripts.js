var socialMediaExpanded = false;

$( document ).ready(function() {

	//Check registration form for validity as fields are populated
	//NET THESE WITH A CLASS
	$("#fname" ).change(function() {
	  validateRegistration();
	});

	$("#lname" ).change(function() {
	  validateRegistration();
	});

	$("#email" ).change(function() {
	  validateRegistration();
	});

	$("#password" ).change(function() {
	  validateRegistration();
	});

	$("#confirmpassword" ).change(function() {
	  validateRegistration();
	});

	$("#addnewproject" ).click(function() {
		$("#myModal").modal();
	});

	//Listen for clicks on the social media button
	$('#socialMediaParent').on('click', function() {
		if (socialMediaExpanded == false) {
			socialMediaExpanded = true;
			$('#socialMediaLinks').fadeIn("slow")
		} else {
			socialMediaExpanded = false;
			$('#socialMediaLinks').fadeOut("slow")
		}
	})

});

function validateContact() {
	// check name
	if ( $("#fname").val() == "") {
		$("#fname").css('border-bottom','2px solid red');
		return false;
	} else {
		$("#fname").css('border-bottom','1px solid #6b6b6b');
	}

	if ( $("#email").val() == "") {
		$("#email").css('border-bottom','2px solid red')
		return false;
	} else {
		$("#email").css('border-bottom','1px solid #6b6b6b');
	}

	if ( $("#message").val() == "") {
		$("#message").css('border','2px solid red')
		return false;
	} else {
		$("#message").css('border','1px solid #6b6b6b');
	}

}

function clearFields() {
  //Clear fields on contact form
  document.getElementById("fname").value = "";
  document.getElementById("email").value = "";
  document.getElementById("message").value = "";

  //Thank user for the message
  // alert("Thank you for your message.")

}

function validateRegistration() {
	//if all fields not null and passwords match...

	//Write this code better
	if ($("#fname" ).val() != "") {
		if ($("#lname" ).val() != "") {
			$("#lname").css({"border-color":"initial"});
			if ($("#email" ).val() != "") {
				$("#email").css({"border-color":"initial"});
				if ($("#password" ).val() != "") {
					$("#password").css({"border-color":"initial"});
					if ($("#password" ).val() == $("#confirmpassword" ).val()) {
						$("#confirmpassword").css({"border-color":"initial"});
						//display submitButton
						$("#submitButton").css({"display":"inherit"});
					} else {
						$("#confirmpassword").css({"border-bottom":"1px solid red"});
						hideSubmitButton();
					}
				} else {
					$("#password").css({"border-bottom":"1px solid red"});
					hideSubmitButton();
				}
			} else {
				$("#email").css({"border-bottom":"1px solid red"});
				hideSubmitButton();
			}
		} else {
			$("#lname").css({"border-bottom":"1px solid red"});
			hideSubmitButton();
		}
	} else {
		$("#fname").css({"border-bottom":"1px solid red"});
		hideSubmitButton();
	}
}

function hideSubmitButton() {
	$("#submitButton").css({"display":"none"});	
}