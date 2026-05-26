


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
    const email = emailField.value;
    const mobile = mobileField.value;
    const validDomain = 'gmail.com';
    const maxRepeatingDigits = 5;
    
    // Validate email domain
    if (!email.includes('@') || email.split('@')[1] !== validDomain) {
        alert('Please enter a valid Gmail ID');
        return false;
    }

    // Validate mobile number length
    if (mobile.length !== 10) {
        alert('Please enter a valid 10-digit mobile number');
        return false;
    }

    // Validate repeating digits in mobile number
    let maxRepeat = 1; // Counter for consecutive repeating digits
    
    for (let i = 1; i < mobile.length; i++) {
        if (mobile[i] === mobile[i - 1]) {
            maxRepeat++; // Increase counter if current digit matches the previous one

            if (maxRepeat > maxRepeatingDigits) {
                alert('Mobile number should not contain more than 5 consecutive repeating digits');
                return false; // Return false if the limit is exceeded
            }
        } else {
            maxRepeat = 1; // Reset counter if the current digit is different
        }
    }

    alert('Account Created Successfully');
    return true; // Return true if all validations pass
}

// Allow only digits in mobile number field
function restrictInput(event) {
    const charCode = event.charCode;
    if (charCode < 48 || charCode > 57) {  // Only allow numeric values
        event.preventDefault();
    }
}


// Validate email format and domain
const emailPattern = /^[a-zA-Z][a-zA-Z0-9._]*@[a-zA-Z]+\.[a-zA-Z]{2,}$/;
if (!emailPattern.test(email)) {
    alert('Please enter a valid email address. It should not start with a number or contain invalid characters.');
    return false;
}

// Check for multiple '@' or consecutive dots
if ((email.match(/@/g) || []).length > 1 || email.includes('..')) {
    alert('Email address is invalid. It should not have multiple "@" symbols or consecutive dots.');
    return false;
}

// Ensure domain is exactly 'gmail.com'
if (email.split('@')[1] !== validDomain) {
    alert('Only Gmail addresses are allowed (e.g., yourname@gmail.com).');
    return false;
}
