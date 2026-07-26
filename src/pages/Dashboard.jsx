import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { auth, db } from '../firebase.js'
import { worstExpiry, toBn, toBnMoney } from '../lib/units.js'

export default function Dashboard({ shop }) {
  const [stock, setStock] = useState([])
  const [todayTotal, setTodayTotal] = useState(0)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'shops', auth.currentUser.uid, 'stock'),
      (snap) => setStock(snap.docs.map((d) => d.data())),
    )
    return unsub
  }, [])

  useEffect(() => {
    const d = new Date()
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const qy = query(collection(db, 'shops', auth.currentUser.uid, 'sales'), where('day', '==', day))
    const unsub = onSnapshot(qy, (snap) =>
      setTodayTotal(snap.docs.reduce((s, x) => s + Number(x.data().total || 0), 0)),
    )
    return unsub
  }, [])

  const expiryCount = stock.filter((it) => worstExpiry(it.batches) !== 'ok').length
  const lowCount = stock.filter((it) => {
    const total = (it.batches || []).reduce((s, b) => s + Number(b.qty || 0), 0)
    return total <= Number(it.lowStock || 0)
  }).length

  const cards = [
    { icon: '💰', label: 'আজকের বিক্রি', value: toBnMoney(todayTotal), tone: 'teal' },
    { icon: '💊', label: 'মোট ওষুধ', value: `${toBn(stock.length)} টি`, tone: 'teal' },
    { icon: '⏳', label: 'মেয়াদ-সতর্কতা', value: `${toBn(expiryCount)} টি`, tone: expiryCount > 0 ? 'amber' : 'teal' },
    { icon: '📉', label: 'স্টক কম', value: `${toBn(lowCount)} টি`, tone: lowCount > 0 ? 'danger' : 'teal' },
  ]

  const toneStyle = {
    teal:   { background: 'var(--teal-050)', color: 'var(--teal-900)' },
    amber:  { background: 'var(--amber-bg)', color: '#8a5a12' },
    danger: { background: 'var(--danger-bg)', color: 'var(--danger)' },
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, color: 'var(--teal-900)', marginBottom: 14 }}>
        আসসালামু আলাইকুম, {shop.owner.split(' ')[0]} 👋
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {cards.map((c) => (
          <div key={c.label} className="card" style={{ ...toneStyle[c.tone], padding: 16 }}>
            <div style={{ fontSize: 26 }}>{c.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', marginTop: 4 }}>
              {c.value}
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 600, opacity: .8 }}>{c.label}</div>
            {c.note && <div style={{ fontSize: 12, opacity: .6 }}>{c.note}</div>}
          </div>
        ))}
      </div>

      {stock.length === 0 && (
        <div className="placeholder">
          <div className="big">💊</div>
          <div>স্টক ট্যাব থেকে প্রথম ওষুধটা যোগ করো —<br />হিসাব এখানে নিজে নিজেই চলে আসবে</div>
        </div>
      )}
    </div>
  )
}
