const express = require('express');
const router = express.Router();

router.get('/signupstu', (req, res) => {
    res.render('signupStud_FinalY');
});
router.get('/signupguide', (req, res) => {
    res.render('guidesignup');
});
router.get('/signupadmin', (req, res) => {
    res.render('adminsignup');
});
router.get('/', (req, res) => {
    res.render('Progress_seminar_02');
});
router.get('/option', (req, res) => {
    res.render('signin');
});
router.get('/aboutus', (req, res) => {
    res.render('aboutus');
});
router.get('/contact', (req, res) => {
    res.render('contact');
});
router.get('/homefaq', (req, res) => {
    res.render('homeFAQ');
});
router.get('/finalfaq', (req, res) => {
    res.render('Final_Year_FAQ');
});
router.get('/juniorfaq', (req, res) => {
    res.render('juniorFAQ');
});

// Ensure the router is exported correctly
module.exports = router;