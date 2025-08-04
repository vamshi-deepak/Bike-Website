// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer'); // For sending emails
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = '9398006852'; // Replace with a secure key
const OTP_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files like HTML, CSS, JS

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/BikeServerDatabase')
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Define User schema and model
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    otp: {
        code: String,
        expiry: Date,
    },
});

const User = mongoose.model('User', userSchema);

// Nodemailer configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'vamshideepak94@gmail.com', // Replace with your email
        pass: 'qrivmeibfnghbzfe', // Replace with your email password or app-specific password
    },
});

// Registration route
app.post('/api/register', async (req, res) => {
    const { name, email, username, password } = req.body;

    try {
        // Validate input
        if (!name || !email || !username || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });

        if (existingUser) {
            return res.status(400).json({ message: 'User with this email or username already exists.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save the new user
        const newUser = new User({
            name,
            email,
            username,
            password: hashedPassword,
        });

        await newUser.save();

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

// Login route
app.post('/api/login', async (req, res) => {
    const { usernameOrEmail, password } = req.body;

    try {
        // Find user by username or email
        const user = await User.findOne({
            $or: [
                { username: usernameOrEmail },
                { email: usernameOrEmail },
            ],
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid username/email or password.' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid username/email or password.' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ message: 'Login successful', token });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

// Forgot Password: Send OTP
app.post('/api/request-otp', async (req, res) => {
    const { emailOrPhone } = req.body;

    try {
        const user = await User.findOne({ email: emailOrPhone });

        if (!user) {
            return res.status(404).json({ message: 'User not found with the provided email.' });
        }

        // Generate OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + OTP_EXPIRY_TIME);

        // Save OTP to the user document
        user.otp = { code: otpCode, expiry: otpExpiry };
        await user.save();

        // Send OTP via email
        const mailOptions = {
            from: 'vamshideepak94@gmail.com',
            to: user.email,
            subject: 'Your Password Reset OTP',
            text: `Your OTP is: ${otpCode}. It is valid for the next 5 minutes.`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'OTP sent to your email.' });
    } catch (err) {
        console.error('Error sending OTP:', err);
        res.status(500).json({ message: 'Failed to send OTP. Please try again later.' });
    }
});

// Forgot Password: Verify OTP and Reset Password
app.post('/api/forgot-password', async (req, res) => {
    const { emailOrPhone, otp, newPassword } = req.body;

    try {
        const user = await User.findOne({ email: emailOrPhone });

        if (!user || !user.otp || user.otp.code !== otp) {
            return res.status(400).json({ message: 'Invalid OTP or user not found.' });
        }

        // Check if OTP has expired
        if (new Date() > user.otp.expiry) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password and clear the OTP
        user.password = hashedPassword;
        user.otp = null;
        await user.save();

        res.status(200).json({ message: 'Password reset successfully!' });
    } catch (err) {
        console.error('Error resetting password:', err);
        res.status(500).json({ message: 'Failed to reset password. Please try again later.' });
    }
});
const orderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    address: { type: String, required: true },
    zipcode: { type: String, required: true },
    product: { type: String, required: true },
    price: { type: Number, required: true },
});

const Order = mongoose.model('Order', orderSchema);

// Submit Order Route
app.post('/api/submit-order', async (req, res) => {
    const { name, phone, email, city, state, address, zipcode } = req.body;

    try {
        // Validate input
        if (!name || !phone || !email || !city || !state || !address || !zipcode) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Save the order details to the database
        const newOrder = new Order({
            name,
            phone,
            email,
            city,
            state,
            address,
            zipcode,
            product: 'Royal Enfield Hunter 350', // Product name
            price: 183475, // Product price
        });

        await newOrder.save();

        // Send success response
        res.status(201).json({ message: 'Order placed successfully!' });
    } catch (err) {
        console.error('Error saving order:', err);
        res.status(500).json({ message: 'Failed to process your order. Please try again later.' });
    }
});
const deletedorderSchema = new mongoose.Schema({
    orderId: String,
    customerName: String,
    items: Array,
    date: Date
});
const deletedorder = mongoose.model('deleted-Order', orderSchema);

// Deleted Order Schema
const deletedOrderSchema = new mongoose.Schema({
    orderId: String,
    customerName: String,
    items: Array,
    date: Date,
    cancellationDate: Date
});
const DeletedOrder = mongoose.model('DeletedOrder', deletedOrderSchema);

// API to cancel the order
app.post('/api/cancel-order', async (req, res) => {
    const { orderId } = req.body;

    try {
        // Find the order to be cancelled
        const order = await Order.findOne({ orderId: orderId });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Save the order details to deleted orders collection
        const deletedOrder = new DeletedOrder({
            ...order.toObject(),
            cancellationDate: new Date()
        });
        await deletedOrder.save();

        // Delete the order from the orders collection
        await Order.deleteOne({ orderId: orderId });

        return res.json({ success: true, message: 'Order cancelled and details moved to deleted orders' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'An error occurred while cancelling the order' });
    }
});
// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
