const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { verifyPresentation } = require('./oid4vp-utils');

const app = express();
const port = 3004;

app.use(express.json());
app.use(cors());

// In-memory storage for sessions and verifications
const sessions = {};
const verifications = {};

// Endpoint to create a new session and authorization request
app.post('/create-session', (req, res) => {
  const sessionId = crypto.randomBytes(16).toString('hex');
  const nonce = crypto.randomBytes(16).toString('hex');

  const authorizationRequest = {
    type: 'VerifiablePresentationRequest',
    challenge: nonce,
    credentialTypes: ['PID', 'UniversityDegree'], // Example credential types
    sessionId: sessionId
  };

  sessions[sessionId] = { nonce, status: 'pending' };

  res.json({ sessionId, authorizationRequest });
});

// Endpoint to receive the verifiable presentation
app.post('/present', async (req, res) => {
  const { verifiablePresentation, sessionId } = req.body;

  if (!sessions[sessionId]) {
    return res.status(400).json({ error: 'Invalid session' });
  }

  try {
    // Use the verifyPresentation function from oid4vp-utils.js
    const isValid = await verifyPresentation(verifiablePresentation, sessionId);

    verifications[sessionId] = {
      isValid,
      sharedCredentials: isValid ? extractSharedCredentials(verifiablePresentation) : null
    };

    sessions[sessionId].status = 'completed';

    res.json({ message: 'Presentation received and verified' });
  } catch (error) {
    console.error('Error verifying presentation:', error);
    res.status(500).json({ error: 'Error verifying presentation' });
  }
});

// Endpoint to check verification status
app.get('/verify-status/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  if (!sessions[sessionId]) {
    return res.status(400).json({ error: 'Invalid session' });
  }

  if (sessions[sessionId].status === 'completed') {
    res.json({ status: 'completed', result: verifications[sessionId] });
  } else {
    res.json({ status: 'pending' });
  }
});

// Helper function to extract shared credentials (simplified for the example)
function extractSharedCredentials(presentation) {
  // In a real implementation, you would extract and validate the credentials
  return presentation.verifiableCredential;
}

app.listen(port, () => {
  console.log(`Verifier server running on port ${port}`);
});