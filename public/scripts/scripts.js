const hideSubmitButton = () => {
  const btn = document.querySelector('#submitButton');
  if (btn) btn.style.display = 'none';
};

const validateRegistration = () => {
  const fields = {
    fname: document.querySelector('#fname'),
    lname: document.querySelector('#lname'),
    email: document.querySelector('#email'),
    pass: document.querySelector('#password'),
    confirm: document.querySelector('#confirmpassword')
  };
  const submitBtn = document.querySelector('#submitButton');

  // Helper to safely check and style elements
  const setError = (el) => {
    if (el) {
      el.style.borderColor = '#dc3545';
      el.focus();
    }
    if (submitBtn) submitBtn.style.display = 'none';
    return false;
  };

  Object.values(fields).forEach(el => {
    if (el) el.style.borderColor = '#dee2e6'; 
  });

  // This check ensures the element exists before trying to read .value
  if (fields.fname && !fields.fname.value) return setError(fields.fname);
  if (fields.lname && !fields.lname.value) return setError(fields.lname);
  if (fields.email && !fields.email.value) return setError(fields.email);
  if (fields.pass && !fields.pass.value) return setError(fields.pass);

  if (fields.pass && fields.confirm) {
    if (fields.pass.value !== fields.confirm.value) {
      return setError(fields.confirm);
    }
  }

  if (submitBtn) submitBtn.style.display = 'block';
};

function updateFileName(input, targetId) {
  const fileName = input.files[0] ? input.files[0].name : "No file chosen";
  const target = document.getElementById(targetId);
  
  if (input.files[0]) {
    target.innerHTML = `<span class="text-success fw-bold"><i class="fas fa-file-import"></i> New: ${fileName}</span>`;
  }
}

// Helper to keep the main logic clean
const handleError = (element) => {
  element.style.borderBottom = '1px solid red';
  hideSubmitButton();
};

document.addEventListener('DOMContentLoaded', () => {
  const registrationForm = document.getElementById('registrationForm');

  if (registrationForm) {
    const regInputs = document.querySelectorAll('#fname, #lname, #email, #password, #confirmpassword');
  
    regInputs.forEach(input => {
      input.addEventListener('input', validateRegistration);
    });
  }

  // Modal listener
  const addBtn = document.querySelector('#addnewproject');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      // Explicitly tell Bootstrap to 'show' the modal
      // We use jQuery here because Bootstrap 3/4 JS is built on it
      $('#myModal').modal('show'); 
    });
  }

  $('.qap-item').on('click', function() {
      const projectId = $(this).attr('id');
      $('.portfolio-card').addClass('d-none');
      $(`#main-${projectId}`).removeClass('d-none');
      $('html, body').animate({
          scrollTop: $(".portfolio-display-area").offset().top - 100
      }, 400);
  });

  
  const footer = document.querySelector('#footer-div');
  if (footer) {
    footer.innerHTML = `&copy; ${new Date().getFullYear()}`;
  }
});

const filterPuzzles = () => {
  const start = parseInt(document.querySelector('#startYear').value) || 0;
  const end = parseInt(document.querySelector('#endYear').value) || 3000;
  const pieces = document.querySelector('#pieceFilter').value;
  const onlyOwned = document.querySelector('#collectionOnly').checked;

  document.querySelectorAll('.puzzle-card').forEach(card => {
    const cardYear = parseInt(card.dataset.year);
    const cardPieces = card.dataset.pieces;
    const isOwned = card.dataset.owned === 'true';

    const yearMatch = cardYear >= start && cardYear <= end;
    const pieceMatch = pieces === 'all' || cardPieces === pieces;
    const ownershipMatch = !onlyOwned || isOwned;

    if (yearMatch && pieceMatch && ownershipMatch) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
};

// Add listeners to all puzzle filter inputs
document.querySelectorAll('#puzzleFilterForm input, #puzzleFilterForm select').forEach(el => {
  el.addEventListener('input', filterPuzzles);
});