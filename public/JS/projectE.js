function showPopup() {
    document.getElementById("popup").style.display = "block";
}

function hidePopup() {
    document.getElementById("popup").style.display = "none";
}

// function showSeminars(semester) {
//     document.getElementById("seminar-popup").style.display = "block";
//     document.getElementById("popup").style.display = "none";
//     document.getElementById("seminar-title").innerText = semester + " Seminar Options";
// }

function showSeminars(semester) {
    document.getElementById("popup").style.display = "none"; // Hide main popup

    if (semester === '7th') {
        document.getElementById("seminar-popup").style.display = "block";
        document.getElementById("seminar-title").innerText = "7th Semester Seminar Options";
        document.getElementById("seminar-popup-options").innerHTML = `
             <button class="popup-option">Progress Seminar 1</button>
            <button class="popup-option">Progress Seminar 2</button>
            <button class="popup-option">Final Seminar</button>
        `;
    } 
    else if (semester === '8th') {
        document.getElementById("seminar-popup").style.display = "block";
        document.getElementById("seminar-title").innerText = "8th Semester Seminar Options";
        document.getElementById("seminar-popup-options").innerHTML = `
            <button class="popup-option">Progress Seminar 1</button>
            <button class="popup-option">Progress Seminar 2</button>
            <button class="popup-option">Final Seminar</button>
        `;
    } 
    else if (semester === 'final') {
        // For Final Submission, do nothing and just close popup
        alert("Final Submission Selected");
    }
}

function hideSeminarPopup() {
    document.getElementById("seminar-popup").style.display = "none";
}

function showInternalExternalPopup() {
    document.getElementById("internal-external-popup").style.display = "block";
}

function hideInternalExternalPopup() {
    document.getElementById("internal-external-popup").style.display = "none";
}