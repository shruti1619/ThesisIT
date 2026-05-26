const express = require('express');
const router = express.Router();
const ProjectRefinery = require('../modal/ProjectRefinery'); // Import the ProjectRefinery model
const { ensureAuthenticated } = require('../middlewares/auth'); // Middleware for authentication
const Student = require('../modal/student'); // Import the Student model

// GET route to render the project submission form
router.get('/submit', ensureAuthenticated, (req, res) => {
    res.render('addprojectref', { user: req.user });
});

// POST route to handle project submission
router.post('/submit', ensureAuthenticated, async (req, res) => {
    try {
        const { projectTitle, problemStatement, projectOverview, limitation, futureScope, technicalIssues, domain } = req.body;

        // Create a new project instance
        const newProject = new ProjectRefinery({
            projectTitle,
            problemStatement,
            projectOverview,
            limitation,
            futureScope,
            technicalIssues,
            domain,
            userId: req.user.studentId // Use the student's ID
        });

        // Save the project to the database
        await newProject.save();

        req.flash('success_msg', 'Project submitted successfully!');
        res.redirect('/projectref/submit');
    } catch (error) {
        console.error('Error submitting project:', error);
        req.flash('error_msg', 'An error occurred while submitting the project.');
        res.redirect('/projectref/submit');
    }
});

// GET route to view all projects in the refinery
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        // This line attempts to fetch ProjectRefinery documents and populate
        // the 'userId' field with the 'year' and 'academicYear' from the referenced Student document.
        const projects = await ProjectRefinery.find({}).populate('userId', 'year academicYear');

        // --- We need to see the result of the above line ---
        console.log("Fetched Projects for Refinery:", JSON.stringify(projects, null, 2));
        // ---

        res.render('projectRefinery', { projects });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).send('Server Error');
    }
});

// GET route to view details of a specific project
router.get('/details/:id', ensureAuthenticated, async (req, res) => {
    try {
        const project = await ProjectRefinery.findById(req.params.id);
        if (!project) {
            return res.status(404).send('Project not found');
        }
        res.render('projectdetailsref', { project });
    } catch (error) {
        console.error('Error fetching project details:', error);
        res.status(500).send('Server Error');
    }
});

// GET route to view alumni details of a project
router.get('/alumni/:userId', ensureAuthenticated, async (req, res) => {
    try {
        // Fetch student details including the profile image path
        const user = await Student.findById(req.params.userId).select('name email profileImagePath year academicYear');
        if (!user) {
            return res.status(404).send('Student not found');
        }
        res.render('aluminidetailsref', { user });
    } catch (error) {
        console.error('Error fetching alumni details:', error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;


