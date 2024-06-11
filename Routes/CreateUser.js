const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'qwertyuiopasdfghjklzxcvbnbnm';

// Signup route
router.post('/createuser', [
    body('parentName').isLength({ min: 1 }).withMessage('Parent name must be at least 1 characters long'),
    body('patientName').isLength({ min: 1 }).withMessage('Patient name must be at least 1 characters long'),
    body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 characters long'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Password confirmation does not match password');
        }
        return true;
    }).optional({ checkFalsy: true }),
    
    body('mobile').matches(/^\d{10}$/).withMessage('Mobile number must be exactly 10 digits'),
    body('email').isEmail().withMessage('Enter a valid email address')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        const user = await User.create({
            parentName: req.body.parentName,
            patientName: req.body.patientName,
            mobile: req.body.mobile,
            email: req.body.email,
            password: hashedPassword
        });

        const data = {
            user: {
                id: user.id
            }
        };
        const authToken = jwt.sign(data, JWT_SECRET);

        res.json({ success: true, authToken: authToken });
    } catch (error) {
        console.error(error);
        res.json({ success: false });
    }
});

// Login route
router.post('/loginuser', [
    body('parentName').isLength({ min: 1 }).withMessage('Parent name must be at least 1 characters long'),
    body('patientName').isLength({ min: 1 }).withMessage('Patient name must be at least 1 characters long'),
    body('email').isEmail().withMessage('Enter a valid email address'),
    body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 characters long')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    let { parentName, patientName, email, password } = req.body;
    try {
        let userData = await User.findOne({ parentName, patientName, email });
        if (!userData) {
            return res.status(400).json({ errors: "Invalid login credentials" });
        }

        const isMatch = await bcrypt.compare(password, userData.password);
        if (!isMatch) {
            return res.status(400).json({ errors: "Invalid login credentials" });
        }

        const data = {
            user: {
                id: userData.id
            }
        };
        const authToken = jwt.sign(data, JWT_SECRET);

        return res.json({ success: true, authToken });

    } catch (error) {
        console.error(error);
        res.json({ success: false });
    }
});

router.post('/logindoctor', [
    body('name').isLength({ min: 1 }).withMessage('Name must be at least 1 character long'),
    body('email').isEmail().withMessage('Enter a valid email address'),
    body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 characters long')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
        if (!global.doctordata) {
            throw new Error("Doctor data is not loaded");
        }

        // Find the doctor by name, email, and password
        const doctorData = global.doctordata.find(doc => doc.name === name && doc.email === email && doc.password === password);
        if (!doctorData) {
            return res.status(400).json({ errors: "Invalid login credentials" });
        }

        // Generate auth token
        const data = {
            doctor: {
                id: doctorData._id
            }
        };
        const authToken = jwt.sign(data, JWT_SECRET);

        return res.json({ success: true, authToken });

    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

module.exports = router;