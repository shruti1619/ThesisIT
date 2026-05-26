document.getElementById('contact-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;

    alert('Message sent successfully!\n\nDetails:\n' +
          Name:${name} \nPhone: ${phone}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message});
});                                      