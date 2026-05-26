// Optional JavaScript functionality for the buttons
document.querySelectorAll('.sign-in-button').forEach
    // Get buttons and popup elements
const studentBtn = document.getElementById('studentBtn');
const studentPopup = document.getElementById('studentPopup');
const closePopupBtn = document.getElementById('closePopupBtn');

// Show popup when student button is clicked
studentBtn.addEventListener('click', function() {
    studentPopup.style.display = 'flex';
});

// Close popup when close button is clicked
closePopupBtn.addEventListener('click', function() {
    studentPopup.style.display = 'none';
});

// Close popup when clicked outside the popup content
window.addEventListener('click', function(event) {
    if (event.target === studentPopup) {
        studentPopup.style.display = 'none';
    }
});