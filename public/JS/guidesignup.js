// Redirect to home page when clicking on the logo
document.querySelector('.logo').addEventListener('click', function() {
    window.location.href = 'index.html';
});

// Handle password confirmation
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirm_password');

confirmPassword.addEventListener('input', function() {
    if (password.value !== confirmPassword.value) {
        confirmPassword.setCustomValidity("Passwords do not match");
    } else {
        confirmPassword.setCustomValidity("");
    }
});

function validateForm() {
    const emailField = document.getElementById('email');
    const mobileField = document.getElementById('mobile');
    const academicYearField = document.getElementById('academicYear');
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    const email = emailField.value;
    const mobile = mobileField.value;
    const academicYear = academicYearField.value;
    const username = usernameField.value;
    const password = passwordField.value;
    const validDomain = 'gmail.com';

    // Validate academic year format
    const academicYearPattern = /^\d{4}-\d{4}$/;
    if (!academicYearPattern.test(academicYear)) {
        alert('Please enter academic year in format YYYY-YYYY (e.g., 2023-2024)');
        return false;
    }

    // Validate email format and domain
    const emailPattern = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)$/;
    if (!emailPattern.test(email)) {
        alert('Please enter a valid email address. It should not start with a number or contain invalid characters.');
        return false;
    }

    if ((email.match(/@/g) || []).length > 1 || email.includes('..')) {
        alert('Email address is invalid. It should not have multiple "@" symbols or consecutive dots.');
        return false;
    }

    // Validate mobile number format (Indian 10-digit)
    const mobilePattern = /^[6-9]\d{9}$/;
    if (!mobilePattern.test(mobile)) {
        alert('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9');
        return false;
    }

    // Validate password (at least 6 characters, including a symbol)
    const passwordPattern = /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
    if (!passwordPattern.test(password)) {
        alert('Password must be at least 6 characters long and include at least one symbol');
        return false;
    }

    // If validation passes, submit the form data to backend
    const formData = {
        name: document.getElementById('name').value,
        email: email,
        mobile: mobile,
        username: username,
        password: password,
        academicYear: academicYear
    };

    // Log the form data before sending
    console.log('Submitting form data:', formData);

    fetch('/guide/register', {
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
        alert('Account Created Successfully'); // Show alert
        window.location.href = '/guide/signin';  // Redirect to sign-in page
    })
    .catch(error => {
        console.error('Registration error details:', {
            message: error.message,
            error: error
        });
        alert('Error creating account: ' + error.message);
    });

    return false; // Prevent default form submission
}

// Allow only digits in mobile number field
function restrictInput(event) {
    const charCode = event.charCode;
    if (charCode < 48 || charCode > 57) {
        event.preventDefault();
    }
}

// Allow only digits and hyphen in academic year field
function restrictAcademicYearInput(event) {
    const charCode = event.charCode;
    // Allow numbers (48-57) and hyphen (45)
    if ((charCode < 48 || charCode > 57) && charCode !== 45) {
        event.preventDefault();
    }
}

// Add event listener for academic year input
document.getElementById('academicYear').addEventListener('keypress', restrictAcademicYearInput);