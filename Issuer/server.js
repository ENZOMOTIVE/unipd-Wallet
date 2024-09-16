const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

const SECRET_KEY = '1234'; // This should be a secure, randomly generated key in production

// Initialize pendingCredentials
app.locals.pendingCredentials = {};

app.get('/.well-known/openid-credential-issuer', (req, res) => {
  res.json({
    issuer: 'http://localhost:3001',
    token_endpoint: 'http://localhost:3001/token',
    credential_endpoint: 'http://localhost:3001/credential',
  });
});

app.post('/create-offer', async (req, res) => {
  const { userId, credentialType, credentialFields } = req.body;

  const preAuthorizedCode = uuidv4();

  const credentialOffer = {
    credential_issuer: 'http://localhost:3001',
    credentials: ['VerifiableCredential'],
    grants: {
      'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
        'pre-authorized_code': preAuthorizedCode,
      }
    }
  };

  // Store the credential details for later use
  app.locals.pendingCredentials[preAuthorizedCode] = { userId, credentialType, credentialFields };

  try {
    const qrCodeData = JSON.stringify(credentialOffer);
    const qrCodeUrl = await QRCode.toDataURL(qrCodeData);
    res.json({ qrCodeUrl, credentialOffer });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

app.post('/token', (req, res) => {
  const { grant_type, pre_authorized_code } = req.body;

  if (grant_type !== 'urn:ietf:params:oauth:grant-type:pre-authorized_code') {
    return res.status(400).json({ error: 'Invalid grant type' });
  }

  // In a real application, validate the pre-authorized code here

  const accessToken = uuidv4();
  res.json({ access_token: accessToken, token_type: 'Bearer' });
});

app.post('/credential', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Invalid authorization header' });
  }

  const accessToken = authHeader.split(' ')[1];
  // In a real application, validate the access token here

  try {
    // Retrieve the pending credential details
    const pendingCredentials = app.locals.pendingCredentials;
    if (!pendingCredentials || Object.keys(pendingCredentials).length === 0) {
      return res.status(404).json({ error: 'No pending credentials found' });
    }

    // This is a simplified example. In a real application, you'd use the access token to identify the correct credential
    const pendingCredential = Object.values(pendingCredentials)[0];

    if (!pendingCredential) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    const { userId, credentialType, credentialFields } = pendingCredential;

    const credential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://www.w3.org/2018/credentials/examples/v1'
      ],
      type: ['VerifiableCredential', `${credentialType}Credential`],
      issuer: 'http://localhost:3001',
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: userId,
        ...credentialFields
      }
    };

    res.json(credential);
  } catch (error) {
    console.error('Error generating credential:', error);
    res.status(500).json({ error: 'Failed to generate credential' });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Issuer running on http://localhost:${port}`);
});