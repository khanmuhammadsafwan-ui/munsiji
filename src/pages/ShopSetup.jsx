import { useState } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase.js'

export default function ShopSetup({ onDone }) {
  const [name, setName] = useState('')
  const [owner, setOwner] = useState('')
  const [area, setArea] = useState('')
  const [drugLicense, setDrugLicense] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    setError('')
    if (!name.trim()) { setError('ফার্মেসীর নাম লেখো'); return }
    if (!owner.trim()) { setError('মালিকের নাম লেখো'); return }
    setBusy(true)
    try {
      const shop = {
        name: name.trim(),
        owner: owner.trim(),
        area: area.trim(),
        drugLicense: drugLicense.trim(),
        type: 'pharmacy',
        email: auth.currentUser.email || '',
        createdAt: serverTimestamp(),
      }
      await setDoc(doc(db, 'shops', auth.currentUser.uid), shop)
      onDone(shop)
    } catch (e) {
      console.error(e)
      setError('সংরক্ষণ করা যায়নি। আবার চেষ্টা করো।')
      setBusy(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-hero">
        <div className="brand">
          <div className="brand-mark">মু</div>
          <div>
            <div className="brand-name">মুন্সীজি</div>
            <div className="brand-tag">ফার্মেসী সেটআপ</div>
          </div>
        </div>
        <h1>তোমার ফার্মেসীর তথ্য দাও</h1>
        <p>এই তথ্য পরে যেকোনো সময় বদলানো যাবে</p>
      </div>

      <div className="card">
        {error && <div className="error-box">{error}</div>}

        <div className="field">
          <label htmlFor="shop-name">ফার্মেসীর নাম *</label>
          <input
            id="shop-name"
            placeholder="যেমন: মা মেডিকেল হল"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="field">
          <label htmlFor="owner">মালিকের নাম *</label>
          <input
            id="owner"
            placeholder="তোমার নাম"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="area">এলাকা / বাজার</label>
          <input
            id="area"
            placeholder="যেমন: কলেজ গেট, টঙ্গী"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="license">ড্রাগ লাইসেন্স নম্বর</label>
          <input
            id="license"
            placeholder="থাকলে লেখো (ঐচ্ছিক)"
            value={drugLicense}
            onChange={(e) => setDrugLicense(e.target.value)}
          />
          <div className="hint">রসিদ ও রিপোর্টে দেখানোর জন্য কাজে লাগবে</div>
        </div>

        <button className="btn btn-primary" style={{ width: '100%' }} onClick={save} disabled={busy}>
          {busy ? 'সংরক্ষণ হচ্ছে…' : 'দোকান চালু করো'}
        </button>
      </div>
    </div>
  )
}
