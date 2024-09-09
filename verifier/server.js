const express = require('express');
const cors = require('cors');
const { verifyPresentation } = require('./oid4vp-utils');

const app = express();
const port = 3004;

app.use(express.json());
app.use(cors());

// Endpoint to receive the verifiable presentation
app.post('/verify', async (req, res) => {
  const { verifiablePresentation, sessionId } = req.body;

  try {
    // Verify the verifiable presentation
    const isValid = await verifyPresentation(verifiablePresentation, sessionId);

    if (isValid) {
      res.status(200).json({ message: 'Verifiable presentation is valid' });
    } else {
      res.status(400).json({ error: 'Invalid verifiable presentation' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error verifying presentation' });
  }
});

app.listen(port, () => {
  console.log(`Verifier server running on port ${port}`);
});
