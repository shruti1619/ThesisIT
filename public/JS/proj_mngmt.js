// Event listener for the search button
document.getElementById('searchBtn').addEventListener('click', function() {
    let query = document.getElementById('searchInput').value;
    alert('You searched for: ' + query);
});

// Event listener for the Add Project button
document.getElementById('addProjectBtn').addEventListener('click', function() {
    alert('Redirecting to Add Project Page...');
    // Here you can redirect the user to the Add Project page or trigger the appropriate action
});

// Event listener for the Edit Project button
document.getElementById('editProjectBtn').addEventListener('click', function() {
    alert('Redirecting to Edit Project Page...');
    // Here you can redirect the user to the Edit Project page or trigger the appropriate action
});