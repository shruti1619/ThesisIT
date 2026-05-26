const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Project = require('../modal/project'); // Import the Project model
const Group = require('../modal/group');     // Import the Group model
const { ensureAuthenticated, isStudent, isGroupLeader } = require('../middlewares/auth'); // Adjust path as needed
const Student = require('../modal/student'); // Ensure student model is required

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Consider organizing uploads, e.g., by group ID
        // const uploadPath = path.join('uploads', `group_${req.group?._id || 'unknown'}`);
        // require('fs').mkdirSync(uploadPath, { recursive: true }); // Ensure directory exists
        // cb(null, uploadPath);
        cb(null, 'uploads/'); // Current simple approach
    },
    filename: function (req, file, cb) {
        // Use a more robust unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Use group ID if available in req (depends on middleware order)
        const groupId = req.group?._id || 'unknown';
        cb(null, `group-${groupId}-${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});
// Use .any() to accept all files sent; validation happens in the route
// const upload = multer({ storage: storage }).any(); // Old line causing the error
const upload = multer({ storage: storage }); // Correct initialization

// Route to render the project submission page (assuming only leaders access this)
// REMOVED - This logic is now handled by GET /project-details
/*
router.get('/addproject', ensureAuthenticated, isStudent, isGroupLeader, (req, res) => {
    // Check if the group already has a project submitted
    Project.findOne({ groupId: req.group._id })
        .then(existingProject => {
            if (existingProject) {
                // Optionally, redirect or show a message that project is already submitted
                // For now, just render the page but maybe disable the form or show info
                res.render('add_project', { projectSubmitted: true, group: req.group });
            } else {
                res.render('add_project', { projectSubmitted: false, group: req.group });
            }
        })
        .catch(err => {
            console.error("Error checking for existing project:", err);
            // Handle error appropriately, maybe redirect with an error message
            res.status(500).send("Error loading project submission page.");
        });
});
*/

// Route to handle project submission - restricted to group leaders
// REMOVED - This logic is now handled by POST /submit-stage
/*
router.post('/submit-project', ensureAuthenticated, isStudent, isGroupLeader, upload.fields([
    { name: 'seminar1PPT' },
    { name: 'projectReport' },
    { name: 'references' },
    { name: 'seminar2PPT' },
    { name: 'demonstrationVideo' },
    { name: 'poster' },
    { name: 'seminar3PPT' },
    { name: 'relatedCodes' }
]), async (req, res) => {
    try {
        // Get groupId from the middleware-populated req.group
        const groupId = req.group._id;
        const { projectTitle, projectDomain, projectOverview, problemStatement } = req.body;
        const files = req.files;

        // Check if a project for this group already exists (double-check)
        const existingProject = await Project.findOne({ groupId: groupId });
        if (existingProject) {
            return res.status(400).json({ error: 'A project has already been submitted for this group.' });
        }

        // Validate required files are present (multer doesn't enforce this automatically for fields)
        const requiredFields = ['seminar1PPT', 'projectReport', 'references', 'seminar2PPT', 'demonstrationVideo', 'poster', 'seminar3PPT', 'relatedCodes'];
        const missingFiles = requiredFields.filter(field => !files[field] || files[field].length === 0);

        if (missingFiles.length > 0) {
            return res.status(400).json({ error: `Missing required files: ${missingFiles.join(', ')}` });
        }


        // Create a new project instance
        const newProject = new Project({
            projectTitle,
            projectDomain,
            projectOverview,
            problemStatement,
            seminar1PPT: files.seminar1PPT[0].path, // Access path directly
            projectReport: files.projectReport[0].path,
            references: files.references[0].path,
            seminar2PPT: files.seminar2PPT[0].path,
            demonstrationVideo: files.demonstrationVideo[0].path,
            poster: files.poster[0].path,
            seminar3PPT: files.seminar3PPT[0].path,
            relatedCodes: files.relatedCodes[0].path,
            groupId // Use the groupId from the authenticated leader's group
        });

        // Save the project to the database
        await newProject.save();

        // Optionally: Update the Group model to store the project ID
        // await Group.findByIdAndUpdate(groupId, { projectId: newProject._id });

        res.status(200).json({ message: 'Project submitted successfully!' });
    } catch (error) {
        console.error('Error submitting project:', error);
        // Handle potential duplicate key errors if unique constraint fails unexpectedly
        if (error.code === 11000) {
             return res.status(400).json({ error: 'Project submission failed. A project might already exist for this group.' });
        }
        res.status(500).json({ error: 'An error occurred while submitting the project.' });
    }
});
*/


// --- GET Route to Render Project Page (Viewable by All Team Members) ---
router.get('/project-details', ensureAuthenticated, isStudent, async (req, res) => {
    try {
        const studentId = req.user.studentId; // Get student ID from JWT payload

        // Fetch student details including their groupId
        const student = await Student.findById(studentId).select('groupId'); // Only need groupId initially
        if (!student) {
            req.flash('error_msg', 'Could not find your student details.');
            return res.redirect('/student/finaldash'); // Or appropriate dashboard
        }
        if (!student.groupId) {
            req.flash('error_msg', 'You are not part of a group.');
            return res.redirect('/student/finaldash'); // Or appropriate dashboard
        }

        const groupId = student.groupId;

        // Fetch the full group details once
        const group = await Group.findById(groupId).populate('leader', 'name'); // Populate leader name if needed
        if (!group) {
            req.flash('error_msg', 'Could not find your group details.');
            return res.redirect('/student/finaldash');
        }

        // Determine leader status
        const isLeader = group.leader._id.equals(studentId);
        // --- EDIT: Use group.year for consistency ---
        const studentYear = group.year; // 'TE' or 'BE' from the group model
        const maxStages = (studentYear === 'final') ? 6 : 3; // Consistent check

        // Find the project associated with the student's group
        const project = await Project.findOne({ groupId: groupId });

        // Render the page
        res.render('add_project', {
            user: req.user,
            // --- EDIT: Pass the full group object ---
            group: group, // Pass the fetched group object
            project: project, // Pass the found project (or null if none)
            studentYear: studentYear, // Pass the consistent year
            maxStages: maxStages,
            isLeader: isLeader, // Pass leader status to template
            messages: req.flash()
        });

    } catch (err) {
        console.error("Error fetching project details:", err);
        req.flash('error_msg', 'Error loading project page.');
        res.redirect('/student/finaldash'); // Or appropriate dashboard
    }
});

// --- POST Route to Handle Staged Submissions ---
// This route correctly handles processing staged submissions
// Apply the 'upload' middleware configured with .fields()
// Keep isGroupLeader here, as only leaders should submit
// --- EDIT: Now upload.fields() will work correctly ---
router.post('/submit-stage', ensureAuthenticated, isStudent, isGroupLeader, upload.fields([
    { name: 'seminar1PPT', maxCount: 1 },
    { name: 'progressVideo1', maxCount: 1 },
    { name: 'seminar2PPT', maxCount: 1 },
    { name: 'progressVideo2', maxCount: 1 },
    { name: 'seminar3PPT', maxCount: 1 },
    { name: 'progressVideo3', maxCount: 1 },
    { name: 'projectReport', maxCount: 1 }, // TE Final
    { name: 'references', maxCount: 1 },    // TE Final
    { name: 'demonstrationVideo', maxCount: 1 }, // TE Final
    { name: 'poster', maxCount: 1 },          // TE Final
    { name: 'relatedCodes', maxCount: 1 },    // TE Final
    { name: 'seminar4PPT', maxCount: 1 }, // BE
    { name: 'progressVideo4', maxCount: 1 }, // BE
    { name: 'seminar5PPT', maxCount: 1 }, // BE
    { name: 'progressVideo5', maxCount: 1 }, // BE
    { name: 'seminar6PPT', maxCount: 1 }, // BE Final
    { name: 'progressVideo6', maxCount: 1 }, // BE Final
    // Add other BE final fields if needed (report, references etc. might be reused or separate)

]), async (req, res) => {
    // --- EDIT: Read 'stageToSubmit' from req.body ---
    const { stageToSubmit, projectTitle, projectDomain, projectOverview, problemStatement, objectives, scopeAndFunctionality /* other text fields */ } = req.body;
    const groupId = req.group._id; // From isGroupLeader middleware
    const studentId = req.user.studentId; // From ensureAuthenticated middleware
    const stage = parseInt(stageToSubmit, 10);

    // Basic validation
    if (isNaN(stage) || stage <= 0) {
        req.flash('error_msg', 'Invalid stage number submitted.');
        return res.redirect('/project/project-details');
    }

    try {
        const group = req.group; // From isGroupLeader middleware
        // --- EDIT: Consistent year check ---
        const maxStages = group.year === 'final' ? 6 : 3; // Determine max stages based on group year ('BE' or 'TE')

        // Find existing project or prepare data for a new one
        let project = await Project.findOne({ groupId: groupId });
        const isNewProject = !project;

        // --- EDIT: Sequential check logic refinement ---
        // Prevent submitting beyond max stages
        if (stage > maxStages) {
            req.flash('error_msg', `Invalid stage number (${stage}) for your year (${group.year}). Max stages: ${maxStages}.`);
            return res.redirect('/project/project-details');
        }
        // Prevent re-submitting completed stages or submitting non-sequentially
        const expectedStage = isNewProject ? 1 : project.submissionStage + 1;
        if (stage !== expectedStage) {
            if (isNewProject && stage !== 1) {
                req.flash('error_msg', 'Please submit Stage 1 first.');
            } else if (project && project.submissionStage >= stage) {
                req.flash('error_msg', `Stage ${stage} has already been submitted.`);
            } else {
                req.flash('error_msg', `Please submit Stage ${expectedStage} next.`);
            }
            return res.redirect('/project/project-details');
        }
        // --- End Sequential check logic refinement ---


        // Prepare project data object
        const projectData = {
            groupId: groupId,
            guideId: group.guideId, // Get from populated group object
            academicYear: group.academicYear, // Get from populated group object
            year: group.year, // Get from populated group object
            submissionStage: stage, // Update stage number
            // --- EDIT: Use correct field name from schema ---
            lastSubmittedBy: studentId, // ID of the student submitting
            lastSubmissionDate: new Date() // Update submission date
            // --- End Edit ---
        };

        // Add text fields only for stage 1 submission
        if (stage === 1) { // Only add/overwrite these during stage 1
            projectData.projectTitle = projectTitle;
            projectData.projectDomain = projectDomain;
            projectData.projectOverview = projectOverview;
            projectData.problemStatement = problemStatement;
            projectData.objectives = objectives;
            projectData.scopeAndFunctionality = scopeAndFunctionality;
        }

        // Add file paths based on the stage being submitted
        const files = req.files;
        // --- EDIT: Add checks for file existence before accessing path ---
        switch (stage) {
            case 1:
                if (files?.seminar1PPT?.[0]) projectData.seminar1PPT = files.seminar1PPT[0].path;
                if (files?.progressVideo1?.[0]) projectData.progressVideo1 = files.progressVideo1[0].path;
                break;
            case 2:
                if (files?.seminar2PPT?.[0]) projectData.seminar2PPT = files.seminar2PPT[0].path;
                if (files?.progressVideo2?.[0]) projectData.progressVideo2 = files.progressVideo2[0].path;
                break;
            case 3:
                if (files?.seminar3PPT?.[0]) projectData.seminar3PPT = files.seminar3PPT[0].path;
                if (files?.progressVideo3?.[0]) projectData.progressVideo3 = files.progressVideo3[0].path;
                // Add final TE files if maxStages is 3
                if (maxStages === 3) {
                    if (files?.projectReport?.[0]) projectData.projectReport = files.projectReport[0].path;
                    if (files?.references?.[0]) projectData.references = files.references[0].path;
                    if (files?.demonstrationVideo?.[0]) projectData.demonstrationVideo = files.demonstrationVideo[0].path;
                    if (files?.poster?.[0]) projectData.poster = files.poster[0].path;
                    if (files?.relatedCodes?.[0]) projectData.relatedCodes = files.relatedCodes[0].path;
                }
                break;
             case 4: // BE Only
                 if (files?.seminar4PPT?.[0]) projectData.seminar4PPT = files.seminar4PPT[0].path;
                 if (files?.progressVideo4?.[0]) projectData.progressVideo4 = files.progressVideo4[0].path;
                 break;
             case 5: // BE Only
                 if (files?.seminar5PPT?.[0]) projectData.seminar5PPT = files.seminar5PPT[0].path;
                 if (files?.progressVideo5?.[0]) projectData.progressVideo5 = files.progressVideo5[0].path;
                 break;
             case 6: // BE Only - Final Submission
                 if (files?.seminar6PPT?.[0]) projectData.seminar6PPT = files.seminar6PPT[0].path;
                 if (files?.progressVideo6?.[0]) projectData.progressVideo6 = files.progressVideo6[0].path;
                 // Add final BE files
                 if (files?.projectReport?.[0]) projectData.projectReport = files.projectReport[0].path;
                 if (files?.references?.[0]) projectData.references = files.references[0].path;
                 if (files?.demonstrationVideo?.[0]) projectData.demonstrationVideo = files.demonstrationVideo[0].path;
                 if (files?.poster?.[0]) projectData.poster = files.poster[0].path;
                 if (files?.relatedCodes?.[0]) projectData.relatedCodes = files.relatedCodes[0].path;
                 break;
        }
        // --- End file existence checks ---

        // Update or create the project document
        const updatedProject = await Project.findOneAndUpdate(
            { groupId: groupId },
            { $set: projectData },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        req.flash('success_msg', `Stage ${stage} submitted successfully.`);
        res.redirect('/project/project-details');

    } catch (error) {
        console.error(`Error submitting stage ${stage}:`, error);
        let errorMessage = 'Failed to submit project stage. Please try again.';
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message).join(' ');
            errorMessage = `Submission failed due to validation errors: ${messages}`;
        } else if (error.code === 11000) {
             errorMessage = 'Submission failed due to a duplicate entry. Please check your inputs.';
        }
        req.flash('error_msg', errorMessage);
        res.redirect('/project/project-details');
    }
});

// --- REMOVED Redundant Route ---
/*
router.post('/update-text', ensureAuthenticated, isStudent, isGroupLeader, async (req, res) => {
    try {
        console.log('Request body:', req.body);
        const groupId = req.group._id;
        const { projectTitle, projectDomain, projectOverview, problemStatement } = req.body;

        console.log('Received update request:', { projectTitle, projectDomain, projectOverview, problemStatement });

        // Find the project for this group
        const project = await Project.findOne({ groupId: groupId });
        if (!project) {
            console.error('Project not found for group:', groupId);
            return res.status(404).json({ success: false, error: 'Project not found.' });
        }

        // Update only text fields
        if (projectTitle !== undefined) project.projectTitle = projectTitle;
        if (projectDomain !== undefined) project.projectDomain = projectDomain;
        if (projectOverview !== undefined) project.projectOverview = projectOverview;
        if (problemStatement !== undefined) project.problemStatement = problemStatement;

        await project.save();
        console.log('Project updated successfully for group:', groupId);
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating project text fields:', err);
        res.status(500).json({ success: false, error: 'Failed to update project details.' });
    }
});
*/
// --- End Removed Route ---

module.exports = router;