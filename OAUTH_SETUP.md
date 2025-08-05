# OAuth Setup Instructions

Your app now supports OAuth authentication with Google, GitHub, and LinkedIn! Here's how to set it up:

## 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your OAuth credentials:

```bash
cp .env.example .env.local
```

## 2. OAuth App Setup

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env.local`

### GitHub OAuth Setup
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set:
   - Application name: DeepHire
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Client Secret to `.env.local`

### LinkedIn OAuth Setup
1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Create a new app
3. Add "Sign In with LinkedIn" product
4. Set authorized redirect URLs: `http://localhost:3000/api/auth/callback/linkedin`
5. Copy Client ID and Client Secret to `.env.local`

## 3. NextAuth Secret

Generate a random secret for NextAuth:

```bash
openssl rand -base64 32
```

Add this to `NEXTAUTH_SECRET` in your `.env.local`

## 4. Features

✅ **OAuth Login/Signup**: Google, GitHub, LinkedIn
✅ **Existing Email/Password**: Still works
✅ **Session Management**: Automatic with NextAuth
✅ **Database Integration**: OAuth users stored in MongoDB
✅ **Backward Compatibility**: All existing features preserved

## 5. How It Works

- Users can sign up/login with OAuth or email/password
- OAuth users are automatically created in your MongoDB database
- Existing email/password users can link OAuth accounts
- All existing API routes and functionality preserved
- Session management handled by NextAuth.js

## 6. Testing

1. Start your app: `npm run dev`
2. Go to `/login`
3. Try OAuth buttons (they'll redirect to real OAuth flows)
4. Existing email/password login still works

The app seamlessly handles both authentication methods!
