// Backend (server.js)
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

const SECRET_KEY = '1234'; // This should be a secure, randomly generated key in production

app.get('/.well-known/openid-credential-issuer', (req, res) => {
  res.json({
    issuer: 'http://localhost:3001',
    token_endpoint: 'http://localhost:3001/token',
    credential_endpoint: 'http://localhost:3001/credential',
  });
});

app.post('/create-offer', async (req, res) => {
  const { userId, degree } = req.body;
  
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

  const qrCodeData = JSON.stringify(credentialOffer);
  const qrCodeUrl = await QRCode.toDataURL(qrCodeData);

  res.json({ qrCodeUrl, credentialOffer });
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

  const credential = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://www.w3.org/2018/credentials/examples/v1'
    ],
    type: ['VerifiableCredential', 'UniversityDegreeCredential'],
    issuer: 'http://localhost:3001',
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: 'did:example:ebfeb1f712ebc6f1c276e12ec21',
      degree: {
        type: 'BachelorDegree',
        name: 'Bachelor of Science and Arts',
      }
    }
  };

  res.json(credential);
});

app.listen(port, () => {
  console.log(`Issuer running on http://localhost:${port}`);
});