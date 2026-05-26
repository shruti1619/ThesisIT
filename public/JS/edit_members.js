document.addEventListener('DOMContentLoaded', function() {
    const member = JSON.parse(localStorage.getItem('member'));

    if (member) {
        document.getElementById('edit-team-name').value = member.teamName;
        document.getElementById('edit-leader-name').value = member.leader.name;
        document.getElementById('edit-leader-email').value = member.leader.email;
        document.getElementById('edit-leader-mobile').value = member.leader.mobile;

        document.getElementById('edit-member1-name').value = member.members[0].name;
        document.getElementById('edit-member1-email').value = member.members[0].email;
        document.getElementById('edit-member1-mobile').value = member.members[0].mobile;

        document.getElementById('edit-member2-name').value = member.members[1].name;
        document.getElementById('edit-member2-email').value = member.members[1].email;
        document.getElementById('edit-member2-mobile').value = member.members[1].mobile;

        document.getElementById('edit-member3-name').value = member.members[2].name;
        document.getElementById('edit-member3-email').value = member.members[2].email;
        document.getElementById('edit-member3-mobile').value = member.members[2].mobile;

        document.getElementById('edit-member4-name').value = member.members[3].name;
        document.getElementById('edit-member4-email').value = member.members[3].email;
        document.getElementById('edit-member4-mobile').value = member.members[3].mobile;
    }

    document.getElementById('edit-member-form').addEventListener('submit', function(event) {
        event.preventDefault();

        const updatedMember = {
            teamName: document.getElementById('edit-team-name').value,
            leader: {
                name: document.getElementById('edit-leader-name').value,
                email: document.getElementById('edit-leader-email').value,
                mobile: document.getElementById('edit-leader-mobile').value
            },
            members: [
                {
                    name: document.getElementById('edit-member1-name').value,
                    email: document.getElementById('edit-member1-email').value,
                    mobile: document.getElementById('edit-member1-mobile').value
                },
                {
                    name: document.getElementById('edit-member2-name').value,
                    email: document.getElementById('edit-member2-email').value,
                    mobile: document.getElementById('edit-member2-mobile').value
                },
                {
                    name: document.getElementById('edit-member3-name').value,
                    email: document.getElementById('edit-member3-email').value,
                    mobile: document.getElementById('edit-member3-mobile').value
                },
                {
                    name: document.getElementById('edit-member4-name').value,
                    email: document.getElementById('edit-member4-email').value,
                    mobile: document.getElementById('edit-member4-mobile').value
                }
            ]
        };

        localStorage.setItem('member', JSON.stringify(updatedMember));

        // You can add functionality to save changes to a server or database here
        window.location.href = 'index.html'; // Redirect back to the student dashboard
    });
});
