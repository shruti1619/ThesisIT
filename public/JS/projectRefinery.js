document.addEventListener('DOMContentLoaded', () => {
    const viewButtons = document.querySelectorAll('.view-button');

    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            const projectId = button.getAttribute('data-id');
            const projectTitle = button.getAttribute('data-projectTitle');
             // Show alert with project title
            window.location.href = `/projectref/details/${projectId}`; // Navigate to the details page
        });
    });
});