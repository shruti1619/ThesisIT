// Redirect to home page when clicking on the logo
document.querySelector('.logo').addEventListener('click', function() {
    window.location.href = '/'; // Adjust if your home page URL is different
});

// Handle password confirmation
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm_password');

if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', function() {
        if (passwordInput.value !== confirmPasswordInput.value) {
            confirmPasswordInput.setCustomValidity("Passwords do not match");
        } else {
            confirmPasswordInput.setCustomValidity("");
        }
    });
}

// Function to restrict input to digits only
function restrictInput(event) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        event.preventDefault();
    }
}

// Function to validate the form
function validateForm() {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const prn = document.getElementById('prn').value.trim();
    const rollNo = document.getElementById('rollNo').value.trim();
    const year = document.getElementById('year').value;
    const academicYear = document.getElementById('academicYear').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;

    // Basic validation
    if (!name || !email || !prn || !rollNo || !year || !academicYear || !mobile || !username || !password || !confirmPassword) {
        alert('Please fill out all fields.');
        return false;
    }

    // Password match validation
    if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return false;
    }

    // Mobile number validation
    if (mobile.length !== 10) {
        alert('Mobile number must be 10 digits.');
        return false;
    }

    // Academic year format validation
    const academicYearRegex = /^\d{4}-\d{2}$/;
    if (!academicYearRegex.test(academicYear)) {
        alert('Academic year must be in the format YYYY-YY.');
        return false;
    }

    // Prepare form data
    const formData = {
        name,
        email,
        prn,
        rollNo,
        year,
        academicYear,
        mobile,
        username,
        password
    };

    // Send data to the server
    fetch('/student/register', {
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
        // Show alert and redirect after user clicks "OK"
        alert('Account Created Successfully');
        window.location.href = '/student/signin';  // Redirect to sign-in page
    })
    .catch(error => {
        console.error('Registration error details:', error);
        alert('Error creating account: ' + error.message);
    });

    return false; // Prevent default form submission
}

// Attach event listeners
document.getElementById('mobile').addEventListener('keypress', restrictInput);