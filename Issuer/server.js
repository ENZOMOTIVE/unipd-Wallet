const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const jose = require('jose');
const crypto = require('crypto');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3003'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// WebSocket clients set
const clients = new Set();

// WebSocket connection handler
wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
});

// Broadcast log function
function broadcastLog(message) {
  const log = JSON.stringify({
    timestamp: new Date().toISOString(),
    message: message
  });
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(log);
    }
  });
}

// Logging middleware
app.use((req, res, next) => {
  broadcastLog(`${req.method} ${req.originalUrl}`);
  next();
});

// Generate issuer key pair and DID
const issuerKeyPair = crypto.generateKeyPairSync('ed25519');
const issuerDid = `did:example:${uuidv4()}`;
const FIXED_PUBLIC_KEY = '1234';

// In-memory storage
const issuedTokens = new Set();
const credentialOffers = new Map();

// Credential types
const credentialTypes = {
  'UniversityDegree': ['name', 'degreeType', 'university', 'graduationDate'],
  'DriverLicense': ['name', 'licenseNumber', 'issueDate', 'expiryDate'],
  'PID': ['name', 'idNumber', 'dateOfBirth', 'address'],
  'ResidenceCertificate': ['name', 'address', 'issueDate', 'validUntil'],
  'Passport': ['name', 'passportNumber', 'nationality', 'dateOfBirth', 'expiryDate'],
  'Diploma': ['name', 'institution', 'degree', 'graduationDate'],
  'Transcript': ['name', 'institution', 'courses', 'gpa']
};

// OpenID Configuration endpoint
app.get('/.well-known/openid-credential-issuer', (req, res) => {
  res.json({
    issuer: `http://localhost:${port}`,
    authorization_endpoint: `http://localhost:${port}/authorize`,
    token_endpoint: `http://localhost:${port}/token`,
    credential_endpoint: `http://localhost:${port}/credential`,
    jwks_uri: `http://localhost:${port}/jwks`,
    credential_issuer: `http://localhost:${port}`,
    credentials_supported: Object.keys(credentialTypes).map(type => ({
      format: 'jwt_vc',
      types: ['VerifiableCredential', type]
    }))
  });
  broadcastLog('OpenID Configuration requested');
});

// JWKS endpoint
app.get('/jwks', (req, res) => {
  const jwk = jose.exportJWK(issuerKeyPair.publicKey);
  res.json({
    keys: [{ ...jwk, kid: 'issuer-key-1', use: 'sig', alg: 'EdDSA' }]
  });
  broadcastLog('JWKS requested');
});

// Create credential offer endpoint
app.post('/create-offer', async (req, res) => {
  const { userId, credentialType, credentialFields } = req.body;
  const offerId = uuidv4();

  const credentialOffer = {
    credential_issuer: `http://localhost:${port}`,
    credentials: [{
      type: credentialType,
      manifest: `http://localhost:${port}/credential-manifests/${credentialType}`
    }],
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
    broadcastLog(`Credential offer created for user ${userId}`);
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
    broadcastLog(`Error generating QR code for user ${userId}`);
  }
});

// Token endpoint
app.post('/token', (req, res) => {
  const { grant_type, pre_authorized_code } = req.body;

  if (grant_type !== 'urn:ietf:params:oauth:grant-type:pre-authorized_code') {
    broadcastLog('Invalid grant type received');
    return res.status(400).json({ error: 'Invalid grant type' });
  }

  if (!credentialOffers.has(pre_authorized_code)) {
    broadcastLog('Invalid pre-authorized code received');
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
  broadcastLog(`Access token issued for pre-authorized code ${pre_authorized_code}`);
});

// Credential endpoint
app.post('/credential', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    broadcastLog('Invalid authorization header received');
    return res.status(401).json({ error: 'Invalid authorization header' });
  }

  const accessToken = authHeader.split(' ')[1];
  if (!issuedTokens.has(accessToken)) {
    broadcastLog('Invalid access token received');
    return res.status(401).json({ error: 'Invalid access token' });
  }

  const { format, proof } = req.body;

  if (format !== 'jwt_vc') {
    broadcastLog('Unsupported credential format requested');
    return res.status(400).json({ error: 'Unsupported credential format' });
  }

  try {
    const offerData = Array.from(credentialOffers.values())[0];
    const { userId, credentialType, credentialFields } = offerData;

    const credentialId = `http://localhost:${port}/credentials/${uuidv4()}`;
    const issuanceDate = new Date().toISOString();
    const expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

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

    // Adjust credential subject based on credential type
    switch (credentialType) {
      case 'UniversityDegree':
        credentialPayload.credentialSubject = {
          id: `did:example:${userId}`,
          degree: {
            type: credentialFields.degreeType,
            name: credentialFields.name
          },
          university: credentialFields.university,
          graduationDate: credentialFields.graduationDate
        };
        break;
      case 'DriverLicense':
        credentialPayload.credentialSubject = {
          id: `did:example:${userId}`,
          name: credentialFields.name,
          licenseNumber: credentialFields.licenseNumber,
          expiryDate: credentialFields.expiryDate
        };
        break;
      case 'PID':
        credentialPayload.credentialSubject = {
          id: `did:example:${userId}`,
          name: credentialFields.name,
          idNumber: credentialFields.idNumber,
          dateOfBirth: credentialFields.dateOfBirth,
          address: credentialFields.address
        };
        break;
      case 'ResidenceCertificate':
        credentialPayload.credentialSubject = {
          id: `did:example:${userId}`,
          name: credentialFields.name,
          address: credentialFields.address,
          issueDate: credentialFields.issueDate,
          validUntil: credentialFields.validUntil
        };
        break;
      case 'Passport':
        credentialPayload.credentialSubject = {
          id: `did:example:${userId}`,
          name: credentialFields.name,
          passportNumber: credentialFields.passportNumber,
          nationality: credentialFields.nationality,
          dateOfBirth: credentialFields.dateOfBirth,
          expiryDate: credentialFields.expiryDate
        };
        break;
      case 'Diploma':
        credentialPayload.credentialSubject = {
          id: `did:example:${userId}`,
          name: credentialFields.name,
          degree: {
            type: credentialFields.degree,
            name: credentialFields.degree
          },
          institution: credentialFields.institution,
          graduationDate: credentialFields.graduationDate
        };
        break;
      case 'Transcript':
        try {
          credentialPayload.credentialSubject = {
            id: `did:example:${userId}`,
            name: credentialFields.name,
            institution: credentialFields.institution,
            courses: JSON.parse(credentialFields.courses),
            gpa: credentialFields.gpa
          };
        } catch (error) {
          console.error('Error parsing courses JSON:', error);
          return res.status(400).json({ error: 'Invalid courses data' });
        }
        break;
      default:
        // For other types, use the credentialFields as is
        break;
    }

    const proofValue = crypto.createHmac('sha256', FIXED_PUBLIC_KEY)
                             .update(JSON.stringify(credentialPayload))
                             .digest('hex');

    const proof = {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      verificationMethod: `${issuerDid}#keys-1`,
      proofPurpose: 'assertionMethod',
      proofValue: proofValue
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

    issuedTokens.delete(accessToken);
    credentialOffers.clear();

    res.json({ format: 'jwt_vc', credential: jwt });
    broadcastLog(`Credential issued for user ${userId}`);

  } catch (error) {
    console.error('Error generating credential:', error);
    res.status(500).json({ error: 'Failed to generate credential' });
    broadcastLog('Error generating credential');
  }
});

// Start the server
server.listen(port, () => {
  console.log(`OID4VCI Issuer running on http://localhost:${port}`);
  broadcastLog('Server started');
});