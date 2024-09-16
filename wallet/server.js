// Backend (server.js)
const express = require('express');
const cors = require('cors');

const app = express();
const port = 3002;

app.use(express.json());
app.use(cors());

// This endpoint is just for demonstration purposes
// In a real application, credential storage would be more secure
app.post('/store-credential', (req, res) => {
  const { credential } = req.body;
  // Here you would typically store the credential securely
  console.log('Received credential:', credential);
  res.json({ message: 'Credential stored successfully' });
});

app.listen(port, () => {
  console.log(`Wallet backend running on http://localhost:${port}`);
});