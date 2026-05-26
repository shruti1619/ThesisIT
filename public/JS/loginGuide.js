function validateForm() {
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    const username = usernameField.value.trim();
    const password = passwordField.value.trim();

    if (!username || !password) {
        alert('Username and password are required');
        return false;
    }

    // If validation passes, submit the form data to backend
    const formData = {
        username: username,
        password: password
    };

    // Log the form data before sending
    console.log('Submitting login data:', formData);

    fetch('/guide/signin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(async response => {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            console.log('Server response:', {
                status: response.status,
                data: data
            });

            if (!response.ok) {
                throw new Error(data.error || `Server error: ${response.status}`);
            }
            return data;
        } else {
            throw new Error('Server response is not JSON');
        }
    })
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        alert('Login Successful'); // Show alert
        window.location.href = '/guide/projectGuidedash';  // Redirect to guide dashboard
    })
    .catch(error => {
        console.error('Login error details:', {
            message: error.message,
            error: error
        });
        alert('Error logging in: ' + error.message);
    });

    return false; // Prevent default form submission
}