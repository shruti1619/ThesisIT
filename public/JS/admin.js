// Search bar filtering of table rows by team name
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

// Hamburger Menu Animation and Toggle
document.getElementById('menu-icon').addEventListener('click', function () {
    document.getElementById('dropdown-menu').classList.add('open');
});

// Close the menu when clicking the close button
document.getElementById('close-btn').addEventListener('click', function () {
    document.getElementById('dropdown-menu').classList.remove('open');
});

// Handle dropdown toggle for the search bar dropdown
document.querySelector('.dropdown-lines').addEventListener('click', function(event) {
    event.stopPropagation(); // Prevent click from bubbling up and closing dropdown immediately
    const dropdown = document.querySelector('.dropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
});

// Handle closing dropdown when clicking outside of the dropdown
document.addEventListener('click', function(event) {
    const dropdown = document.querySelector('.dropdown');
    if (!dropdown.contains(event.target) && !document.querySelector('.dropdown-lines').contains(event.target)) {
        dropdown.style.display = 'none';
    }
});

// Close the dropdown when clicking the close button inside dropdown
document.querySelector('.close-btn').addEventListener('click', function() {
    document.querySelector('.dropdown').style.display = 'none';
});

// Populate search bar when clicking on a dropdown item and hide dropdown
document.querySelectorAll('.dropdown li a').forEach(function(item) {
    item.addEventListener('click', function(e) {
        // e.preventDefault(); // Allow navigation if link points somewhere
        const selectedText = e.target.textContent; // Get clicked item text
        document.getElementById('search-bar').value = selectedText; // Set it in search bar
        document.querySelector('.dropdown').style.display = 'none'; // Hide dropdown
        // Trigger input event so search filters immediately on selection
        document.getElementById('search-bar').dispatchEvent(new Event('input'));
    });
});

// Function to show student details via AJAX fetch
function showStudentDetails() {
    fetch('/admin/student-details')
        .then(response => response.json())
        .then(data => {
            const studentDetails = document.getElementById('studentDetails');
            studentDetails.innerHTML = data.map(student => `
                <p>Name: ${student.name}, Year: ${student.year}, Academic Year: ${student.academicYear}</p>
            `).join('');
            document.getElementById('studentDetailsSection').style.display = 'block';
        })
        .catch(error => console.error('Error fetching student details:', error));
}

// Function to redirect to alumni list page
function showaluminiDetails() {
    window.location.href = '/admin/alumini-list';
}

// Redirect on clicking the "Total Students Enrolled" info box
document.querySelector('.info-box').addEventListener('click', function() {
    window.location.href = '/admin/studentDetails';
});

// Mark final year students as alumni via POST request
document.getElementById('markAlumniButton').addEventListener('click', function() {
    fetch('/admin/mark-final-year-as-alumni', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message); // Show success message
    })
    .catch(error => console.error('Error marking final year students as alumni:', error));
});
