function validateForm() {
    // Clear previous error messages
    document.getElementById('nameError').innerText = '';
    document.getElementById('emailError').innerText = '';
    document.getElementById('phoneError').innerText='';
    document.getElementById('messageError').innerText = '';

    let isValid = true;

    // Get form values
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const message = document.getElementById('message').value.trim();

    // Validate name
    if (name === '') {
        document.getElementById('nameError').innerText = 'Name is required.';
        isValid = false;
    }

    // Validate email
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
        document.getElementById('emailError').innerText = 'Please enter a valid email address.';
        isValid = false;
    }
    //validate phone
    const phonePattern = /^[0-9]{10}$/; //Example patter for 10-digit phone numbers
    if (!phonePattern.test(phone)) {
        document.getElementById('phoneError').innerText = 'Please enter a valid phone number';
        invalid = false;
    }

    // Validate message
    if (message.length < 10) {
        document.getElementById('messageError').innerText = 'Message must be at least 10 characters long.';
        isValid = false;
    }

    return isValid;
}