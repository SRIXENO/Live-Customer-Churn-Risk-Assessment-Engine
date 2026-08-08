# Deployment Guide

Step 1 - Push to GitHub:
cd S7_Project
git init
git add .
git commit -m "feat: complete churn risk dashboard"
git remote add origin https://github.com/SRIXENO/Live-Customer-Churn-Risk-Assessment-Engine.git
git push -u origin main

Step 2 - Deploy Backend on Render:
1. render.com -> New -> Web Service
2. Connect GitHub -> select the repo
3. Root Directory: backend
4. Build Command: pnpm install --frozen-lockfile
5. Start Command: pnpm start
6. Go to Environment tab -> Add these variables:
   PORT = 10000
   NODE_ENV = production
   MONGODB_URI = (your MongoDB Atlas connection string)
   JWT_SECRET = (your secret key)
   JWT_EXPIRES_IN = 7d
   CLIENT_URL = (your Vercel URL)
   RENDER_SELF_URL = (your Render URL)
   SCORING_INTERVAL_MINUTES = 30
   CLOUDINARY_CLOUD_NAME = (your cloud name)
   CLOUDINARY_API_KEY = (your api key)
   CLOUDINARY_API_SECRET = (your api secret)
7. Click Deploy
8. After deploy succeeds -> go to Shell tab -> run: pnpm run seed

Step 3 - Deploy Frontend on Vercel:
1. vercel.com -> New Project
2. Connect GitHub -> select the repo
3. Root Directory: frontend
4. Framework Preset: Vite
5. Go to Environment Variables -> Add these:
   VITE_API_URL = https://(your-render-url)/api
   VITE_SOCKET_URL = https://(your-render-url)
   VITE_EMAILJS_SERVICE_ID = (your service id)
   VITE_EMAILJS_TEMPLATE_ID_DISCOUNT = (template id 1)
   VITE_EMAILJS_TEMPLATE_ID_CART = (template id 2)
   VITE_EMAILJS_TEMPLATE_ID_LOYALTY = (template id 3)
   VITE_EMAILJS_PUBLIC_KEY = (your public key)
   VITE_CLOUDINARY_CLOUD_NAME = (your cloud name)
   VITE_CLOUDINARY_UPLOAD_PRESET = xeno_dashboard
6. Click Deploy
7. After deploy -> go to Deployments -> click Redeploy

Step 4 - Verify:
Open your Vercel URL
Login: admin@xenoproducts.com / Admin@123
Confirm green Live dot appears (Socket.io connected)
Wait up to 60 seconds on first load (Render cold start)
