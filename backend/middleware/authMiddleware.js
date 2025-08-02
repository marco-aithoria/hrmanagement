const jwt = require('jsonwebtoken');
const JwksClient = require('jwks-client').default;
const entraConfig = require('../config/entraConfig');

// Create JWKS client for token validation
const client = JwksClient({
  jwksUri: entraConfig.jwksUri,
  requestHeaders: {}, // Optional
  timeout: 30000, // Defaults to 30s
});

// Function to get signing key
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

// Middleware to verify Entra ID tokens
const verifyEntraToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Verify the token
  jwt.verify(token, getKey, {
    audience: entraConfig.audience,
    issuer: entraConfig.issuer,
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) {
      console.error('Token verification failed:', err);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Add user info to request
    req.user = {
      id: decoded.oid || decoded.sub, // Object ID or Subject ID
      email: decoded.email || decoded.preferred_username,
      name: decoded.name,
      given_name: decoded.given_name,
      family_name: decoded.family_name,
      roles: decoded.roles || [],
      groups: decoded.groups || []
    };

    next();
  });
};

// Optional middleware for session-based auth (fallback)
const verifySession = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }
  return res.status(401).json({ error: 'Not authenticated' });
};

// Combined auth middleware (checks both token and session)
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Use token-based authentication
    return verifyEntraToken(req, res, next);
  } else if (req.session && req.session.user) {
    // Fallback to session-based authentication
    req.user = req.session.user;
    return next();
  } else {
    return res.status(401).json({ error: 'Authentication required' });
  }
};

module.exports = {
  verifyEntraToken,
  verifySession,
  authenticate
};