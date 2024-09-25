const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const jose = require('jose');
const crypto = require('crypto');

const app = express();
const port = 3006;


app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3004', 'http://localhost:3005','http://localhost:3003' ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

const verifierKeyPair = crypto.generateKeyPairSync('ed25519');
const verifierDid = `did:example:verifier${uuidv4()}`;

const activeRequests = new Map();
let lastVerificationResult = null;

app.get('/jwks', (req, res) => {
  const jwk = jose.exportJWK(verifierKeyPair.publicKey);
  res.json({
    keys: [{ ...jwk, kid: 'verifier-key-1', use: 'sig', alg: 'EdDSA' }]
  });
});

app.post('/generate-request', async (req, res) => {
  const { credentialType } = req.body;
  const nonce = uuidv4();
  const state = uuidv4();

  const presentationDefinition = {
    id: uuidv4(),
    input_descriptors: [
      {
        id: 'credential_request',
        name: credentialType,
        purpose: `Please provide your ${credentialType} credential`,
        constraints: {
          fields: [
            {
              path: ['$.type'],
              filter: {
                type: 'string',
                pattern: credentialType
              }
            }
          ]
        }
      }
    ]
  };

  const request = {
    response_type: 'vp_token',
    response_mode: 'direct_post',
    client_id: `http://localhost:${port}/callback`,
    redirect_uri: `http://localhost:${port}/callback`,
    presentation_definition: presentationDefinition,
    nonce: nonce,
    state: state
  };

  activeRequests.set(state, { nonce, credentialType });

  const jwt = await new jose.SignJWT(request)
    .setProtectedHeader({ alg: 'EdDSA', typ: 'JWT', kid: 'verifier-key-1' })
    .setIssuedAt()
    .setIssuer(verifierDid)
    .setAudience('https://self-issued.me/v2')
    .setExpirationTime('5m')
    .sign(verifierKeyPair.privateKey);

  res.json({ request: jwt });
});

app.post('/callback', async (req, res) => {
  const { vp_token, state } = req.body;

  if (!activeRequests.has(state)) {
    return res.status(400).json({ error: 'Invalid state' });
  }

  const { nonce, credentialType } = activeRequests.get(state);
  activeRequests.delete(state);

  try {
    // Verify the JWT signature
    const secretKey = new TextEncoder().encode('your-secret-key');
    const { payload } = await jose.jwtVerify(vp_token, secretKey, {
      algorithms: ['HS256']
    });

    // Verify nonce
    if (payload.nonce !== nonce) {
      throw new Error('Invalid nonce');
    }

    // Verify credential type
    const vc = payload.vp.verifiableCredential[0];
    const decodedVc = jose.decodeJwt(vc);
    if (!decodedVc.type.includes(credentialType)) {
      throw new Error('Invalid credential type');
    }

    lastVerificationResult = {
      verified: true,
      credentialType: credentialType,
      credentialSubject: decodedVc.credentialSubject
    };

    res.json(lastVerificationResult);
  } catch (error) {
    console.error('Verification error:', error);
    lastVerificationResult = { verified: false, error: error.message };
    res.status(400).json(lastVerificationResult);
  }
});

app.get('/verification-status', (req, res) => {
  if (lastVerificationResult) {
    res.json(lastVerificationResult);
  } else {
    res.json({ status: 'No verification result available' });
  }
});

app.listen(port, () => {
  console.log(`Verifier backend running on http://localhost:${port}`);
});