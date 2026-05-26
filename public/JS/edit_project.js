// Add functionality to "Edit" buttons to focus on the corresponding input field
document.querySelectorAll('.edit-button').forEach((button, index) => {
  button.addEventListener('click', () => {
    const inputField = button.previousElementSibling;
    if (inputField) inputField.focus();
  });
});

// Handle project form submission
document.getElementById('project-form').addEventListener('submit', function(event) {
  event.preventDefault();
  // Handle project form submission logic here
  alert('Project submitted successfully!');
});

// Handle edit form submission via AJAX
document.addEventListener('DOMContentLoaded', function() {
    const editForm = document.getElementById('edit-project-text-form');
    if (editForm) {
        editForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(editForm);
            try {
                const response = await fetch('/project/update-text', { // Ensure this matches the server route
                    method: 'POST',
                    body: formData
                });
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        alert('Project updated!');
                    } else {
                        alert('Failed to update project: ' + result.error);
                    }
                } else {
                    alert('Failed to update project: Server error');
                }
            } catch (error) {
                console.error('Error during fetch:', error);
                alert('Failed to update project: Network error');
            }
        });
    }
});