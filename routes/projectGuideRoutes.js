const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const ProjectGuide = require('../modal/projectGuide');
const { ensureAuthenticated, isProjectGuide } = require('../middlewares/auth');
const Group = require('../modal/group');
const Project = require('../modal/project');
const Evaluation = require('../modal/evaluation'); // Use the updated model// Make sure Evaluation model is required
// Make sure Group model is required

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'profile_images');
        // Ensure the directory exists
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create a unique filename: guideId-timestamp.extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // --- Use req.user.guideId from the authenticated user ---
        const filename = (req.user?.guideId || 'unknown_guide') + '-' + uniqueSuffix + path.extname(file.originalname);
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

// Validation middleware for Project Guide registration
const validateGuideRegistration = (req, res, next) => {
    const { name, email, mobile, academicYear, username, password } = req.body;

    if (!name || !email || !mobile || !academicYear || !username || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // Updated email validation to include Yahoo
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

// Registration route for Project Guide
router.post("/register", validateGuideRegistration, async (req, res) => {
    try {
        const { name, email, mobile, academicYear, username, password } = req.body;

        // Check if any field matches an existing guide
        const existGuide = await ProjectGuide.findOne({
            $or: [
                { email: email.toLowerCase() },
                { mobile },
                { username }
            ]
        });

        if (existGuide) {
            let errorMessage = "A guide with the same ";
            if (existGuide.email === email.toLowerCase()) errorMessage += "email, ";
            if (existGuide.mobile === mobile) errorMessage += "mobile, ";
            if (existGuide.username === username) errorMessage += "username, ";
            errorMessage = errorMessage.slice(0, -2) + " already exists.";
            return res.status(400).json({ error: errorMessage });
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new guide
        const newGuide = await ProjectGuide.create({
            name,
            email: email.toLowerCase(),
            mobile,
            academicYear,
            username,
            password: hashedPassword
        });

        // Generate JWT token (consider using a different payload or secret if needed for guides)
        const token = jwt.sign({ email: newGuide.email, guideId: newGuide._id, role: 'guide' }, process.env.JWT_SECRET, { expiresIn: "1h" }); // Added role

        // Send response (e.g., set cookie and send JSON)
        res.cookie("token", token).json({ message: "Guide registration successful" });

    } catch (error) {
        console.error('Guide registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/signin', (req, res) => {
    res.render('loginGuide');
});

// Login route for Project Guide
router.post("/signin", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        // Find guide by email
        const guide = await ProjectGuide.findOne({ username });
        if (!guide) {
            console.log('Guide not found for username:', username);
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // Compare the entered password with the hashed password
        const isMatch = await bcrypt.compare(password, guide.password);
        if (!isMatch) {
            console.log('Password mismatch for guide:', username);
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // If credentials are correct, generate a token
        const token = jwt.sign({ username: guide.username, guideId: guide._id, role: 'guide' }, process.env.JWT_SECRET, { expiresIn: "1h" }); // Added role
        console.log('Guide login successful, token generated for:', username);

        // Send response (e.g., set cookie and send JSON with user info and redirect)
        res.cookie("token", token).json({
            message: "Login successful",
            token,
            guide: { // Send guide-specific info
                email: guide.email,
                name: guide.name,
                academicYear: guide.academicYear,
                role: 'guide' // Indicate the role
            },
            // Add a redirect path specific to guides if needed
            redirect: "/guide/projectGuidedash" // Example redirect path
        });

    } catch (error) {
        console.error('Guide login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route to render the profile page
router.get('/profile', ensureAuthenticated, isProjectGuide, async (req, res) => { // Added isProjectGuide
    try {
        const guide = await ProjectGuide.findById(req.user.guideId);
        // --- Corrected check: if (!guide) ---
        if (!guide) {
            // --- Use flash messages and redirect ---
            req.flash('error_msg', 'Guide profile not found.');
            return res.redirect('/guide/projectGuidedash'); // Or appropriate dashboard/login
        }
        // --- Pass guide as 'user' and include flash messages ---
        res.render('GuideProfile', {
            user: guide,
            success_msg: req.flash('success_msg'),
            error_msg: req.flash('error_msg')
         });
    } catch (error) {
        console.error('Error fetching guide profile:', error);
        // --- Use flash messages on error redirect ---
        req.flash('error_msg', 'Error loading profile page.');
        res.status(500).redirect('/guide/projectGuidedash'); // Redirect on error
    }
});


// Update profile route using POST
// --- Added isProjectGuide middleware ---
router.post('/update-profile', ensureAuthenticated, isProjectGuide, upload.single('profileImage'), async (req, res) => {
    // --- Removed console logs for cleaner code, add back if debugging ---

    try {
        const guideId = req.user.guideId;
        // --- Destructure expected fields (adjust if your form/model differs) ---
        const { name, email, mobile,academicYear, username } = req.body;

        const updateData = {
            name,
            email,
            mobile,
            academicYear,
            username
        };

        // If a file is uploaded, update the profile image path
        if (req.file) {
            // --- Store the relative web path, not the absolute system path ---
            // Assumes 'uploads' is served statically in app.js
            updateData.profileImagePath = path.join('/uploads', 'profile_images', req.file.filename).replace(/\\/g, '/');
             // TODO: Optionally, find the old image path from DB and delete the old file using fs.unlink
        }

        // --- Corrected Typo: ProjectGuide instead of ProjctGuide ---
        const updatedGuide = await ProjectGuide.findByIdAndUpdate(
            guideId, // Use the guideId obtained from req.user
            updateData,
            { new: true, runValidators: true } // Options: return updated doc, run schema validators
        );

        if (!updatedGuide) {
            req.flash('error_msg', 'Guide not found during update.');
            // --- Send JSON response for fetch API ---
            return res.status(404).json({ success: false, error: 'Guide not found' });
        }

        // --- Update user session details if necessary (e.g., name) ---
        // req.user.name = updatedGuide.name; // Example

        req.flash('success_msg', 'Profile updated successfully!');
        // --- Send JSON response back to the fetch request in Guidprofile.js ---
        res.json({
            success: true,
            message: 'Profile updated successfully!',
            // --- Send back the potentially updated path ---
            profileImagePath: updatedGuide.profileImagePath
        });

    } catch (error) {
        console.error('Error updating guide profile:', error);
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

// Logout route
router.get("/logout", (req, res) => { // Assuming isLoggedIn middleware might not be needed or adapted
    res.clearCookie("token");
    res.redirect('/guide/signin');
});

// Route to render the guide dashboard
router.get('/projectGuidedash', ensureAuthenticated, async (req, res) => {
    try {
        // Step 1: Get all groups under this guide
        const groups = await Group.find({ guideName: req.user.name })
            .populate('members');

        // Step 2: Filter out groups where all members are alumni
        const activeGroupIds = [];

        for (const group of groups) {
            const hasActiveStudent = group.members.some(member => !member.isAlumni);
            if (hasActiveStudent) {
                activeGroupIds.push(group._id);
            }
        }

        // Step 3: Get projects for active groups only
        const projects = await Project.find({ groupId: { $in: activeGroupIds } })
            .populate({
                path: 'groupId',
                populate: { path: 'members' }
            });

        // --- NEW: Fetch Unique Project Domains (same as nfinaldash) ---
        const uniqueDomains = await Project.distinct('projectDomain');
        const validDomains = uniqueDomains.filter(domain => domain && domain.trim() !== '');
        // --- End NEW Domain Fetching ---

        res.render('projectGuidedash', {
            projects: projects,
            projectDomains: validDomains // <-- Pass domain list to EJS
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).send('Server Error');
    }
});

router.get('/view/:groupId', ensureAuthenticated, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId).populate('members');
        const allEvaluations = await Evaluation.find({ groupId: group._id });

        // Calculate cumulative totals
        const memberCumulativeTotals = {};
        group.members.forEach(member => {
            memberCumulativeTotals[member._id.toString()] = { tyTotal: 0, fyTotal: 0 };
        });

        allEvaluations.forEach(evaluation => {
            const seminarNum = evaluation.seminarNumber;
            evaluation.memberMarks.forEach(markEntry => {
                const memberIdStr = markEntry.memberId.toString();
                if (memberCumulativeTotals[memberIdStr]) {
                    if (seminarNum <= 3) {
                        memberCumulativeTotals[memberIdStr].tyTotal += markEntry.totalMarks;
                    } else if (seminarNum >= 4 && seminarNum <= 6) {
                        memberCumulativeTotals[memberIdStr].fyTotal += markEntry.totalMarks;
                    }
                }
            });
        });

        res.render('viewProjectDetails', {
            group: group,
            project: await Project.findOne({ groupId: group._id }),
            memberCumulativeTotals: memberCumulativeTotals // Pass the calculated totals
        });
    } catch (error) {
        console.error('Error fetching project details:', error);
        res.status(500).send('Server Error');
    }
});

// ROUTE: Display evaluation form for a specific seminar
router.get('/evaluate/:groupId/:seminarNumber', ensureAuthenticated, async (req, res) => {
    try {
        const { groupId, seminarNumber } = req.params;
        const guideId = req.user._id; // Assuming ensureAuthenticated adds user to req

        // Validate seminarNumber (basic check)
        const seminarNum = parseInt(seminarNumber, 10);
        if (isNaN(seminarNum) || seminarNum < 1 || seminarNum > 6) {
            return res.status(400).send('Invalid seminar number.');
        }

        // Fetch Group details (and populate members)
        const group = await Group.findById(groupId).populate('members');
        if (!group) {
            return res.status(404).send('Group not found.');
        }

        // Fetch Guide details using guideId stored in the group
        const guide = await ProjectGuide.findById(group.guideId);
        if (!guide) {
            return res.status(404).send('Guide not found.');
        }

        // Fetch Project details associated with the group
        const project = await Project.findOne({ groupId: groupId });
        if (!project) {
            return res.status(404).send('Project details not found for this group.');
        }

        // Fetch existing evaluation for this specific group and seminar, if it exists
        const existingEvaluation = await Evaluation.findOne({
            groupId: groupId,
            seminarNumber: seminarNum
        });

        // Define criteria for evaluation
        const evaluationCriteria = {
            technicalKnowledge: { max: 10, label: "Technical Knowledge" },
            communicationSkill: { max: 5, label: "Communication Skill" },
            individualEfforts: { max: 2, label: "Individual Efforts Taken" },
            overallPresentation: { max: 3, label: "Overall Presentation" },
            innovativeness: { max: 3, label: "Innovativeness/ Societal Use" },
            progressStatus: { max: 2, label: "Progress Status" }
        };
        const maxTotal = Object.values(evaluationCriteria).reduce((sum, crit) => sum + crit.max, 0);

        // Render the evaluation form view
        res.render('evaluateseminar', {
            group: group,
            project: project,
            seminarNumber: seminarNum,
            evaluation: existingEvaluation, // Pass existing data (or null) to the view
            criteria: evaluationCriteria,
            maxTotal: maxTotal,
            guide: guide // Pass guide object to the view
        });

    } catch (error) {
        console.error('Error fetching data for evaluation form:', error);
        res.status(500).send('Server Error');
    }
});


// ROUTE: Display file downloads
router.get('/download/:encodedPath', ensureAuthenticated, (req, res) => {
    try {
        const encodedPath = req.params.encodedPath;
        // Decode the base64 path
        const decodedPath = Buffer.from(encodedPath, 'base64').toString('utf-8');

        // Security check: Ensure the path is within your uploads directory
        // Adjust '../uploads' if your structure is different
        const uploadsDir = path.resolve(__dirname, '..', 'uploads');
        const absoluteDecodedPath = path.resolve(decodedPath);

        if (!absoluteDecodedPath.startsWith(uploadsDir)) {
             console.error(`Download attempt outside uploads directory: ${absoluteDecodedPath}`);
             return res.status(403).send('Forbidden: Access denied.');
        }

        // Check if file exists before attempting download
        if (fs.existsSync(absoluteDecodedPath)) {
            // Use res.download() to send the file
            res.download(absoluteDecodedPath, (err) => {
                if (err) {
                    console.error('Error during file download:', err);
                    if (!res.headersSent) {
                        res.status(500).send('Could not download the file.');
                    }
                }
            });
        } else {
            console.error(`File not found for download: ${absoluteDecodedPath}`);
            res.status(404).send('File not found.');
        }

    } catch (error) {
        console.error('Error decoding download path or processing download:', error);
        res.status(500).send('Server error during file download.');
    }
});


// --- START: Add POST route for Evaluation Submission ---
router.post('/evaluate', ensureAuthenticated, async (req, res) => {
    try {
        const { groupId, seminarNumber, projectId, comments, marks } = req.body;
        const guideId = req.user._id; // Get guide ID from logged-in user

        // Basic Validation
        if (!groupId || !seminarNumber || !marks) {
            // Redirect back with an error? Or send JSON error?
            // For simplicity, redirecting back to the form might be okay for now.
            // Consider adding flash messages for better UX later.
            console.error("Evaluation submission missing required fields:", { groupId, seminarNumber, marksProvided: !!marks });
            // Ideally, redirect back to the form page, but need group details again.
            // Redirecting to group view is simpler for now.
            return res.status(400).redirect(`/guide/view/${groupId || 'dashboard'}`); // Redirect to dashboard if groupId is missing
        }

        const seminarNum = parseInt(seminarNumber, 10);
        if (isNaN(seminarNum)) {
             console.error("Invalid seminar number received:", seminarNumber);
             return res.status(400).redirect(`/guide/view/${groupId}`);
        }

        // Define criteria again to validate max marks (ensure consistency with GET route)
        // TODO: Consider moving criteria definition to a shared config/helper file
        const evaluationCriteria = {
            technicalKnowledge: { max: 10, label: "Technical Knowledge" },
            communicationSkill: { max: 5, label: "Communication Skill" },
            individualEfforts: { max: 2, label: "Individual Efforts Taken" },
            overallPresentation: { max: 3, label: "Overall Presentation" },
            innovativeness: { max: 3, label: "Innovativeness/ Societal Use" },
            progressStatus: { max: 2, label: "Progress Status" }
        };
        const maxTotalPerMember = Object.values(evaluationCriteria).reduce((sum, crit) => sum + crit.max, 0);

        // Process the marks for each member
        const processedMemberMarks = [];
        let overallFormIsValid = true; // Flag to track if all submitted marks are valid

        for (const [memberId, memberScores] of Object.entries(marks)) {
            let memberTotal = 0;
            const validatedScores = {};

            for (const [criterionKey, scoreStr] of Object.entries(memberScores)) {
                const score = parseFloat(scoreStr);
                const criterion = evaluationCriteria[criterionKey];

                if (!criterion || isNaN(score) || score < 0 || score > criterion.max) {
                    console.error(`Invalid score submitted for member ${memberId}, criterion ${criterionKey}: ${scoreStr}`);
                    overallFormIsValid = false;
                    // Handle invalid score - break or mark as invalid?
                    // For now, we'll stop processing if any score is invalid.
                    break; // Stop processing scores for this member
                }
                validatedScores[criterionKey] = score; // Store the validated number
                memberTotal += score;
            }

            if (!overallFormIsValid) {
                break; // Stop processing members if an invalid score was found
            }

            processedMemberMarks.push({
                memberId: memberId, // Assuming memberId is the key from req.body.marks
                marks: validatedScores,
                totalMarks: memberTotal
            });
        }

        // If any validation failed during processing
        if (!overallFormIsValid) {
             // Maybe redirect back to the form with an error message
             console.error("Invalid marks detected during processing. Aborting save.");
             // Need a way to show error to user - flash messages are good here.
             return res.status(400).redirect(`/guide/evaluate/${groupId}/${seminarNum}`); // Redirect back to form
        }


        // Prepare data for saving/updating
        const evaluationData = {
            groupId: groupId,
            seminarNumber: seminarNum,
            guideId: guideId,
            comments: comments || '', // Handle optional comments
            memberMarks: processedMemberMarks, // Store the processed individual marks
            // Add projectId only if it exists
            ...(projectId && { projectId: projectId }),
            lastUpdated: new Date()
        };

        // Find existing evaluation or create a new one (Upsert)
        const updatedEvaluation = await Evaluation.findOneAndUpdate(
            { groupId: groupId, seminarNumber: seminarNum }, // Find criteria
            { $set: evaluationData }, // Data to set/update
            { upsert: true, new: true, runValidators: true } // Options: create if not found, return updated doc, run schema validators
        );

        console.log(`Evaluation ${updatedEvaluation._id} saved/updated successfully for Group ${groupId}, Seminar ${seminarNum}`);

        // Redirect to the group details page after successful submission
        res.redirect(`/guide/view/${groupId}`);

    } catch (error) {
        console.error('Error submitting evaluation:', error);
        // Determine groupId for redirect even in case of error, if possible
        const groupId = req.body.groupId || 'dashboard'; // Fallback
        res.status(500).send(`Server Error processing evaluation. <a href="/guide/view/${groupId}">Go back</a>`); // Provide a link back
    }
});

// ROUTE: Display feedback form for a specific seminar
router.get('/feedback/:groupId/:seminarNumber', ensureAuthenticated, async (req, res) => {
    try {
        const { groupId, seminarNumber } = req.params;
        const guideId = req.user._id;

        const seminarNum = parseInt(seminarNumber, 10);
        if (isNaN(seminarNum) || seminarNum < 1 || seminarNum > 6) {
            return res.status(400).send('Invalid seminar number.');
        }

        // Fetch Group details
        const group = await Group.findById(groupId).populate('members'); // Populate members if needed for display
        if (!group) {
            return res.status(404).send('Group not found.');
        }

        // Fetch Project details (optional, but good for context)
        const project = await Project.findOne({ groupId: groupId });

        // Fetch existing evaluation/feedback for this seminar
        const existingEvaluation = await Evaluation.findOne({
            groupId: groupId,
            seminarNumber: seminarNum
        });

        res.render('giveFeedback', {
            group: group,
            project: project, // Pass project if needed in the view
            seminarNumber: seminarNum,
            existingFeedback: existingEvaluation ? existingEvaluation.feedback : '', // Pass existing feedback
            groupId: groupId // Pass groupId for the form action
        });

    } catch (error) {
        console.error('Error fetching data for feedback form:', error);
        res.status(500).send('Server Error');
    }
});

// ROUTE: Handle feedback submission
router.post('/feedback', ensureAuthenticated, async (req, res) => {
    try {
        const { groupId, seminarNumber, feedback } = req.body;
        // --- Corrected line: Access guideId from the decoded JWT payload ---
        const guideId = req.user.guideId; // Changed from req.user._id

        // --- Add logging here to check guideId ---
        console.log('Attempting to save feedback. Guide ID:', guideId, 'Type:', typeof guideId);
        // --- End logging ---

        // Basic Validation
        if (!groupId || !seminarNumber || feedback === undefined) {
            console.error("Feedback submission missing required fields:", { groupId, seminarNumber, feedbackProvided: feedback !== undefined });
            return res.status(400).redirect(`/guide/view/${groupId || 'projectGuidedash'}`);
        }

        // --- Add logging here to check guideId again ---
        if (!guideId) {
             console.error('CRITICAL: guideId is missing or undefined after accessing req.user.guideId.');
             return res.status(500).send('Server error: User authentication issue.');
        }
        // --- End logging ---

        const seminarNum = parseInt(seminarNumber, 10);
        if (isNaN(seminarNum) || seminarNum < 1 || seminarNum > 6) {
            return res.status(400).send('Invalid seminar number.');
        }

        // Find existing evaluation or create a new one if it doesn't exist
        // This ensures feedback can be given even if evaluation hasn't happened yet
        let evaluation = await Evaluation.findOne({
            groupId: groupId,
            seminarNumber: seminarNum
        });

        if (evaluation) {
            // Update existing evaluation's feedback
            evaluation.feedback = feedback.trim();
            evaluation.guideId = guideId; // Ensure guideId is set/updated
        } else {
            // Create a new evaluation record just for the feedback
            // Note: This creates a record without marks. Consider if this is desired.
            // Alternatively, you could prevent feedback submission if no evaluation exists.
            evaluation = new Evaluation({
                groupId: groupId,
                seminarNumber: seminarNum,
                guideId: guideId,
                feedback: feedback.trim(),
                memberMarks: [] // Initialize empty marks array
                // projectId might be needed if your schema requires it
            });
        }

        await evaluation.save();

        // Redirect back to the project details page after saving
        res.redirect(`/guide/view/${groupId}`);

    } catch (error) {
        console.error('Error saving feedback:', error);
        // Handle potential duplicate key error if index exists and creation is attempted twice
        if (error.code === 11000) {
             return res.status(409).send('Feedback record already exists or conflict occurred.');
        }
        res.status(500).send('Server Error');
    }
});



module.exports = router;