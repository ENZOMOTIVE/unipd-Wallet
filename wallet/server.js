const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors'); // Import CORS middleware

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3001', // Allow requests from this origin
  methods: 'GET,POST,PUT,DELETE', // Specify allowed methods
  allowedHeaders: 'Content-Type', // Specify allowed headers
}));

const SECRET_KEY = '1234';

// Route to decrypt JWT credential
app.post('/decrypt', (req, res) => {
  const { token, password } = req.body;

  if (password !== SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    res.json({ data: decoded });
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Decryption Service running on port ${port}`);
});
