# 🚀 Deployment Checklist

Use this checklist to ensure your FIFA League Manager app is ready for production deployment.

## Pre-Deployment Checklist

### 1. Environment Variables ✅
- [ ] Created `.env.local` from `.env.example`
- [ ] Set all Firebase configuration values
- [ ] **Changed admin password** from default "ABCD" to a strong password (min 12 characters)
- [ ] Set `NEXT_PUBLIC_APP_URL` (can be updated after first deployment)

### 2. Firebase Configuration ✅
- [ ] Firebase project created and active
- [ ] Firestore database created
- [ ] Security rules configured in Firestore
- [ ] Firebase Authentication enabled (if using auth features)

### 3. Code Quality ✅
- [ ] Production build passes: `npm run build`
- [ ] No critical errors in browser console
- [ ] All features tested locally in production mode

### 4. Security ✅
- [ ] `.env.local` is in `.gitignore` (already configured)
- [ ] Strong admin password set
- [ ] Firebase security rules reviewed
- [ ] Sensitive data not committed to Git

## Deployment Steps

### Option 1: Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository
   - Set root directory: `frontend/my-app`
   - Add all environment variables from `.env.local`
   - Click "Deploy"

3. **Post-Deployment**
   - [ ] Copy your Vercel URL
   - [ ] Update `NEXT_PUBLIC_APP_URL` in Vercel environment variables
   - [ ] Add your Vercel domain to Firebase authorized domains
   - [ ] Test the live site thoroughly
   - [ ] Configure custom domain (optional)

## Post-Deployment Checklist

### Verification ✅
- [ ] Site loads correctly at production URL
- [ ] All pages are accessible
- [ ] Admin login works with new password
- [ ] Can create leagues
- [ ] Can add players
- [ ] Can record matches
- [ ] Rankings update correctly
- [ ] Tournament features work
- [ ] Mobile responsive design works
- [ ] Tutorial overlay displays correctly

### Monitoring ✅
- [ ] Check Vercel deployment logs for errors
- [ ] Monitor Firebase usage in console
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices

### Security Verification ✅
- [ ] Admin password is strong and not the default
- [ ] HTTPS is enabled (automatic on Vercel)
- [ ] Environment variables are not exposed in client
- [ ] Firebase security rules are working correctly

## Common Issues & Solutions

### Build Fails
**Solution**: Check environment variables are set in Vercel dashboard

### Firebase Connection Error
**Solution**: Verify Firebase config values and domain authorization

### Admin Login Not Working
**Solution**: Clear browser cache, verify `NEXT_PUBLIC_ADMIN_PASSWORD` is set

### 404 Errors on Routes
**Solution**: Ensure Next.js dynamic routes are properly configured

## Quick Commands

```bash
# Test build locally
cd frontend/my-app
npm run build
npm run start

# Deploy with Vercel CLI
vercel --prod

# View build logs
vercel logs

# Check deployment status
vercel ls
```

## Support

- Full guide: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- Vercel docs: https://vercel.com/docs
- Firebase docs: https://firebase.google.com/docs
- Next.js docs: https://nextjs.org/docs

---

**🎉 Once all checkboxes are complete, your app is ready for production!**
