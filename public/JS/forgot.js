function validateEmail() {
    const email = document.getElementById('email').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address.');
        return false;
    }
    alert('Email verified successfully!');
    return true;
}

document.getElementById('forgot-password-form').addEventListener('submit', function (event) {
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // if (newPassword.length < 6) {
    //     alert('Password should be at least 6 characters long.');
    //     event.preventDefault();
    //     return;
    // }

    if (newPassword !== confirmPassword) {
        alert('Passwords do not match.');
        event.preventDefault();
        return;
    }

    alert('Password changed successfully!');
});