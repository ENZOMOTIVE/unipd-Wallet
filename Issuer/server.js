const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const jose = require('jose');
const crypto = require('crypto');

const app = express();
const port = 3001;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3003'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

const issuerKeyPair = crypto.generateKeyPairSync('ed25519');
const issuerDid = `did:example:${uuidv4()}`;
const FIXED_PUBLIC_KEY = '1234';

// In-memory storage for demo purposes. In a real application, use a database.
const issuedTokens = new Set();
const credentialOffers = new Map();

app.get('/.well-known/openid-credential-issuer', (req, res) => {
  res.json({
    issuer: `http://localhost:${port}`,
    authorization_endpoint: `http://localhost:${port}/authorize`,
    token_endpoint: `http://localhost:${port}/token`,
    credential_endpoint: `http://localhost:${port}/credential`,
    jwks_uri: `http://localhost:${port}/jwks`,
    credential_issuer: `http://localhost:${port}`,
    credentials_supported: [
      {
        format: 'jwt_vc',
        types: ['VerifiableCredential', 'UniversityDegreeCredential']
      }
    ]
  });
});

app.get('/jwks', (req, res) => {
  const jwk = jose.exportJWK(issuerKeyPair.publicKey);
  res.json({
    keys: [{ ...jwk, kid: 'issuer-key-1', use: 'sig', alg: 'EdDSA' }]
  });
});

app.post('/create-offer', async (req, res) => {
  const { userId, credentialType, credentialFields } = req.body;
  const offerId = uuidv4();
  
  const credentialOffer = {
    credential_issuer: `http://localhost:${port}`,
    credentials: [credentialType],
    grants: {
      'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
        'pre-authorized_code': offerId,
      }
    }
  };

  credentialOffers.set(offerId, { userId, credentialType, credentialFields });

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

  if (!credentialOffers.has(pre_authorized_code)) {
    return res.status(400).json({ error: 'Invalid pre-authorized code' });
  }

  const accessToken = uuidv4();
  issuedTokens.add(accessToken);

  res.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    c_nonce: uuidv4(),
    c_nonce_expires_in: 3600
  });
});

app.post('/credential', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Invalid authorization header' });
  }

  const accessToken = authHeader.split(' ')[1];
  if (!issuedTokens.has(accessToken)) {
    return res.status(401).json({ error: 'Invalid access token' });
  }

  const { format, proof } = req.body;

  if (format !== 'jwt_vc') {
    return res.status(400).json({ error: 'Unsupported credential format' });
  }

  // In a real implementation, verify the proof here

  try {
    const offerData = Array.from(credentialOffers.values())[0]; // For demo, just use the first offer
    const { userId, credentialType, credentialFields } = offerData;

    const credentialId = `http://localhost:${port}/credentials/${uuidv4()}`;
    const issuanceDate = new Date().toISOString();
    const expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year from now

    const credentialPayload = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://www.w3.org/2018/credentials/examples/v1'
      ],
      id: credentialId,
      type: ['VerifiableCredential', credentialType],
      issuer: issuerDid,
      issuanceDate: issuanceDate,
      expirationDate: expirationDate,
      credentialSubject: {
        id: `did:example:${userId}`,
        ...credentialFields
      }
    };

    const proof = {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      verificationMethod: `${issuerDid}#keys-1`,
      proofPurpose: 'assertionMethod',
      proofValue: crypto.createHmac('sha256', FIXED_PUBLIC_KEY)
                       .update(JSON.stringify(credentialPayload))
                       .digest('hex')
    };

    credentialPayload.proof = proof;

    const jwt = await new jose.SignJWT(credentialPayload)
    .setProtectedHeader({ alg: 'EdDSA', typ: 'JWT', kid: 'issuer-key-1' })
    .setJti(credentialId)
    .setIssuedAt()
    .setIssuer(issuerDid)
    .setSubject(credentialPayload.credentialSubject.id)
    .setAudience(credentialPayload.credentialSubject.id)
    .setExpirationTime('1y')
    .sign(issuerKeyPair.privateKey);

  issuedTokens.delete(accessToken); // Remove the used token
  credentialOffers.clear(); // Clear the offer after issuance

  res.json({ format: 'jwt_vc', credential: jwt });

} catch (error) {
  console.error('Error generating credential:', error);
  res.status(500).json({ error: 'Failed to generate credential' });
}
});

app.listen(port, () => {
  console.log(`OID4VCI Issuer running on http://localhost:${port}`);
});