const editButtons = document.querySelectorAll('.edit-btn');

editButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        const input = e.target.previousElementSibling;
        input.disabled = !input.disabled;
    });
});
document.querySelector('form').addEventListener('submit', function(event) {
    event.preventDefault();  // Prevents the default form submission
    alert('Your data has been edited successfully!');
    
    // You can add any other logic here if needed (e.g., saving the data)
});