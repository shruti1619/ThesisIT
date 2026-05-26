const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../modal/student'); // Import the Student model
const Group = require('../modal/group');     // Import the Group model
const ProjectGuide = require('../modal/projectGuide'); // Import the ProjectGuide model
const Project = require('../modal/project'); // Import the Project model
const { ensureAuthenticated, isStudent, isGroupLeader } = require('../middlewares/auth'); // Adjust path
const Evaluation = require('../modal/evaluation');
const multer = require('multer');
const fs = require('fs');
const path = require('path'); // Make sure 'path' module is required at the top

// Validation middleware for Student registration
const validateStudentRegistration = (req, res, next) => {
    const { name, email, prn, year, mobile, password, username, rollNo, academicYear } = req.body;

    if (!name || !email || !prn || !year || !mobile || !password || !username || !rollNo || !academicYear) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)$/;
    if (!emailRegex.test(email.toLowerCase())) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    // Mobile validation (10 digits)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile)) {
        return res.status(400).json({ error: "Mobile number must be 10 digits" });
    }

    // Password validation (minimum 6 characters)
    if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    next();
};

// Registration route for Student
router.post("/register", validateStudentRegistration, async (req, res) => {
    try {
        const { name, email, prn, year, mobile, password, username, rollNo, academicYear } = req.body;

        // Check if any field matches an existing student
        const existStudent = await Student.findOne({
            $or: [
                { email: email.toLowerCase() },
                { prn },
                { rollNo: rollNo.trim() },
                { mobile },
                { username }
            ]
        });

        if (existStudent) {
            let errorMessage = "A student with the same ";
            if (existStudent.email === email.toLowerCase()) errorMessage += "email, ";
            if (existStudent.prn === prn) errorMessage += "PRN, ";
            if (existStudent.rollNo === rollNo.trim()) errorMessage += "roll number, ";
            if (existStudent.mobile === mobile) errorMessage += "mobile, ";
            if (existStudent.username === username) errorMessage += "username, ";
            errorMessage = errorMessage.slice(0, -2) + " already exists.";
            return res.status(400).json({ error: errorMessage });
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new student
        const newStudent = await Student.create({
            name,
            email: email.toLowerCase(),
            prn,
            year,
            mobile,
            username,
            password: hashedPassword,
            rollNo: rollNo.trim(),
            academicYear
        });

        // Generate JWT token
        const token = jwt.sign({ email: newStudent.email, studentId: newStudent._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // Send response
        res.cookie("token", token).json({ message: "Student registration successful" });

    } catch (error) {
        console.error('Student registration error:', error);
        res.status(500).json({ error: error.message });
    }
});
router.get('/signin', (req, res) => {
    res.render('loginStud_FinalY');
});

// --- Updated Final Year Dashboard Route (WITH Flash Messages, Project Data, and Feedback Data) ---
// --- Updated Final Year Dashboard Route ---
router.get('/finaldash', ensureAuthenticated, isStudent, async (req, res) => {
    try {
        // Fetch the logged-in student's data
        const student = await Student.findById(req.user.studentId)
            .populate({
                path: 'groupId',
                populate: [
                    { path: 'members', select: 'name email rollNo _id' },
                    { path: 'guideId', select: 'name email' },
                    { path: 'leader', select: '_id' }
                ]
            });

        if (!student) {
            req.flash('error_msg', 'Could not find your profile.');
            return res.redirect('/student/signin');
        }

        let isLeader = false;
        let project = null;
        let feedbackData = [];

        if (student.groupId) {
            // Determine if the student is the leader
            isLeader = student.groupId.leader && student.groupId.leader._id.equals(student._id);

            // Fetch the project associated with the group
            project = await Project.findOne({ groupId: student.groupId._id });

            // --- Fetch Evaluations (Feedback) for the group ---
            const evaluations = await Evaluation.find({ groupId: student.groupId._id })
                                                .sort({ seminarNumber: 1 }) // Sort by seminar number
                                                .select('seminarNumber feedback'); // Select only needed fields

            // --- Prepare feedback data for the view ---
            feedbackData = evaluations.map(ev => ({
                seminar: ev.seminarNumber,
                // Provide default text if feedback is null, undefined, or empty string
                feedback: ev.feedback ? ev.feedback.trim() : "No feedback provided yet."
            }));
            // --- End Feedback Fetching ---
        }

        // --- Fetch Unique Project Domains ---
        const uniqueDomains = await Project.distinct('projectDomain');
        // Filter out any null or empty string domains if necessary
        const validDomains = uniqueDomains.filter(domain => domain && domain.trim() !== '');

        // Render the dashboard, passing all necessary data including domains
        res.render('finalDash', {
            student: student,
            isLeader: isLeader,
            project: project,
            feedbackData: feedbackData,
            projectDomains: validDomains, // <-- Pass the domains here
            success_msg: req.flash('success_msg'),
            error_msg: req.flash('error_msg')
        });

    } catch (error) {
        console.error("Error loading final year dashboard:", error);
        req.flash('error_msg', 'Error loading dashboard. Please try again.');
        res.redirect('/student/signin');
    }
});

router.get('/nfinaldash', ensureAuthenticated, isStudent, async (req, res) => {
    try {
      // --- Fetch Unique Project Domains ---
      const uniqueDomains = await Project.distinct('projectDomain');
      const validDomains = uniqueDomains.filter(domain => domain && domain.trim() !== '');
      // --- End Domain Fetching ---
  
      res.render('nfinalDash', {
        projectDomains: validDomains, // <-- Pass domain list to EJS
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg')
      });
  
    } catch (error) {
      console.error("Error loading non-final dashboard:", error);
      req.flash('error_msg', 'Error loading dashboard. Please try again.');
      res.redirect('/student/signin');
    }
  });

// Login route for Student
router.post("/signin", async (req, res) => {
    
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        const student = await Student.findOne({ username });
        if (!student) {
            console.log('Student not found for username:', username);
            return res.status(400).json({ error: "Invalid credentials" });
        }0

        // Compare the entered password with the hashed password
        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) {
            console.log(`Login Error: Password mismatch for student: ${student.username}`);
            return res.status(400).json({ error: "Invalid credentials" }); // Keep generic error
        }
        // If credentials are correct, generate a token
        const token = jwt.sign({ username: student.username, studentId: student._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        console.log('Token generated.');

        // Send response
        res.cookie("token", token).json({
            message: "Login successful",
            token,
            student: {
                email: student.email,
                name: student.name,
                year: student.year
            },
            redirect: (student.year === "final" || student.year === "third") ? "/student/finaldash" : "/student/nfinaldash"
        });

    } catch (error) {
        console.error('Student login error:', error);
        // Avoid sending detailed error messages to the client in production
        res.status(500).json({ error: "An internal server error occurred during login." });
        
    }
});


// --- NEW: Group Creation Routes ---
router.get('/add-members-page', ensureAuthenticated, isStudent, (req, res) => {
    try {
        // Simply render the EJS template.
        // The client-side JS included in this template will then fetch data from '/student/create-group'.
        res.render('addmembers', {
             // No need to pass leader or guides here, the client-side JS will fetch them.
             // You could pass the base user info from the token if needed immediately by EJS, but it's optional.
             user: req.user // Pass basic user info if needed by the template layout
        });
    } catch (error) {
        console.error("Error rendering addmembers page:", error);
        // Handle rendering errors, maybe redirect to dashboard or show an error page
        res.status(500).send("Error loading the page. Please try again.");
        // Or render an error EJS template: res.render('errorPage', { message: '...' });
    }
});

// Route to display the form
// Protect with ensureAuthenticated and isStudent
router.get('/create-group', ensureAuthenticated, isStudent, async (req, res) => {
    try {
        // Fetch the logged-in student (leader) data using the ID from the JWT payload
        const leader = await Student.findById(req.user.studentId); // Use req.user.studentId
        if (!leader) {
            // Using JSON response consistent with login/register
            return res.status(404).json({ error: 'Could not find your student profile.' });
        }
        // Fetch available project guides
        const guides = await ProjectGuide.find({}, 'id name'); // Fetch only necessary fields

         res.status(200).json({ leader, guides });

    } catch (error) {
        console.error("Error fetching data for create group page:", error);
        // Using JSON response
        res.status(500).json({ error: 'Error loading page data. Please try again.' });
    }
});

router.post('/create-group', ensureAuthenticated, isStudent, async (req, res) => {
    const { groupName, groupNumber, guideId, leaderId, academicYear, year, memberIdentifiers, leaderContribution, memberContributions } = req.body;
    // Get leader info from JWT payload stored in req.user by ensureAuthenticated
    const leaderInfoFromToken = req.user;

    // Basic check: Ensure leaderId from form matches logged-in user's ID from token
    if (leaderInfoFromToken.studentId !== leaderId) {
        return res.status(403).json({ error: 'Authentication mismatch.' });
    }

    // Ensure memberIdentifiers is always an array and has 4 entries
    const identifiers = Array.isArray(memberIdentifiers) ? memberIdentifiers.map(id => id.trim()).filter(id => id) : [memberIdentifiers].filter(id => id);
    if (identifiers.length !== 4) {
        return res.status(400).json({ error: 'Please provide identifiers for exactly 4 members.' });
    }

    // Ensure memberContributions is always an array and matches identifiers length
    const contributions = Array.isArray(memberContributions) ? memberContributions.map(contribution => contribution.trim()) : [memberContributions];
    if (contributions.length !== identifiers.length) {
        return res.status(400).json({ error: 'Please provide contributions for each member.' });
    }

    // Fetch full leader document needed for validation checks (email, rollNo, etc.)
    let leader;
    try {
        leader = await Student.findById(leaderInfoFromToken.studentId);
        if (!leader) {
             return res.status(404).json({ error: 'Leader profile not found.' });
        }
         // Double check leader isn't already in a group (might have changed since GET request)
         if (leader.groupId) {
             return res.status(400).json({ error: 'You are already part of a group.' });
         }
    } catch (err) {
         console.error("Error fetching leader details:", err);
         return res.status(500).json({ error: 'Error fetching leader details.' });
    }


    // Prevent leader from adding themselves using fetched leader data
    if (identifiers.some(id => id.toLowerCase() === leader.email.toLowerCase() || id === leader.rollNo)) {
         return res.status(400).json({ error: 'You cannot add yourself as a team member.' });
    }

    // Check for duplicate identifiers entered in the form
    const uniqueIdentifiers = new Set(identifiers.map(id => id.toLowerCase()));
    if (uniqueIdentifiers.size !== identifiers.length) {
        return res.status(400).json({ error: 'Duplicate member identifiers entered.' });
    }

    let memberDocs = [];
    let errorMessages = [];

    try {
        // 1. Validate Group Number Uniqueness (within the same academic year and year)
        const existingGroup = await Group.findOne({ groupNumber, academicYear, year });
        if (existingGroup) {
            errorMessages.push(`Group number ${groupNumber} is already taken for ${academicYear}, ${year} year.`);
        }

        // 2. Find and Validate Members
        for (const [index, identifier] of identifiers.entries()) {
            const member = await Student.findOne({
                $or: [{ email: identifier.toLowerCase() }, { rollNo: identifier }]
            });

            if (!member) {
                errorMessages.push(`Student with identifier "${identifier}" not found.`);
                continue;
            }
            if (member.id === leader.id) {
                 errorMessages.push(`You (${identifier}) cannot be added as a member.`);
                 continue;
            }
            if (member.groupId) {
                errorMessages.push(`Student ${member.name} (${identifier}) is already in a group.`);
            }
            if (member.academicYear !== academicYear || member.year !== year) {
                errorMessages.push(`Student ${member.name} (${identifier}) is not in the same class (${year} year, ${academicYear}).`);
            }
            memberDocs.push({ member, contribution: contributions[index] });
        }

        // 3. Check if exactly 4 valid members were found
        if (memberDocs.length !== 4) {
             errorMessages.push(`Could not validate all 4 members. Found ${memberDocs.length} valid members.`);
        }

        // 4. Check if the selected guide exists
        const guide = await ProjectGuide.findById(guideId);
        if (!guide) {
            errorMessages.push('Selected Project Guide not found.');
        }

        // 5. If any errors occurred, return them
        if (errorMessages.length > 0) {
            // Return JSON error response
            return res.status(400).json({ errors: errorMessages });
        }

        // --- All Validations Passed ---

        // 6. Create the Group
        const memberIds = memberDocs.map(m => m.member._id);
        const allMemberIds = [leader._id, ...memberIds];

        const contributionsData = [
            { memberId: leader._id, contribution: leaderContribution },
            ...memberDocs.map(m => ({ memberId: m.member._id, contribution: m.contribution }))
        ];

        const newGroup = new Group({
            groupName,
            groupNumber,
            leader: leader._id,
            members: allMemberIds,
            contributions: contributionsData, // Add contributions data
            academicYear,
            year,
            guideId,
        });
        const savedGroup = await newGroup.save();

        // 7. Update Student Records
        await Student.findByIdAndUpdate(leader._id, { groupId: savedGroup._id, teamRole: 'leader' });
        const memberUpdatePromises = memberIds.map(memberId =>
            Student.findByIdAndUpdate(memberId, { groupId: savedGroup._id, teamRole: 'member' })
        );
        await Promise.all(memberUpdatePromises);

        // 8. Success Response
        res.status(201).json({ message: 'Team created successfully!', group: savedGroup });

    } catch (error) {
        console.error("Error creating group:", error);
        // Handle potential duplicate key errors from Mongoose if unique constraints fail
        if (error.code === 11000) {
             return res.status(400).json({ error: 'Group creation failed due to duplicate information (e.g., group number).' });
        }
        res.status(500).json({ error: 'An unexpected error occurred while creating the team.' });
    }
});


// --- Logout Route (Example) ---
router.get('/logout', (req, res) => {
    res.clearCookie('token'); 
    res.redirect('/student/signin');
    
});


// POST route to handle editing team members
router.post('/edit-members', ensureAuthenticated, isStudent, isGroupLeader, async (req, res) => {
    const groupId = req.group._id; // isGroupLeader middleware ensures req.group exists
    let membersToKeep = req.body.membersToKeep || []; // IDs of members to keep
    let newMemberIdentifiers = req.body.newMemberIdentifiers || []; // Identifiers (email/roll) of new members
    let newMemberContributions = req.body.newMemberContributions || []; // Contributions of new members

    // Ensure membersToKeep is always an array
    if (!Array.isArray(membersToKeep)) {
        membersToKeep = [membersToKeep];
    }
    membersToKeep = membersToKeep.map(id => id.toString()); // Ensure they are strings for comparison

    // Ensure newMemberIdentifiers and newMemberContributions are always arrays
    if (!Array.isArray(newMemberIdentifiers)) {
        newMemberIdentifiers = newMemberIdentifiers ? [newMemberIdentifiers] : [];
    }
    if (!Array.isArray(newMemberContributions)) {
        newMemberContributions = newMemberContributions ? [newMemberContributions] : [];
    }

    // --- Validation: Check if number of new identifiers matches contributions ---
    if (newMemberIdentifiers.length !== newMemberContributions.length) {
        req.flash('error_msg', 'Mismatch between the number of new members and their contributions.');
        return res.redirect('/student/finaldash');
    }

    try {
        // --- Populate contributions along with members ---
        const group = await Group.findById(groupId)
                                 .populate('members', '_id name') // Populate members to get their IDs and names
                                 .populate('contributions.memberId', '_id'); // Populate memberId within contributions

        if (!group) {
            req.flash('error_msg', 'Group not found.');
            return res.redirect('/student/finaldash');
        }

        const currentMemberIds = group.members.map(m => m._id.toString());
        const leaderId = group.leader.toString(); // Get leader ID as string

        // --- Identify members to remove (excluding the leader) ---
        const membersToRemove = currentMemberIds.filter(id => !membersToKeep.includes(id) && id !== leaderId);

        // --- Calculate how many slots are available ---
        const currentMemberCount = membersToKeep.length; // Count members intended to be kept
        const slotsAvailable = 5 - currentMemberCount;

        // --- Validate number of new members ---
        if (newMemberIdentifiers.length > slotsAvailable) {
            req.flash('error_msg', `You can only add ${slotsAvailable} more member(s).`);
            return res.redirect('/student/finaldash');
        }

        // Validate and add new members
        let newMemberDocs = []; // Will store { member: doc, contribution: '...' }
        let errorMessages = [];

        for (let i = 0; i < newMemberIdentifiers.length; i++) {
            const identifier = newMemberIdentifiers[i].trim();
            const contribution = newMemberContributions[i].trim();

            if (!identifier || !contribution) {
                errorMessages.push(`Identifier and contribution are required for new member #${i + 1}.`);
                continue;
            }

            const member = await Student.findOne({
                $or: [{ email: identifier.toLowerCase() }, { rollNo: identifier }]
            });

            if (!member) {
                errorMessages.push(`Student with identifier "${identifier}" not found.`);
                continue;
            }
            // Check if the new member is already in the 'keep' list or is the leader
            if (membersToKeep.includes(member._id.toString()) || member._id.toString() === leaderId) {
                 errorMessages.push(`Student ${member.name} (${identifier}) is already in the team.`);
                 continue;
            }
            // Check if the new member is already in *another* group
            if (member.groupId && !member.groupId.equals(groupId)) {
                errorMessages.push(`Student ${member.name} (${identifier}) is already in another group.`);
                continue;
            }
             // Check class consistency (optional but recommended)
             if (member.academicYear !== group.academicYear || member.year !== group.year) {
                 errorMessages.push(`Student ${member.name} (${identifier}) is not in the same class (${group.year} year, ${group.academicYear}).`);
                 continue;
             }

            newMemberDocs.push({ member: member, contribution: contribution });
        }

        if (errorMessages.length > 0) {
            req.flash('error_msg', errorMessages.join(' '));
            return res.redirect('/student/finaldash');
        }

        // --- Update the Group ---
        // 1. Update Members Array
        const finalMemberIds = [...membersToKeep, ...newMemberDocs.map(doc => doc.member._id)];
        group.members = finalMemberIds;

        // 2. Update Contributions Array
        // Filter out contributions of removed members
        const keptContributions = group.contributions.filter(c => membersToKeep.includes(c.memberId._id.toString()));
        // Create contribution objects for new members
        const newContributions = newMemberDocs.map(doc => ({
            memberId: doc.member._id,
            contribution: doc.contribution
        }));
        // Combine kept and new contributions
        group.contributions = [...keptContributions, ...newContributions];

        await group.save();

        // --- Update Student Records ---
        // 1. Update removed Students: Set their groupId to null and teamRole to null/undefined
        if (membersToRemove.length > 0) {
            await Student.updateMany(
                { _id: { $in: membersToRemove } },
                { $unset: { groupId: "", teamRole: "" } } // Or set to null
            );
        }

        // 2. Update new Students: Set their groupId and teamRole
        if (newMemberDocs.length > 0) {
            await Student.updateMany(
                { _id: { $in: newMemberDocs.map(doc => doc.member._id) } },
                { $set: { groupId: groupId, teamRole: 'member' } }
            );
        }

        req.flash('success_msg', 'Group members updated successfully.');
        res.redirect('/student/finaldash');

    } catch (error) {
        console.error("Error updating group members:", error);
        req.flash('error_msg', 'Failed to update group members. Please try again.');
        res.redirect('/student/finaldash');
    }
});

// --- NEW ROUTE: Edit Only Contributions ---
router.post('/edit-contributions', ensureAuthenticated, isStudent, isGroupLeader, async (req, res) => {
    const groupId = req.group._id; // Provided by isGroupLeader middleware
    const contributionsUpdate = req.body.contributions; // Expecting an array: [{ memberId: '...', contribution: '...' }, ...]

    // --- Add Log: Check received data ---
    console.log('--- Received /edit-contributions request ---');
    console.log('Group ID:', groupId);
    console.log('Received contributions data:', JSON.stringify(contributionsUpdate, null, 2)); // Log the received data clearly

    // Basic validation of input format
    if (!Array.isArray(contributionsUpdate) || contributionsUpdate.length === 0) {
        console.log('Validation Failed: Input is not a non-empty array.'); // Log validation failure
        req.flash('error_msg', 'Invalid contribution data submitted.');
        return res.redirect('/student/finaldash');
    }

    try {
        const group = await Group.findById(groupId).populate('members', '_id'); // Get current member IDs
        if (!group) {
            console.log('Error: Group not found for ID:', groupId); // Log error
            req.flash('error_msg', 'Group not found.');
            return res.redirect('/student/finaldash');
        }

        const currentMemberIds = group.members.map(m => m._id.toString());
        const providedMemberIds = contributionsUpdate.map(c => c.memberId ? c.memberId.toString() : null).filter(id => id); // Filter out nulls just in case

        // --- Add Logs: Check member IDs ---
        console.log('Current Member IDs in Group:', currentMemberIds);
        console.log('Member IDs in Submitted Data:', providedMemberIds);

        // Validate: Ensure contributions are provided for all current members and only current members
        const memberIdsMatch = currentMemberIds.length === providedMemberIds.length && currentMemberIds.every(id => providedMemberIds.includes(id)) && providedMemberIds.every(id => currentMemberIds.includes(id)); // More robust check
        console.log('Do member IDs match?', memberIdsMatch); // Log validation result
        if (!memberIdsMatch) {
             req.flash('error_msg', 'Contribution data does not match current team members.');
             return res.redirect('/student/finaldash');
        }

        // Validate: Ensure each contribution object has memberId and contribution text
        let invalidItemFound = false;
        for (const item of contributionsUpdate) {
            if (!item.memberId || typeof item.contribution !== 'string' || item.contribution.trim() === '') {
                console.log('Validation Failed: Invalid contribution item:', item); // Log invalid item
                invalidItemFound = true;
                break; // Exit loop early
            }
        }
        if (invalidItemFound) {
            req.flash('error_msg', 'Each member must have a non-empty contribution specified.');
            return res.redirect('/student/finaldash');
        }

        // --- Add Log: Show data before saving ---
        const contributionsToSave = contributionsUpdate.map(c => ({
            memberId: c.memberId,
            contribution: c.contribution.trim()
        }));
        console.log('Contributions array prepared for saving:', JSON.stringify(contributionsToSave, null, 2));

        // Update the contributions array in the group document
        group.contributions = contributionsToSave;

        // Save the updated group document
        await group.save();
        console.log('Group contributions saved successfully.'); // Log success

        req.flash('success_msg', 'Team contributions updated successfully.');
        res.redirect('/student/finaldash');

    } catch (error) {
        // --- Add Log: Log the specific error ---
        console.error("Error updating contributions:", error);
        // Handle potential validation errors from Mongoose save() if any
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            req.flash('error_msg', `Update failed: ${messages.join(', ')}`);
        } else {
            req.flash('error_msg', 'Failed to update contributions due to a server error.');
        }
        res.redirect('/student/finaldash');
    }
});
// --- END NEW ROUTE ---


// POST route to handle disbanding the team
router.post('/disband-team', ensureAuthenticated, isStudent, isGroupLeader, async (req, res) => {
    const groupId = req.group._id;
    const memberIds = req.group.members; // Get member IDs from the populated group

    try {
        // Update all members: Set their groupId to null (or unset)
        await Student.updateMany(
            { _id: { $in: memberIds } },
            { $unset: { groupId: "" } } // Or { $set: { groupId: null } }
        );

        // Delete the Group document itself
        await Group.findByIdAndDelete(groupId);

        req.flash('success_msg', 'Team disbanded successfully.');
        res.redirect('/student/finaldash'); // Redirect back to dashboard

    } catch (error) {
        console.error("Error disbanding team:", error);
        req.flash('error_msg', 'Failed to disband the team. Please try again.');
        res.redirect('/student/finaldash');
    }
});


// Route to render the profile page
router.get('/profile', ensureAuthenticated, isStudent, async (req, res) => { // Added isStudent middleware
    try {
        const student = await Student.findById(req.user.studentId);
        if (!student) {
            req.flash('error_msg', 'Student profile not found.');
            // Redirect to dashboard or login
            return res.redirect('/student/finaldash'); // Or appropriate dashboard
        }
        // Pass student as 'user' and include flash messages
        res.render('StudentProfile', { // Ensure view name is correct
            user: student,
            success_msg: req.flash('success_msg'),
            error_msg: req.flash('error_msg')
         });
    } catch (error) {
        console.error('Error fetching student profile:', error);
        req.flash('error_msg', 'Error loading profile page.');
        res.status(500).redirect('/student/finaldash'); // Redirect on error
    }
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'profile_images_students');
        // Ensure the directory exists
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create a unique filename: guideId-timestamp.extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // --- Use req.user.guideId from the authenticated user ---
        const filename = (req.user?.studentId || 'unknown_student') + '-' + uniqueSuffix + path.extname(file.originalname);
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        // --- Pass error to multer callback ---
        cb(new Error('Only image files are allowed!'), false);
    }
};

// --- Initialize multer ---
const upload = multer({ storage: storage, fileFilter: fileFilter });


// --- Added isProjectGuide middleware ---
router.post('/update-profile', ensureAuthenticated, isStudent, upload.single('profileImage'), async (req, res) => {
    // --- Removed console logs for cleaner code, add back if debugging ---

    try {
        const studentId = req.user.studentId;
        // --- Destructure expected fields (adjust if your form/model differs) ---
        const { name, email,prn,mobile,academicYear,year } = req.body;

        const updateData = {
            name,
            email,
            prn,
            year,
            mobile,
            academicYear,
        };

        // If a file is uploaded, update the profile image path
        if (req.file) {
            // --- Store the relative web path, not the absolute system path ---
            // Assumes 'uploads' is served statically in app.js
            updateData.profileImagePath = path.join('/uploads', 'profile_images_students', req.file.filename).replace(/\\/g, '/');
             // TODO: Optionally, find the old image path from DB and delete the old file using fs.unlink
        }

        // --- Corrected Typo: ProjectGuide instead of ProjctGuide ---
        const updatedStudent = await Student.findByIdAndUpdate(
        studentId, // Use the guideId obtained from req.user
            updateData,
            { new: true, runValidators: true } // Options: return updated doc, run schema validators
        );

        if (!updatedStudent) {
            req.flash('error_msg', 'Student not found during update.');
            // --- Send JSON response for fetch API ---
            return res.status(404).json({ success: false, error: 'Student not found' });
        }

        // --- Update user session details if necessary (e.g., name) ---
        // req.user.name = updatedGuide.name; // Example

        req.flash('success_msg', 'Profile updated successfully!');
        // --- Send JSON response back to the fetch request in Guidprofile.js ---
        res.json({
            success: true,
            message: 'Profile updated successfully!',
            // --- Send back the potentially updated path ---
            profileImagePath: updatedStudent.profileImagePath
        });

    } catch (error) {
        console.error('Error updating student profile:', error);
        // --- Handle specific errors like file filter error ---
        if (error.message === 'Only image files are allowed!') {
             req.flash('error_msg', 'Upload failed: Only image files are allowed.');
             return res.status(400).json({ success: false, error: 'Only image files are allowed!' });
        }
        // --- Handle validation errors ---
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            req.flash('error_msg', `Profile update failed: ${messages.join(', ')}`);
            return res.status(400).json({ success: false, error: messages.join(', ') });
        }
        req.flash('error_msg', 'Error updating profile.');
        // --- Send JSON response for fetch API ---
        res.status(500).json({ success: false, error: 'Server error during profile update.' });
    }
});


// --- NEW ROUTE: Display Projects by Domain ---
router.get('/projects/domain/:domainName', ensureAuthenticated, async (req, res) => {
    try {
        const domainName = decodeURIComponent(req.params.domainName); // Decode the domain name from URL

        // --- Use a case-insensitive regular expression for the query ---
        const domainRegex = new RegExp(`^${domainName}$`, 'i'); // 'i' flag for case-insensitivity

        // Fetch projects matching the domain (case-insensitive), populate groupId, select necessary fields
        const projects = await Project.find({ projectDomain: domainRegex }) // <-- Use the regex here
                                      .populate('groupId', 'academicYear year')
                                      .select('projectTitle _id groupId')
                                      .sort({ 'groupId.academicYear': -1, 'groupId.year': -1 });

                                      console.log("✅ Projects found for domain:", projects);
        res.render('domainProjects', {
            domainName: domainName, // Still display the originally clicked domain name
            projects: projects,
            user: req.user,
            success_msg: req.flash('success_msg'),
            error_msg: req.flash('error_msg')
        });

    } catch (error) {
        console.error(`Error fetching projects for domain ${req.params.domainName}:`, error);
        req.flash('error_msg', 'Could not retrieve projects for this domain.');
        res.redirect('/student/finaldash');
    }
});


// === Add this console log right before exporting ===
console.log(`[studentRoutes.js] Exporting router. Type: ${typeof router}`);
if (typeof router !== 'function') {
    console.error("[studentRoutes.js] ERROR: Router is not a function before export!");
}


module.exports = router;