// You can add any interactivity here, for now, it's an empty file.
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

// Populate search bar when clicking on a dropdown item
document.querySelectorAll('.dropdown-menu li a').forEach(function(item) {
    item.addEventListener('click', function(e) {
        const selectedText = e.target.textContent; // Get the text of the clicked item
        document.getElementById('search-bar').value = selectedText; // Set the text in the search bar
        document.querySelector('.dropdown-menu').style.display = 'none'; // Hide the dropdown
    });
});