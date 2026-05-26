// Function to display messages in the error div
function showMessage(message, isError = true) {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.style.color = isError ? 'red' : 'green';
        errorDiv.style.backgroundColor = isError ? '#ffe6e6' : '#e6ffe6';
    } else {
        console.error("Error display div with id 'error' not found.");
        alert(message);
    }
}

// Function to hide the error message div
function hideMessage() {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }
}

// Main function to handle login form submission
function handleLoginSubmit(event) {
    event.preventDefault(); // Prevent default form submission
    hideMessage(); // Hide previous messages

    // Get form elements
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    const loginButton = document.getElementById('login-btn');

    // Basic validation
    if (!usernameField || !passwordField) {
        console.error('Username or password input field not found.');
        showMessage('An error occurred submitting the form. Please try again.');
        return false;
    }

    const username = usernameField.value.trim();
    const password = passwordField.value;

    if (!username || !password) {
        showMessage('Please enter both username and password.');
        return false;
    }

    // Disable button to prevent multiple submissions
    if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent = 'Logging In...';
    }

    // Prepare form data
    const formData = {
        username: username.toLowerCase(),
        password: password
    };

    // Send data to the server
    fetch('/student/signin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(async response => {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `Server error: ${response.status}`);
        }
        return data;
    })
    .then(data => {
        // Handle success
        showMessage(data.message || 'Login successful!', false);
        setTimeout(() => {
            if (data.redirect) {
                window.location.href = data.redirect;
            } else {
                window.location.href = '/student/dashboard'; // Default redirect
            }
        }, 1000);
    })
    .catch(error => {
        // Handle errors
        console.error('Login error details:', error);
        showMessage('Login failed: ' + error.message);
        if (loginButton) {
            loginButton.disabled = false;
            loginButton.textContent = 'Log In';
        }
    });

    return false; // Prevent default HTML form submission
}

// Attach event listener to the login form
document.querySelector('form').addEventListener('submit', handleLoginSubmit);
  