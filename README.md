# মুন্সীজি v2 — ফার্মেসী এডিশন (ধাপ ১ + ২ + ৩)

এই প্যাকেজে আছে: Google Sign-in লগইন (ফ্রি Spark প্ল্যানেই চলে — Phone OTP-তে Blaze প্ল্যান লাগতো বলে বাদ), ফার্মেসী সেটআপ ফ্লো, টিল-মেডিক্যাল ডিজাইন সিস্টেম, অ্যাপ শেল, পুরো স্টক মডিউল (প্রি-লোডেড বাংলাদেশি ওষুধের সিড ডেটাবেস, বক্স→পাতা→পিস ইউনিট, ব্যাচ-ভিত্তিক মেয়াদ ট্র্যাকিং, লো-স্টক অ্যালার্ট), আর পুরো বিক্রি মডিউল — সার্চ করে বিক্রি, বাংলা ভয়েস সেল ("নাপা দুই পাতা" বললে অ্যাপ নিজে ওষুধ ও পরিমাণ বুঝে নেয়), কার্ট, ছাড়, FEFO নিয়মে স্টক থেকে অটো কাটা (যে ব্যাচের মেয়াদ আগে শেষ হবে সেটা আগে বিক্রি, মেয়াদোত্তীর্ণ ব্যাচ কখনো বিক্রি হয় না), আজকের বিক্রির তালিকা, আর লাইভ ড্যাশবোর্ড। বাকির খাতা পরের ধাপে।

ভয়েস সেল Web Speech API দিয়ে বানানো — ফ্রি, কোনো API key লাগে না, তবে Chrome ব্রাউজারে (মোবাইল বা ডেস্কটপ) সবচেয়ে ভালো কাজ করে আর ইন্টারনেট লাগে। প্রথমবার মাইক্রোফোনের অনুমতি চাইবে।

সিড ডেটাবেসটা আমার সাধারণ জ্ঞান থেকে বানানো একটা শুরুর তালিকা — বেশিরভাগ এন্ট্রি ঠিক থাকার কথা, তবে দু-একটা কোম্পানি বা স্ট্রেংথ এদিক-ওদিক হতে পারে; ভুল চোখে পড়লে src/data/medicines.js ফাইলে সরাসরি ঠিক করা যায়, আর দোকানদার অ্যাপ থেকেই কাস্টম ওষুধ যোগ করতে পারে।

Firestore চালু করার পর Firebase Console → Firestore Database → Rules-এ গিয়ে এই প্রজেক্টের firestore.rules ফাইলের কোডটা বসিয়ে Publish করো — এতে প্রতিটা দোকানের ডেটা শুধু তার মালিকই দেখতে পারবে।

## চালু করার নিয়ম

প্রথমে `src/firebase.js` ফাইলটা খুলে Firebase Console (munsiji-app প্রজেক্ট) → Project Settings → General → Your apps → Web app থেকে firebaseConfig-এর মানগুলো বসাও। এরপর Firebase Console → Authentication → Sign-in method-এ গিয়ে Google প্রোভাইডার Enable করা আছে কিনা নিশ্চিত করো (না থাকলে Add new provider → Google → Enable → support email বেছে Save), আর Firestore Database তৈরি না করা থাকলে Build → Firestore Database → Create database (production mode, location: asia-south1) করে নাও।

লোকালে চালাতে টার্মিনালে `npm install` তারপর `npm run dev` লেখো — ব্রাউজারে http://localhost:5173 খুলবে।

Vercel-এ ডিপ্লয় করতে প্রজেক্টটা GitHub-এ পুশ করে Vercel-এ ইমপোর্ট করো (Framework: Vite, বাকি সব ডিফল্ট)। ডিপ্লয়ের পর Vercel-এর ডোমেইনটা (যেমন munsiji.vercel.app) Firebase Console → Authentication → Settings → Authorized domains-এ যোগ করতে ভুলো না — নাহলে Google লগইন কাজ করবে না।

## ফাইল কাঠামো

src/firebase.js-এ Firebase কানেকশন, src/App.jsx-এ লগইন→সেটআপ→অ্যাপ রাউটিং লজিক, src/pages/-এ Login, ShopSetup, Dashboard আর Placeholder স্ক্রিন, src/components/AppShell.jsx-এ হেডার ও বটম নেভিগেশন, আর src/index.css-এ পুরো ডিজাইন সিস্টেম (রঙ, ফন্ট, কম্পোনেন্ট) আছে।
