// server.js
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { verifyPresentation } = require('./oid4vp-utils');

const app = express();
const port = 3003;

app.use(express.json());
app.use(cors());

const sessions = {};

const credentialTypes = [
  'UniversityDegreeCredential',
  'DriverLicenseCredential',
  'PIDCredential',
  'ResidenceCertificateCredential'
];

app.post('/create-session', (req, res) => {
  const { selectedCredentials } = req.body;
  const sessionId = uuidv4();
  const nonce = crypto.randomBytes(16).toString('hex');

  const authorizationRequest = {
    response_type: 'vp_token',
    response_mode: 'direct_post',
    client_id: `http://localhost:${port}/present`,
    redirect_uri: `http://localhost:${port}/present`,
    scope: 'openid',
    nonce: nonce,
    presentation_definition: {
      id: sessionId,
      input_descriptors: selectedCredentials.map(credType => ({
        id: credType,
        schema: [{ uri: 'https://www.w3.org/2018/credentials/examples/v1' }],
        constraints: {
          fields: [{ 
            path: ['$.type'], 
            filter: { 
              type: 'string', 
              pattern: credType 
            } 
          }]
        }
      }))
    }
  };

  sessions[sessionId] = { 
    nonce, 
    status: 'pending', 
    authorizationRequest 
  };

  const qrCodeData = JSON.stringify({
    url: `openid-vc://?request_uri=http://localhost:${port}/authorization-request/${sessionId}`,
    sessionId: sessionId
  });

  res.json({ sessionId, qrCodeData });
});

app.get('/authorization-request/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  if (!sessions[sessionId]) {
    return res.status(400).json({ error: 'Invalid session' });
  }
  res.json(sessions[sessionId].authorizationRequest);
});

app.post('/present', async (req, res) => {
  const { vp_token, presentation_submission } = req.body;
  const sessionId = presentation_submission.definition_id;

  if (!sessions[sessionId]) {
    return res.status(400).json({ error: 'Invalid session' });
  }

  const verificationResult = await verifyPresentation(vp_token, sessions[sessionId]);

  sessions[sessionId] = {
    ...sessions[sessionId],
    status: 'completed',
    ...verificationResult
  };

  res.json({ message: 'Presentation received and verified', isValid: verificationResult.isValid });
});

app.get('/verify-status/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  if (!sessions[sessionId]) {
    return res.status(400).json({ error: 'Invalid session' });
  }

  res.json(sessions[sessionId]);
});

app.listen(port, () => {
  console.log(`Verifier server running on port ${port}`);
});
