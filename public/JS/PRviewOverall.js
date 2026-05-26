const viewButtons = document.querySelectorAll('.view-button');

viewButtons.forEach(button => {
    button.addEventListener('click', function() {
        alert('View button clicked for ' + this.parentElement.previousElementSibling.textContent.trim());
    });
});
  
  document.getElementById('project-form').addEventListener('submit', function(event) {
    event.preventDefault();
    alert('Project submitted successfully!');
  });