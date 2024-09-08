const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode'); // Add this line to use QR Code library

const app = express();
const port = 3001;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Secret key for signing JWT
const SECRET_KEY = '1234';

// Route to issue JWT credential
app.post('/issue', async (req, res) => {
  const { userId, degree, issuer } = req.body;

  // Create the payload for the JWT
  const payload = {
    userId,
    degree,
    issuer,
    issuedAt: new Date().toISOString(),
  };

  // Sign the JWT with a secret key
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });

  try {
    // Generate QR Code URL
    const qrCodeUrl = await QRCode.toDataURL(token); // Generate QR code image as base64 URL

    // Send the signed JWT and QR code URL back to the issuer
    res.json({ credential: token, qrCodeUrl });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).send('Error generating QR code');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Issuer backend is running on http://localhost:${port}`);
});
