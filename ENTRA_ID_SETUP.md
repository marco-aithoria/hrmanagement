# Entra ID (Azure AD) Authentication Setup Guide

This guide will walk you through setting up Microsoft Entra ID (formerly Azure AD) authentication for your HR Management System with the tenant `aithoria.onmicrosoft.com`.

## Prerequisites

1. Access to Azure Portal with admin permissions for the `aithoria.onmicrosoft.com` tenant
2. Node.js and npm installed
3. Your application running locally

## Step 1: Azure App Registration

### 1.1 Create App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the details:
   - **Name**: `HR Management System` (or your preferred name)
   - **Supported account types**: Select "Accounts in this organizational directory only (aithoria.onmicrosoft.com only - Single tenant)"
   - **Redirect URI**: 
     - Platform: `Single-page application (SPA)`
     - URI: `http://localhost:5173`

### 1.2 Configure Authentication

1. In your app registration, go to **Authentication**
2. Under **Single-page application**, ensure `http://localhost:5173` is listed
3. For production, add your production URLs
4. Under **Advanced settings**:
   - Enable **Access tokens** and **ID tokens**
   - Set **Allow public client flows** to **Yes**

### 1.3 Get Application Details

1. Go to **Overview** tab
2. Copy the following values:
   - **Application (client) ID**
   - **Directory (tenant) ID**

### 1.4 Create Client Secret (for backend)

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add a description and set expiration
4. Copy the **Value** (you won't be able to see it again)

### 1.5 Configure API Permissions

1. Go to **API permissions**
2. Ensure these permissions are present:
   - `Microsoft Graph` > `User.Read` (Delegated)
   - `Microsoft Graph` > `openid` (Delegated)
   - `Microsoft Graph` > `profile` (Delegated)
   - `Microsoft Graph` > `email` (Delegated)

## Step 2: Update Environment Variables

### 2.1 Backend Configuration

Update `backend/.env` with your Azure app registration details:

```env
# Session Configuration
SESSION_SECRET=hr_management_secret_key

# Entra ID (Azure AD) Configuration
ENTRA_CLIENT_ID=your_application_client_id_from_step_1.3
ENTRA_CLIENT_SECRET=your_client_secret_from_step_1.4
ENTRA_TENANT_ID=your_tenant_id_from_step_1.3
ENTRA_TENANT_NAME=aithoria.onmicrosoft.com
ENTRA_AUTHORITY=https://login.microsoftonline.com/aithoria.onmicrosoft.com

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173

# Server Configuration
PORT=5000
```

### 2.2 Frontend Configuration

Update `frontend/.env` with your Azure app registration details:

```env
# Entra ID (Azure AD) Configuration
VITE_ENTRA_CLIENT_ID=your_application_client_id_from_step_1.3
VITE_ENTRA_AUTHORITY=https://login.microsoftonline.com/aithoria.onmicrosoft.com
VITE_ENTRA_REDIRECT_URI=http://localhost:5173

# Backend API URL
VITE_API_BASE_URL=http://localhost:5000/api
```

## Step 3: Test the Setup

### 3.1 Start the Applications

1. Start the backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

### 3.2 Test Authentication

1. Open http://localhost:5173
2. Click **"Sign in with Microsoft (Entra ID)"**
3. You should be redirected to Microsoft login
4. After successful authentication, you should be redirected back to the app

## Step 4: Production Setup

### 4.1 Update Redirect URIs

1. In Azure Portal, go to your app registration
2. Update **Authentication** > **Single-page application** redirect URIs
3. Add your production domain: `https://your-domain.com`

### 4.2 Update Environment Variables

Update your production environment variables with:
- Production redirect URI
- Production API base URL
- Secure session secrets

## Features Implemented

### ✅ Dual Authentication Support
- **Entra ID (SSO)**: Modern single sign-on experience
- **Traditional Login**: Email/password for existing users

### ✅ Automatic User Provisioning
- New users are automatically created when they sign in with Entra ID
- User information is extracted from the ID token
- Users are assigned the 'employee' role by default

### ✅ Token Validation
- JWT tokens are validated using Azure's public keys
- Tokens are verified for audience, issuer, and signature
- Automatic token refresh through MSAL

### ✅ Session Management
- Supports both token-based and session-based authentication
- Graceful fallback between authentication methods
- Proper logout handling for both authentication types

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Ensure the redirect URI in Azure matches exactly (including trailing slashes)
   - Check that you're using the correct protocol (http vs https)

2. **"Token validation failed"**
   - Verify the client ID in environment variables matches Azure
   - Check that the tenant ID/name is correct
   - Ensure the token audience matches your application

3. **"CORS errors"**
   - Verify the FRONTEND_URL in backend .env matches your frontend URL
   - Check that credentials are being sent with requests

4. **"User not found"**
   - The application automatically creates users on first Entra ID login
   - Check database connectivity and permissions

### Debug Mode

To enable debug logging, add this to your backend:

```javascript
// In server.js, add after other middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.headers.authorization ? 'with auth' : 'no auth');
  next();
});
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **Client Secrets**: Rotate client secrets regularly
3. **HTTPS**: Use HTTPS in production
4. **Token Storage**: Tokens are stored in sessionStorage (cleared on browser close)
5. **Session Secrets**: Use strong, unique session secrets in production

## Support

For additional help:
- [Microsoft Authentication Library (MSAL) Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-overview)
- [Azure AD App Registration Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)

---

**Note**: Replace all placeholder values in the environment files with your actual Azure app registration details before testing.