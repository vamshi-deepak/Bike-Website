// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/BikeServerDatabase')
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Order Schema
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

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
