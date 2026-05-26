function updateMemberTotal(memberId) {
    let memberTotal = 0;
    let memberIsValid = true; // Track validity for this member's inputs

    // Ensure criteria is available globally
    if (typeof criteria !== 'object' || criteria === null) {
        console.error("Criteria data is not available to the script or is not an object.");
        memberIsValid = false; // Cannot validate without criteria
    } else {
        Object.keys(criteria).forEach(key => {
            const inputId = `marks_${memberId}_${key}`;
            const errorId = `${inputId}-error`;
            const input = document.getElementById(inputId);
            const errorDiv = document.getElementById(errorId);

            if (!input) {
                console.error(`Input element with id "${inputId}" not found.`);
                memberIsValid = false;
                return; // Skip to next iteration
            }

            const value = parseFloat(input.value);
            const max = (criteria[key] && typeof criteria[key].max !== 'undefined') ? parseFloat(criteria[key].max) : NaN;

            if (errorDiv) errorDiv.textContent = ''; // Clear previous error

            if (!isNaN(value)) {
                if (isNaN(max) || value < 0 || value > max) {
                    if (errorDiv) errorDiv.textContent = `Marks must be between 0 and ${isNaN(max) ? 'N/A' : max}.`;
                    memberIsValid = false;
                } else {
                    memberTotal += value;
                }
            } else if (input.value !== '') {
                if (errorDiv) errorDiv.textContent = 'Please enter a valid number.';
                memberIsValid = false;
            } else if (input.required) {
                // Only show required error if the field is truly empty
                if (input.value.trim() === '') {
                   if (errorDiv) errorDiv.textContent = 'This field is required.';
                   memberIsValid = false;
                }
            }
        });
    }

    // Update the total display for the specific member
    const totalSpan = document.getElementById(`total_${memberId}`);
    if (totalSpan) {
        totalSpan.textContent = memberTotal.toFixed(1);
    }

    // After updating a member's total, re-check the overall form validity for the submit button
    checkOverallValidity();
}

// Function to check if ALL required fields across ALL members are valid
function checkOverallValidity() {
    console.log("Running checkOverallValidity...");
    let formIsValid = true;

    // Ensure members and criteria are available globally
    if (!Array.isArray(members) || members.length === 0) {
        console.log("Validity check failed: No members.");
        formIsValid = false; // No members to evaluate
    } else if (typeof criteria !== 'object' || criteria === null || Object.keys(criteria).length === 0) {
         console.log("Validity check failed: No criteria.");
         formIsValid = false; // No criteria defined
    } else {
        members.forEach(member => {
            if (!formIsValid) return; // Skip if already invalid

            Object.keys(criteria).forEach(key => {
                if (!formIsValid) return; // Skip if already invalid

                const inputId = `marks_${member._id}_${key}`;
                const input = document.getElementById(inputId);
                const errorId = `${inputId}-error`;
                const errorDiv = document.getElementById(errorId);

                if (!input) {
                    console.log(`Validity check failed: Input not found - ${inputId}`);
                    formIsValid = false;
                } else {
                    // Check built-in validity FIRST
                    const isValidBuiltIn = input.checkValidity();
                    if (!isValidBuiltIn) {
                        console.log(`Validity check failed (built-in): input.checkValidity() is false for ${inputId}.`);
                        console.log(`   Input Value: '${input.value}'`);
                        console.log(`   Validity State:`, JSON.stringify(input.validity));
                        formIsValid = false;
                    }
                    // THEN check our custom error message
                    else if (errorDiv && errorDiv.textContent !== '') {
                         console.log(`Validity check failed (custom): Error message present for ${inputId}: "${errorDiv.textContent}"`);
                         formIsValid = false;
                    }
                }
            });
        });
    }

    const submitButton = document.querySelector('.submit-button');
    if (submitButton) {
        console.log("Final formIsValid state:", formIsValid, "Setting submit button disabled state to:", !formIsValid);
        submitButton.disabled = !formIsValid;
    } else {
         console.log("Submit button not found.");
    }
    return formIsValid; // Return the state
}

// Initial setup on page load
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('evaluationForm');
    const submitButton = document.querySelector('.submit-button');

    // Ensure criteria and members are available globally
    if (form && typeof criteria === 'object' && criteria !== null && Array.isArray(members) && members.length > 0) {
        // Calculate initial totals for all members
        members.forEach(member => {
            updateMemberTotal(member._id); // This also calls checkOverallValidity indirectly
        });
        // Explicitly set initial button state after all members are checked
         checkOverallValidity();
    } else {
        console.log("Form, criteria, or members not available/valid on DOMContentLoaded. Disabling submit.");
         if (submitButton) submitButton.disabled = true; // Disable submit if essential parts are missing
    }
});