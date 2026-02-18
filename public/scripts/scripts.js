let socialMediaExpanded = false;

const hideSubmitButton = () => {
  const btn = document.querySelector('#submitButton');
  if (btn) btn.style.display = 'none';
};

const validateRegistration = () => {
  // Select all our elements
  const fields = {
    fname: document.querySelector('#fname'),
    lname: document.querySelector('#lname'),
    email: document.querySelector('#email'),
    pass: document.querySelector('#password'),
    confirm: document.querySelector('#confirmpassword')
  };
  const submitBtn = document.querySelector('#submitButton');

  // 1. Reset all borders first
  Object.values(fields).forEach(el => {
    if (el) el.style.borderColor = 'initial';
    if (el) el.style.borderBottom = 'none'; 
  });

  // 2. Early Returns (The "Fail Fast" approach)
  if (!fields.fname.value) return handleError(fields.fname);
  if (!fields.lname.value) return handleError(fields.lname);
  if (!fields.email.value) return handleError(fields.email);
  if (!fields.pass.value) return handleError(fields.pass);

  // 3. Password Match Check
  if (fields.pass.value !== fields.confirm.value) {
    return handleError(fields.confirm);
  }

  // 4. Success - Show the button
  if (submitBtn) submitBtn.style.display = 'inherit';
};

// Helper to keep the main logic clean
const handleError = (element) => {
  element.style.borderBottom = '1px solid red';
  hideSubmitButton();
};

document.addEventListener('DOMContentLoaded', () => {
  // Select all registration inputs to add listeners in one go
  const regInputs = document.querySelectorAll('#fname, #lname, #email, #password, #confirmpassword');
  
  regInputs.forEach(input => {
    input.addEventListener('input', validateRegistration);
  });

  // Modal listener
  document.querySelector('#addnewproject')?.addEventListener('click', () => {
    // Note: If you're using Bootstrap's JS for the modal, 
    // it likely still wants the jQuery syntax unless you update to Bootstrap 5+
    $('#myModal').modal(); 
  });

  // Social Media Toggle
  document.querySelector('#socialMediaParent')?.addEventListener('click', () => {
    const links = document.querySelector('#socialMediaLinks');
    socialMediaExpanded = !socialMediaExpanded;
    
    if (links) {
      // Using simple display toggle since we're ditching the slow jQuery fades
      links.style.display = socialMediaExpanded ? 'block' : 'none';
    }
  });

  // Portfolio Navigation
  document.querySelectorAll('.qap-nav').forEach(navItem => {
    navItem.addEventListener('click', (e) => {
      const clickedId = e.currentTarget.id;

      // Hide all sections, then show the specific one
      document.querySelectorAll('.portfolio-section').forEach(section => {
        section.classList.remove('fade-in');
        section.style.display = 'none';
      });

      const targetSection = document.querySelector(`#main-${clickedId}`);
      if (targetSection) {
        targetSection.classList.add('fade-in');
        targetSection.style.display = 'inherit';
      }
    });
  });

  // Footer
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

    // Logic Check
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

// Add listeners to all filter inputs
document.querySelectorAll('#puzzleFilterForm input, #puzzleFilterForm select').forEach(el => {
  el.addEventListener('input', filterPuzzles);
});