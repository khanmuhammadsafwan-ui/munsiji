import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase.js'

import Login from './pages/Login.jsx'
import ShopSetup from './pages/ShopSetup.jsx'
import AppShell from './components/AppShell.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Stock from './pages/Stock.jsx'
import Sell from './pages/Sell.jsx'
import Placeholder from './pages/Placeholder.jsx'

export default function App() {
  const [user, setUser] = useState(null)
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fatal, setFatal] = useState('')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      try {
        if (u) {
          const snap = await getDoc(doc(db, 'shops', u.uid))
          // পুরনো (মুদি-ভার্সনের) রেকর্ড হলে ফার্মেসী সেটআপে পাঠাও —
          // সেটআপ সেভ করলে নতুন ফরম্যাটে বদলে যাবে
          const data = snap.exists() ? snap.data() : null
          setShop(data && data.type === 'pharmacy' && data.owner ? data : null)
        } else {
          setShop(null)
        }
        setFatal('')
      } catch (e) {
        console.error(e)
        if (e.code === 'permission-denied') {
          setFatal('ডেটাবেসে ঢোকার অনুমতি নেই। Firebase Console → Firestore Database → Rules-এ গিয়ে প্রজেক্টের firestore.rules ফাইলের কোডটা বসিয়ে Publish করো।')
        } else if (e.code === 'unavailable' || e.code === 'failed-precondition' || e.code === 'not-found') {
          setFatal('ডেটাবেস পাওয়া যাচ্ছে না। Firebase Console → Firestore Database → Create database (location: asia-south1) করা হয়েছে কিনা দেখো, আর ইন্টারনেট সংযোগ চেক করো।')
        } else {
          setFatal('ডেটাবেস সংযোগে সমস্যা: ' + (e.code || e.message))
        }
      }
      setLoading(false)
    })
    return unsub
  }, [])

  if (fatal) {
    return (
      <div className="loading-screen" style={{ padding: 24 }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <div className="error-box" style={{ maxWidth: 440, textAlign: 'center' }}>{fatal}</div>
        <button className="btn btn-primary" onClick={() => location.reload()}>আবার চেষ্টা করো</button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <div>মুন্সীজি খুলছে…</div>
      </div>
    )
  }

  // লগইন করা নেই
  if (!user) {
    return (
      <div className="screen">
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </div>
    )
  }

  // লগইন আছে কিন্তু দোকান সেটআপ হয়নি
  if (!shop) {
    return (
      <div className="screen">
        <Routes>
          <Route path="*" element={<ShopSetup onDone={setShop} />} />
        </Routes>
      </div>
    )
  }

  // মূল অ্যাপ
  return (
    <div className="screen">
      <AppShell shop={shop}>
        <Routes>
          <Route path="/" element={<Dashboard shop={shop} />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/baki" element={<Placeholder icon="📒" title="বাকির খাতা" note="কাস্টমার ও কোম্পানির বাকি — পরের ধাপে আসছে" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </div>
  )
}
