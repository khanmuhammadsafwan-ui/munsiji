# মুন্সীজি (Munsiji) — আপনার ডিজিটাল দোকানদার

## 🚀 Setup Guide

### Step 1: Firebase Project তৈরি করুন
1. https://console.firebase.google.com এ যান
2. "Add Project" → নাম দিন: **munsiji-app**
3. Google Analytics enable করুন (optional)

### Step 2: Firebase Authentication Setup
1. Firebase Console → **Authentication** → **Sign-in method**
2. **Phone** enable করুন
3. Test phone number যোগ করুন (development এর জন্য):
   - Phone: `+8801700000000` → OTP: `123456`

### Step 3: Firestore Database Setup
1. Firebase Console → **Firestore Database** → **Create database**
2. **Start in test mode** সিলেক্ট করুন
3. Location: `asia-southeast1` (Singapore, BD এর কাছে)

### Step 4: Firebase Web App Register
1. Firebase Console → Project Settings → **Add app** → Web (</> icon)
2. App nickname: **munsiji-web**
3. Firebase config কপি করুন
4. `src/firebase.js` ফাইলে paste করুন:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "munsiji-app.firebaseapp.com",
  projectId: "munsiji-app",
  storageBucket: "munsiji-app.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Step 5: Local Development
```bash
npm install
npx vite
```
Browser এ http://localhost:5173 ওপেন করুন।

### Step 6: Vercel এ Deploy
```bash
npm install -g vercel
vercel
```

### Step 7: Firebase Auth Domain Whitelist
1. Firebase Console → Authentication → Settings
2. **Authorized domains** এ আপনার Vercel URL যোগ করুন:
   - `munsiji.vercel.app`
   - `localhost`

---

## 📱 Features (MVP)

| Feature | Description |
|---------|-------------|
| 📱 Phone OTP Login | বাংলাদেশী নম্বর দিয়ে লগইন |
| 🏪 Shop Setup | দোকানের তথ্য সেটআপ |
| 📦 Inventory Management | পণ্য যোগ/সম্পাদনা/মুছুন, স্টক ট্র্যাকিং |
| 🛒 Quick Sell | ট্যাপ করে দ্রুত বিক্রি |
| 🎤 Voice Input | বাংলায় বলে বিক্রির তালিকা তৈরি |
| 📝 বাকির খাতা | কার কত বাকি, টাকা আদায় |
| 📊 Dashboard | আজকের বিক্রি, মোট বাকি, স্টক মূল্য |
| ⚠️ Low Stock Alert | কম স্টকের সতর্কতা |
| 🌐 Works Offline | কোর ফিচার অফলাইনে কাজ করে |
| 🇧🇩 100% Bengali UI | সম্পূর্ণ বাংলা ইন্টারফেস |

---

## 🏗️ Tech Stack
- **Frontend**: React + Vite
- **Backend**: Firebase (Auth + Firestore)
- **Voice**: Web Speech API (Bengali)
- **Hosting**: Vercel
- **PWA**: Installable on mobile

---

## 📁 File Structure
```
munsiji-app/
├── index.html          # Entry HTML
├── vite.config.js      # Vite config
├── package.json
├── public/
│   └── manifest.json   # PWA manifest
└── src/
    ├── main.jsx        # React entry
    ├── App.jsx         # Main app (all screens)
    ├── firebase.js     # Firebase config
    └── db.js           # Database operations
```

---

## 🔒 Firestore Security Rules (Production)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /shops/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    match /products/{docId} {
      allow read, write: if request.auth.uid == resource.data.uid || request.auth != null;
    }
    match /sales/{docId} {
      allow read, write: if request.auth.uid == resource.data.uid || request.auth != null;
    }
    match /baki/{docId} {
      allow read, write: if request.auth.uid == resource.data.uid || request.auth != null;
    }
    match /customers/{docId} {
      allow read, write: if request.auth.uid == resource.data.uid || request.auth != null;
    }
  }
}
```
