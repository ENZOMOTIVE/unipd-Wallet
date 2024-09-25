const express = require('express');
const cors = require('cors');
const jose = require('jose');
const crypto = require('crypto');

const app = express();
const port = 3002;

app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3006']
}));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

const CORRECT_PASSWORD = '1234'; // In a real app, this would be stored securely and hashed
let storedCredentials = []; // In-memory storage for credentials

const walletKeyPair = crypto.generateKeyPairSync('ed25519');

app.post('/verify-password', (req, res) => {
  const { password } = req.body;
  if (password === CORRECT_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Incorrect password' });
  }
});

app.post('/store-credential', async (req, res) => {
  const { credential } = req.body;
  console.log('Received credential:', credential);

  try {
    // Verify the JWT signature
    const { payload } = await jose.jwtVerify(credential, walletKeyPair.publicKey, {
      algorithms: ['EdDSA']
    });

    // If verification is successful, store the credential
    storedCredentials.push(credential);
    res.json({ message: 'Credential stored successfully' });
  } catch (error) {
    console.error('Error verifying credential:', error);
    res.status(400).json({ error: 'Invalid credential' });
  }
});

app.get('/credentials', (req, res) => {
  res.json(storedCredentials);
});

app.get('/wallet-public-key', (req, res) => {
  const jwk = jose.exportJWK(walletKeyPair.publicKey);
  res.json({ ...jwk, kid: 'wallet-key-1', use: 'sig', alg: 'EdDSA' });
});

app.use((req, res) => {
  console.log(`404 - Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).send('404 - Resource not found');
});

app.listen(port, () => {
  console.log(`Wallet backend running on http://localhost:${port}`);
});