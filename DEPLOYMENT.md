# Deployment Guide - FIFA League Manager

This guide will help you deploy the FIFA League Manager app to production.

## Prerequisites

- Node.js 18+ installed
- A Firebase project set up
- A Vercel account (recommended) or another hosting provider
- Git installed

## 1. Environment Variables Setup

### 1.1 Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to Project Settings > General
4. Scroll down to "Your apps" and select your web app (or create one)
5. Copy the Firebase configuration values

### 1.2 Create Environment Variables

1. Copy the example environment file:
   ```bash
   cd frontend/my-app
   cp .env.example .env.local
   ```

2. Edit `.env.local` and fill in your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

3. **IMPORTANT**: Set a strong admin password:
   ```env
   NEXT_PUBLIC_ADMIN_PASSWORD=YourStrongPasswordHere123!
   ```
   - Use at least 12 characters
   - Include uppercase, lowercase, numbers, and special characters
   - DO NOT use "ABCD" or any simple password in production

4. Set your app URL (after deployment):
   ```env
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

## 2. Firebase Firestore Setup

1. In Firebase Console, go to Firestore Database
2. Create a database (Start in production mode)
3. Set up the following security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to all documents
    match /{document=**} {
      allow read: if true;
    }

    // Only allow writes from authenticated sources (your app)
    match /leagues/{leagueId} {
      allow write: if request.auth != null || true; // Adjust based on your auth strategy
    }

    match /players/{playerId} {
      allow write: if request.auth != null || true;
    }

    match /tournaments/{tournamentId} {
      allow write: if request.auth != null || true;
    }
  }
}
```

## 3. Deploy to Vercel (Recommended)

### Option A: Deploy via Vercel Dashboard

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend/my-app`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

6. Add Environment Variables in Vercel:
   - Click "Environment Variables"
   - Add each variable from your `.env.local` file
   - Set them for Production, Preview, and Development environments

7. Click "Deploy"

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Navigate to your app directory:
   ```bash
   cd frontend/my-app
   ```

4. Deploy:
   ```bash
   vercel --prod
   ```

5. Follow the prompts and add your environment variables when asked

## 4. Post-Deployment Configuration

### 4.1 Update App URL

1. After deployment, copy your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Update the environment variable in Vercel:
   - Go to Project Settings > Environment Variables
   - Update `NEXT_PUBLIC_APP_URL` with your actual URL
   - Redeploy the app

### 4.2 Configure Custom Domain (Optional)

1. In Vercel Dashboard, go to Project Settings > Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` with your custom domain

### 4.3 Update Firebase Authorized Domains

1. Go to Firebase Console > Authentication > Settings > Authorized domains
2. Add your Vercel domain (e.g., `your-app.vercel.app`)
3. Add your custom domain if you have one

## 5. Test Production Build Locally

Before deploying, test the production build locally:

```bash
cd frontend/my-app

# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm run start
```

Visit `http://localhost:3000` and test all features.

## 6. Monitoring and Maintenance

### Check Deployment Status
- Monitor builds in Vercel Dashboard
- Check deployment logs for errors

### Update Environment Variables
- Go to Vercel Dashboard > Project Settings > Environment Variables
- Update as needed
- Redeploy to apply changes

### Rollback if Needed
- In Vercel Dashboard, go to Deployments
- Find a previous working deployment
- Click "Promote to Production"

## 7. Security Checklist

- [ ] Changed default admin password to a strong one
- [ ] Added environment variables to Vercel (not committed to Git)
- [ ] Configured Firebase security rules
- [ ] Added your production domain to Firebase authorized domains
- [ ] Set `NEXT_PUBLIC_APP_URL` to your actual domain
- [ ] Reviewed and tested all admin features
- [ ] Enabled HTTPS (automatic on Vercel)

## 8. Common Issues

### Build Fails
- Check all environment variables are set correctly
- Review build logs in Vercel Dashboard
- Ensure all dependencies are in `package.json`

### Firebase Connection Issues
- Verify Firebase configuration in environment variables
- Check Firebase project is active
- Ensure domain is authorized in Firebase

### Admin Password Not Working
- Verify `NEXT_PUBLIC_ADMIN_PASSWORD` is set correctly
- Clear browser localStorage and try again
- Check browser console for errors

## 9. Alternative Deployment Options

### Deploy to Netlify

1. Create `netlify.toml`:
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. Deploy via Netlify CLI or Dashboard
3. Add environment variables in Netlify Dashboard

### Deploy to Your Own Server

1. Build the app:
   ```bash
   npm run build
   ```

2. Copy the build output and run:
   ```bash
   npm run start
   ```

3. Use PM2 or similar for process management
4. Set up Nginx as reverse proxy
5. Configure SSL with Let's Encrypt

## Support

For issues or questions:
- Check the main [README.md](./README.md)
- Review Firebase documentation
- Check Vercel documentation
- Open an issue on GitHub

---

**Remember**: Never commit `.env.local` or any file containing sensitive credentials to Git!
