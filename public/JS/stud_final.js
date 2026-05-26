// Sample search functionality for searching the team name in the table
document.getElementById('search-bar').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const rows = document.querySelectorAll('#projects-table tbody tr');

    rows.forEach(row => {
        const teamName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        if (teamName.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});
 
// Handle dropdown toggle
document.querySelector('.dropdown-lines').addEventListener('click', function() {
    document.querySelector('.dropdown-menu').style.display = 'block';
});

// Handle closing dropdown
document.querySelector('.close-btn').addEventListener('click', function() {
    document.querySelector('.dropdown-menu').style.display = 'none';
});

// Allow dropdown links to navigate AND hide the dropdown on click
document.querySelectorAll('.dropdown-menu li a').forEach(function(item) {
    item.addEventListener('click', function(e) {
        // e.preventDefault(); // REMOVED: Allow the link to navigate normally
        // Optional: You might still want to hide the dropdown after clicking
        document.querySelector('.dropdown-menu').style.display = 'none';
        // Optional: You probably don't want to populate the search bar anymore when clicking a domain link
        // const selectedText = e.target.textContent;
        // document.getElementById('search-bar').value = selectedText;
    });
});

  document.addEventListener('DOMContentLoaded', function () {
    // Get all dropdown buttons
    const dropdowns = document.querySelectorAll('.dropbtn');

    dropdowns.forEach(button => {
      button.addEventListener('click', function () {
        // Toggle the display of the corresponding dropdown-content
        const dropdownContent = this.nextElementSibling;
        dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
      });
    });

    // Optional: Close the dropdown if clicked outside
    window.addEventListener('click', function (event) {
      if (!event.target.matches('.dropbtn')) {
        dropdowns.forEach(button => {
          const dropdownContent = button.nextElementSibling;
          dropdownContent.style.display = 'none';
        });
      }
    });
  });

