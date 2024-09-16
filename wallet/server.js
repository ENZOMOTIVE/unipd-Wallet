const express = require('express');
const cors = require('cors');

const app = express();
const port = 3002;

app.use(express.json());
app.use(cors());

const CORRECT_PASSWORD = '1234'; // In a real app, this would be stored securely

app.post('/verify-password', (req, res) => {
  const { password } = req.body;
  if (password === CORRECT_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Incorrect password' });
  }
});

app.post('/store-credential', (req, res) => {
  const { credential } = req.body;
  console.log('Received credential:', credential);
  res.json({ message: 'Credential stored successfully' });
});

app.listen(port, () => {
  console.log(`Wallet backend running on http://localhost:${port}`);
});