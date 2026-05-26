document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('project-form');
    const submitButton = form.querySelector('.submit-button:not([disabled])');
    const currentStage = parseInt(form.dataset.currentStage || '0', 10);
    // const maxStages = parseInt(form.dataset.maxStages || '0', 10); // Get maxStages if needed

    if (submitButton) {
        // --- EDIT: Helper function to reset button state ---
        const resetButtonState = () => {
            if (!submitButton) return;
            submitButton.disabled = false;
            // Recalculate stage number in case dataset changed (though unlikely here)
            const stageNum = parseInt(form.dataset.currentStage || '0', 10) + 1;
            submitButton.textContent = `Submit Stage ${stageNum}`;
        };
        // --- End Edit ---

        submitButton.addEventListener('click', async (event) => {
            event.preventDefault();

            const stageToSubmit = currentStage + 1;
            const activeFieldset = form.querySelector(`#seminar${stageToSubmit}-section`);
            let clientSideValid = true;

            if (activeFieldset) {
                activeFieldset.querySelectorAll('input[required], textarea[required]').forEach(input => {
                    // Reset style first
                    input.style.borderColor = '';
                    // Note: Finding label via previousElementSibling is simple but fragile.
                    // A more robust method uses IDs: form.querySelector(`label[for="${input.id}"]`)
                    const label = input.previousElementSibling;
                    if (label && label.nodeName === 'LABEL') {
                        label.style.color = '';
                    }

                    // Check validity
                    if (!input.value.trim() && input.type !== 'file') {
                        clientSideValid = false;
                        input.style.borderColor = 'red';
                        if (label && label.nodeName === 'LABEL') label.style.color = 'red';
                        console.warn(`Missing required field: ${input.name || input.id}`);
                    } else if (input.type === 'file' && input.required && !input.files.length) {
                        clientSideValid = false;
                        // Add visual indication for missing file input
                        if (label && label.nodeName === 'LABEL') label.style.color = 'red';
                        console.warn(`Missing required file: ${input.name || input.id}`);
                    }
                });
            } else {
                // This case might occur if the form structure is unexpected
                // or if trying to submit beyond the max stages somehow.
                console.error(`Could not find active fieldset for stage ${stageToSubmit}. Check form IDs and logic.`);
                alert('An internal error occurred. Cannot validate the form for the current stage.');
                return; // Prevent submission if the relevant section isn't found
            }

            if (!clientSideValid) {
                alert('Please fill in all required fields for the current stage (highlighted in red).');
                return; // Stop submission if client-side validation nfails
            }

            // If validation passes, prepare and send data
            const formData = new FormData(form);

            try {
                // Disable button and show loading state
                submitButton.disabled = true;
                submitButton.textContent = 'Submitting...';

                // Send the form data
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: formData
                });

                // Check if the server responded with a redirect
                if (response.redirected) {
                    window.location.href = response.url;
                } else {
                    // If no redirect, assume an error occurred and the server sent back JSON
                    let errorMessage = 'Submission failed. Please check your input or try again.'; // Default error
                    if (response.status >= 400) { // Check for client or server error status codes
                        try {
                            const result = await response.json(); // Try to parse error message from JSON body
                            errorMessage = `Error: ${result.error || errorMessage}`;
                        } catch (jsonError) {
                            // If response is not JSON, log it (could be HTML error page)
                            console.error('Failed to parse error response as JSON:', jsonError);
                            console.error('Server response text:', await response.text());
                        }
                    } else {
                        // Handle unexpected non-error, non-redirect responses
                        console.warn('Received an unexpected non-redirect response:', response);
                        errorMessage = 'Received an unexpected response from the server.';
                    }

                    alert(errorMessage); // Show the error message to the user

                    // --- EDIT: Use helper function ---
                    resetButtonState();
                    // --- End Edit ---
                }
            } catch (error) {
                // Handle network errors
                console.error('Error submitting project stage via fetch:', error);
                alert('A network error occurred while submitting. Please check your connection and try again.');

                // --- EDIT: Use helper function ---
                resetButtonState();
                // --- End Edit ---
            }
        });
    } // End of if(submitButton)

    // Add event listeners to inputs/textareas to clear red validation highlights on interaction
    form.querySelectorAll('input, textarea').forEach(input => {
        const clearHighlight = () => {
            input.style.borderColor = ''; // Reset border
            // Attempt to find and reset the associated label's color
            // Note: Finding label via previousElementSibling is simple but fragile.
            const label = input.previousElementSibling;
            if (label && label.tagName === 'LABEL') {
                label.style.color = ''; // Reset label color
            }
        };

        input.addEventListener('input', clearHighlight); // For text changes
        if (input.type === 'file') {
            input.addEventListener('change', clearHighlight); // For file selection changes
        }
    });

}); // End of DOMContentLoaded