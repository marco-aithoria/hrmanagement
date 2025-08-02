require('dotenv').config();

const entraConfig = {
  clientId: process.env.ENTRA_CLIENT_ID,
  clientSecret: process.env.ENTRA_CLIENT_SECRET,
  tenantId: process.env.ENTRA_TENANT_ID,
  tenantName: process.env.ENTRA_TENANT_NAME || 'aithoria.onmicrosoft.com',
  authority: process.env.ENTRA_AUTHORITY || `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_NAME || 'aithoria.onmicrosoft.com'}`,
  redirectUri: process.env.ENTRA_REDIRECT_URI || 'http://localhost:5173',
  scopes: ['openid', 'profile', 'email', 'User.Read'],
  
  // JWT validation settings
  jwksUri: `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_NAME || 'aithoria.onmicrosoft.com'}/discovery/v2.0/keys`,
  issuer: `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID || process.env.ENTRA_TENANT_NAME || 'aithoria.onmicrosoft.com'}/v2.0`,
  audience: process.env.ENTRA_CLIENT_ID
};

module.exports = entraConfig;