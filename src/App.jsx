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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        const snap = await getDoc(doc(db, 'shops', u.uid))
        setShop(snap.exists() ? snap.data() : null)
      } else {
        setShop(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

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
