
document.addEventListener('DOMContentLoaded', () => {
    const editButtons = document.querySelectorAll('.edit-btn');
    const form = document.querySelector('#adminProfileForm');
    const submitBtn = document.querySelector('#submitBtn');
    const imageInput = document.querySelector('#profileImage');
    const profileImage = document.querySelector('#profilePreview');

    // Toggle input edit mode
    editButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const input = e.target.closest('.input-group').querySelector('input');
            input.disabled = !input.disabled;
            e.target.textContent = input.disabled ? 'Edit' : 'Cancel';
            submitBtn.disabled = false;
        });
    });

    // Show image preview on image input change
    imageInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            profileImage.src = URL.createObjectURL(file);
            submitBtn.disabled = false;
        }
    });

    // Submit form via AJAX
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);

        try {
            const res = await fetch('/admin/update-profile', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (data.success) {
                alert(data.message);
                submitBtn.disabled = true;

                // Disable all inputs after saving
                document.querySelectorAll('input').forEach(inp => inp.disabled = true);
                editButtons.forEach(btn => btn.textContent = 'Edit');

                if (data.profileImagePath) {
                    profileImage.src = data.profileImagePath;
                }
            } else {
                alert('Error: ' + data.error);
            }

        } catch (err) {
            console.error('Error submitting form:', err);
            alert('Something went wrong while updating profile.');
        }
    });
});

