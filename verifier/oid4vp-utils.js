// oid4vp-utils.js
const jose = require('node-jose');

async function verifyPresentation(vp_token, sessionData) {
  try {
    // 1. Verify the JWT signature (assuming the vp_token is a JWT)
    const keystore = jose.JWK.createKeyStore();
    // In a real scenario, you would load the issuer's public key
    // For this example, we'll use a placeholder key
    await keystore.generate('RSA', 2048, { alg: 'RS256', use: 'sig' });
    const verifiedToken = await jose.JWS.createVerify(keystore).verify(vp_token);
    
    // 2. Decode and parse the payload
    const payload = JSON.parse(verifiedToken.payload.toString());
    
    // 3. Verify the nonce
    if (payload.nonce !== sessionData.nonce) {
      throw new Error('Invalid nonce');
    }
    
    // 4. Verify the audience (client_id)
    if (payload.aud !== sessionData.authorizationRequest.client_id) {
      throw new Error('Invalid audience');
    }
    
    // 5. Verify the requested credential types are present
    const requestedTypes = sessionData.authorizationRequest.presentation_definition.input_descriptors.map(d => d.id);
    const presentedTypes = payload.vp.verifiableCredential.map(vc => vc.type[1]);
    const missingTypes = requestedTypes.filter(type => !presentedTypes.includes(type));
    
    if (missingTypes.length > 0) {
      throw new Error(`Missing requested credential types: ${missingTypes.join(', ')}`);
    }
    
    // 6. Perform additional checks on each credential
    // (In a real scenario, you'd verify each credential's signature, check revocation status, etc.)
    
    return {
      isValid: true,
      sharedCredentials: payload.vp.verifiableCredential
    };
  } catch (error) {
    console.error('Verification error:', error);
    return {
      isValid: false,
      error: error.message
    };
  }
}

module.exports = { verifyPresentation };