document.addEventListener('DOMContentLoaded', () => {
    const teamForm = document.getElementById('team-form');
    const leaderInfoDiv = document.getElementById('leader-section');
    const guideSelect = document.getElementById('guideId');
    const membersContainer = document.querySelector('.members-container');
    const membersInstructionP = document.getElementById('members-instruction');

    function showMessage(message, isError = false) {
        document.querySelectorAll('.container > .message').forEach(msg => msg.remove());

        const div = document.createElement('div');
        div.className = `message ${isError ? 'error' : 'success'}`;
        div.innerHTML = message;

        teamForm.parentNode.insertBefore(div, teamForm);
        window.scrollTo(0, 0);
    }

    // Fetch Leader Info + Guide List using GET
    fetch('/student/create-group', {
        method: 'GET',  // changed from POST to GET
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
    })
    .then(response => {
        if (response.status === 401 || response.status === 403) {
            window.location.href = '/student/signin';
            return Promise.reject('Unauthorized');
        }
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err.error || `HTTP error: ${response.status}`));
        }
        return response.json();
    })
    .then(data => {
        const leader = data.leader;

        if (!leaderInfoDiv || !leader) {
            showMessage('Could not load leader info.', true);
            return;
        }

        if (leader.groupId) {
            showMessage('You are already part of a group. You cannot create a new one.', true);
            teamForm.querySelectorAll('input, select, button').forEach(el => el.disabled = true);
            return;
        }

        leaderInfoDiv.innerHTML = `
            <h3>Team Leader (You)</h3>
            <p>Name: <span id="leader-name">${leader.name}</span></p>
            <p>Email: <span id="leader-email">${leader.email}</span></p>
            <p>Roll No: <span id="leader-rollno">${leader.rollNo}</span></p>
            <p>Academic Year: <span id="leader-academic-year">${leader.academicYear}</span></p>
            <p>Year: <span id="leader-year">${leader.year}</span></p>
            <input type="hidden" name="leaderId" value="${leader._id}">
            <input type="hidden" name="academicYear" value="${leader.academicYear}">
            <input type="hidden" name="year" value="${leader.year}">
            <label for="leader-contribution">Your Contribution</label>
            <input type="text" id="leader-contribution" name="leaderContribution" placeholder="Enter your contribution" required>
        `;

        // Populate guides dropdown
        if (guideSelect && data.guides) {
            guideSelect.innerHTML = '<option value="" disabled selected>-- Select Guide --</option>';
            data.guides.forEach(guide => {
                const option = document.createElement('option');
                option.value = guide._id;
                option.textContent = guide.name;
                guideSelect.appendChild(option);
            });
        }

        if (membersInstructionP) {
            membersInstructionP.innerHTML = `Please add 4 other members from your class (<span>${leader.year} Year, ${leader.academicYear}</span>).`;
        }

        // Populate member input fields
        if (membersContainer) {
            membersContainer.innerHTML = '';
            for (let i = 1; i <= 4; i++) {
                const memberDiv = document.createElement('div');
                memberDiv.className = 'member';
                memberDiv.innerHTML = `
                    <label for="member${i}_identifier">Member ${i} Identifier</label>
                    <input type="text" id="member${i}_identifier" name="memberIdentifiers" class="member-identifier" placeholder="Enter Roll No or Email" required>
                    <label for="member${i}_contribution">Member ${i} Contribution</label>
                    <input type="text" id="member${i}_contribution" name="memberContributions" class="member-contribution" placeholder="Enter Contribution" required>
                `;
                membersContainer.appendChild(memberDiv);
            }
        }
    })
    .catch(error => {
        if (error !== 'Unauthorized') {
            showMessage(error || 'Something went wrong. Please try again.', true);
        }
    });

    // Form Submit Handler
    if (teamForm) {
        teamForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            document.querySelectorAll('.container > .message').forEach(msg => msg.remove());

            const formData = new FormData(teamForm);

            // Collect values
            const data = {
                groupName: formData.get('groupName'),
                groupNumber: formData.get('groupNumber'),
                guideId: formData.get('guideId'),
                leaderId: formData.get('leaderId'),
                academicYear: formData.get('academicYear'),
                year: formData.get('year'),
                leaderContribution: formData.get('leaderContribution'),
                memberIdentifiers: Array.from(document.querySelectorAll('.member-identifier')).map(el => el.value.trim()).filter(Boolean),
                memberContributions: Array.from(document.querySelectorAll('.member-contribution')).map(el => el.value.trim()).filter(Boolean)
            };

            // Basic validation
            if (!data.groupName || !data.groupNumber) {
                return showMessage('Team Name and Group Number are required.', true);
            }
            if (!data.guideId) {
                return showMessage('Please select a project guide.', true);
            }
            if (!data.leaderContribution) {
                return showMessage('Please enter your contribution.', true);
            }
            if (data.memberIdentifiers.length !== 4) {
                return showMessage('Please enter identifiers for exactly 4 members.', true);
            }
            if (data.memberContributions.length !== 4) {
                return showMessage('Please enter contribution for each member.', true);
            }

            try {
                const response = await fetch('/student/create-group', {
                    method: 'POST', // changed from GET to POST
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(data)
                });

                const resData = await response.json();

                if (!response.ok) {
                    // Support multiple errors array or single error string
                    const errorMsg = resData.errors ? resData.errors.join('<br>') : (resData.error || 'Unknown error');
                    return showMessage(errorMsg, true);
                }

                showMessage(resData.message || 'Team created successfully!');
                teamForm.reset();
                setTimeout(() => {
                    window.location.href = '/student/dashboard'; // Redirect after success
                }, 1500);
            } catch (err) {
                showMessage('Error submitting form. Try again later.', true);
                console.error('Submit error:', err);
            }
        });
    }
});
