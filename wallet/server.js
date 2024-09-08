const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const SECRET = '1234'; // Replace with your own secret

app.post('/issue', (req, res) => {
  const { userId, degree, issuer } = req.body;
  const token = jwt.sign(
    {
      sub: userId,
      degree: degree,
      issuer: issuer,
    },
    SECRET,
    { expiresIn: '1h' }
  );
  res.json({ token });
});

app.listen(3000, () => {
  console.log('Credential Issuer running on port 3000');
});
