import { useEffect, useMemo, useRef, useState } from 'react'
import {
  collection, onSnapshot, doc, runTransaction, serverTimestamp, query, where,
} from 'firebase/firestore'
import { auth, db } from '../firebase.js'
import {
  toPieces, formatQty, toBn, toBnMoney, expiryStatus,
} from '../lib/units.js'
import { parseSaleUtterance } from '../lib/voice.js'

const stockCol = () => collection(db, 'shops', auth.currentUser.uid, 'stock')
const salesCol = () => collection(db, 'shops', auth.currentUser.uid, 'sales')

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// মেয়াদ-ঠিক-আছে এমন ব্যাচগুলোতে মোট কত পিস আছে
const sellablePieces = (item) =>
  (item.batches || [])
    .filter((b) => expiryStatus(b.expiry) !== 'expired')
    .reduce((s, b) => s + Number(b.qty || 0), 0)

export default function Sell() {
  const [stock, setStock] = useState(null)
  const [q, setQ] = useState('')
  const [cart, setCart] = useState([])
  const [picking, setPicking] = useState(null)   // { item, qty? } — পরিমাণ মডাল
  const [discount, setDiscount] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [doneTotal, setDoneTotal] = useState(null)
  const [listening, setListening] = useState(false)
  const [voiceNote, setVoiceNote] = useState('')
  const recRef = useRef(null)

  useEffect(() => {
    const unsub = onSnapshot(stockCol(), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => a.brand.localeCompare(b.brand))
      setStock(list)
    })
    return unsub
  }, [])

  const results = useMemo(() => {
    if (!stock) return []
    const s = q.trim().toLowerCase()
    if (!s) return []
    return stock
      .filter(
        (it) =>
          it.brand.toLowerCase().includes(s) ||
          (it.generic || '').toLowerCase().includes(s),
      )
      .slice(0, 8)
  }, [stock, q])

  // ---------- ভয়েস ----------
  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setVoiceNote('এই ব্রাউজারে ভয়েস কাজ করে না — Chrome ব্যবহার করো')
      return
    }
    setVoiceNote('')
    const rec = new SR()
    recRef.current = rec
    rec.lang = 'bn-BD'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onstart = () => setListening(true)
    rec.onend = () => setListening(false)
    rec.onerror = () => { setListening(false); setVoiceNote('শোনা যায়নি — আবার চেষ্টা করো') }
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript
      const parsed = parseSaleUtterance(text, stock || [])
      if (parsed.item) {
        setPicking({ item: parsed.item, qty: parsed.qty, heard: text })
      } else {
        setQ(text)
        setVoiceNote(`শুনেছি: "${text}" — স্টকে মেলেনি, নিচের তালিকা থেকে বেছে নাও`)
      }
    }
    rec.start()
  }

  // ---------- কার্ট ----------
  const addToCart = (line) => {
    setCart((c) => [...c, line])
    setPicking(null)
    setQ('')
    setVoiceNote('')
  }

  const subtotal = cart.reduce((s, l) => s + l.price, 0)
  const total = Math.max(0, subtotal - Number(discount || 0))

  // ---------- বিক্রি সম্পন্ন: ট্রানজ্যাকশনে FEFO কাটা ----------
  const completeSale = async () => {
    setError('')
    if (cart.length === 0) return
    setBusy(true)
    try {
      await runTransaction(db, async (tx) => {
        // এক আইটেম একাধিকবার কার্টে থাকলে একসাথে হিসাব
        const need = new Map()
        for (const l of cart) {
          need.set(l.stockId, (need.get(l.stockId) || 0) + l.qtyPieces)
        }
        const updates = []
        for (const [stockId, qtyNeeded] of need) {
          const ref = doc(stockCol(), stockId)
          const snap = await tx.get(ref)
          if (!snap.exists()) throw new Error('স্টকে ওষুধটা আর নেই — পেজ রিফ্রেশ করে দেখো')
          const data = snap.data()
          const batches = (data.batches || []).map((b) => ({ ...b, qty: Number(b.qty || 0) }))
          const sellable = batches
            .filter((b) => expiryStatus(b.expiry) !== 'expired')
            .reduce((s, b) => s + b.qty, 0)
          if (sellable < qtyNeeded) {
            throw new Error(`"${data.brand} ${data.strength}" — মেয়াদ-ঠিক স্টক আছে মাত্র ${formatQty(sellable, data.piecesPerStrip, data.stripsPerBox)}`)
          }
          // FEFO: আগে যেটার মেয়াদ আগে শেষ হবে, সেটা আগে বিক্রি
          const sorted = [...batches].sort((a, b) => (a.expiry || '9999').localeCompare(b.expiry || '9999'))
          let rest = qtyNeeded
          for (const b of sorted) {
            if (rest <= 0) break
            if (expiryStatus(b.expiry) === 'expired') continue
            const take = Math.min(b.qty, rest)
            b.qty -= take
            rest -= take
          }
          const newBatches = sorted.filter((b) => b.qty > 0)
          updates.push({ ref, newBatches })
        }
        for (const u of updates) {
          tx.update(u.ref, { batches: u.newBatches, updatedAt: serverTimestamp() })
        }
        tx.set(doc(salesCol()), {
          items: cart.map((l) => ({
            stockId: l.stockId, brand: l.brand, strength: l.strength,
            qtyPieces: l.qtyPieces, qtyLabel: l.qtyLabel, price: l.price,
          })),
          subtotal,
          discount: Number(discount || 0),
          total,
          day: todayStr(),
          at: serverTimestamp(),
        })
      })
      setDoneTotal(total)
      setCart([])
      setDiscount('')
    } catch (e) {
      console.error(e)
      setError(e.message || 'বিক্রি সংরক্ষণ করা যায়নি — আবার চেষ্টা করো')
    } finally {
      setBusy(false)
    }
  }

  if (stock === null) {
    return (
      <div className="loading-screen" style={{ minHeight: '40vh' }}>
        <div className="spinner" />
        <div>স্টক আসছে…</div>
      </div>
    )
  }

  if (doneTotal !== null) {
    return (
      <div className="placeholder">
        <div className="big">✅</div>
        <h2 style={{ color: 'var(--teal-900)', marginBottom: 6 }}>বিক্রি সম্পন্ন!</h2>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--teal-700)', fontFamily: 'var(--font-display)' }}>
          {toBnMoney(doneTotal)}
        </div>
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setDoneTotal(null)}>
          নতুন বিক্রি শুরু করো
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* সার্চ + ভয়েস */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
        <input
          style={{
            flex: 1, minHeight: 'var(--tap)', padding: '10px 14px',
            border: '2px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--card)',
          }}
          placeholder="🔍 কী বিক্রি করবে?"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          className="btn"
          style={{
            minWidth: 'var(--tap)',
            background: listening ? 'var(--danger)' : 'var(--teal-700)',
            color: '#fff', fontSize: 22,
          }}
          onClick={startVoice}
          aria-label="ভয়েস দিয়ে বিক্রি"
        >
          {listening ? '⏺' : '🎤'}
        </button>
      </div>
      {listening && <div style={{ color: 'var(--teal-700)', fontWeight: 600, marginBottom: 8 }}>🎙️ শুনছি… বলো "নাপা দুই পাতা"</div>}
      {voiceNote && <div style={{ color: 'var(--ink-soft)', fontSize: 14.5, marginBottom: 8 }}>{voiceNote}</div>}

      {/* সার্চ রেজাল্ট */}
      {results.map((it) => {
        const avail = sellablePieces(it)
        return (
          <button
            key={it.id}
            onClick={() => avail > 0 && setPicking({ item: it })}
            style={{
              width: '100%', textAlign: 'left', background: 'var(--card)',
              border: '2px solid var(--line)', borderRadius: 'var(--radius)',
              padding: '10px 14px', marginBottom: 8, minHeight: 'var(--tap)',
              opacity: avail > 0 ? 1 : 0.5,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, color: 'var(--teal-900)' }}>
                {it.brand} <span style={{ fontWeight: 500, fontSize: 14 }}>{it.strength}</span>
              </div>
              <div style={{ color: 'var(--teal-700)', fontWeight: 600 }}>{toBnMoney(it.sellPerPiece)}/পিস</div>
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>
              {avail > 0 ? `আছে: ${formatQty(avail, it.piecesPerStrip, it.stripsPerBox)}` : 'মেয়াদ-ঠিক স্টক নেই'}
            </div>
          </button>
        )
      })}

      {/* কার্ট */}
      {cart.length > 0 && (
        <div className="card" style={{ marginTop: 14 }}>
          <h3 style={{ fontSize: 17, color: 'var(--teal-900)', marginBottom: 10 }}>🧾 এই বিক্রিতে</h3>
          {cart.map((l, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{l.brand} {l.strength}</div>
                <div style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>{l.qtyLabel}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontWeight: 700 }}>{toBnMoney(l.price)}</div>
                <button
                  style={{ background: 'none', color: 'var(--danger)', fontSize: 18 }}
                  onClick={() => setCart((c) => c.filter((_, j) => j !== i))}
                  aria-label="বাদ দাও"
                >✕</button>
              </div>
            </div>
          ))}
          <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span>কমিশন / ছাড় (৳)</span>
            <input
              type="number" inputMode="decimal" value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              style={{ width: 90, minHeight: 42, padding: '6px 10px', border: '2px solid var(--line)', borderRadius: 10, textAlign: 'right' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 700, color: 'var(--teal-900)' }}>
            <span>মোট</span><span>{toBnMoney(total)}</span>
          </div>
          {error && <div className="error-box" style={{ marginTop: 10 }}>{error}</div>}
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={completeSale} disabled={busy}>
            {busy ? 'সংরক্ষণ হচ্ছে…' : '✅ বিক্রি সম্পন্ন করো'}
          </button>
        </div>
      )}

      {cart.length === 0 && !q && <TodaysSales />}

      {picking && (
        <QtyModal
          item={picking.item}
          initQty={picking.qty}
          heard={picking.heard}
          onAdd={addToCart}
          onClose={() => setPicking(null)}
        />
      )}
    </div>
  )
}

// ---------- পরিমাণ বাছাই মডাল ----------
function QtyModal({ item, initQty, heard, onAdd, onClose }) {
  const [box, setBox] = useState(initQty?.box || '')
  const [strip, setStrip] = useState(initQty?.strip || '')
  const [piece, setPiece] = useState(initQty?.piece || '')
  const [price, setPrice] = useState('')
  const [touchedPrice, setTouchedPrice] = useState(false)

  const qtyPieces = toPieces({ box, strip, piece }, item.piecesPerStrip, item.stripsPerBox)
  const autoPrice =
    Number(box || 0) * Number(item.stripsPerBox || 1) * Number(item.sellPerStrip || 0) +
    Number(strip || 0) * Number(item.sellPerStrip || 0) +
    Number(piece || 0) * Number(item.sellPerPiece || 0)
  const finalPrice = touchedPrice ? Number(price || 0) : autoPrice
  const avail = sellablePieces(item)

  const qtyLabel = formatQty(qtyPieces, item.piecesPerStrip, item.stripsPerBox)

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(30,43,41,.45)', zIndex: 50,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: '100%', maxWidth: 480, borderRadius: '20px 20px 0 0', padding: 22 }}
        onClick={(e) => e.stopPropagation()}
      >
        {heard && <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginBottom: 6 }}>🎙️ শুনেছি: "{heard}"</div>}
        <h3 style={{ fontSize: 19, color: 'var(--teal-900)' }}>
          {item.brand} <span style={{ fontWeight: 500, fontSize: 15 }}>{item.strength}</span>
        </h3>
        <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 14 }}>
          আছে: {formatQty(avail, item.piecesPerStrip, item.stripsPerBox)} · {toBnMoney(item.sellPerPiece)}/পিস
          {item.sellPerStrip > 0 && ` · ${toBnMoney(item.sellPerStrip)}/পাতা`}
        </div>

        <div className="field">
          <label>কতটুকু দেবে?</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <input type="number" inputMode="numeric" placeholder="বক্স" value={box} onChange={(e) => setBox(e.target.value)} />
            <input type="number" inputMode="numeric" placeholder="পাতা" value={strip} onChange={(e) => setStrip(e.target.value)} autoFocus />
            <input type="number" inputMode="numeric" placeholder="পিস" value={piece} onChange={(e) => setPiece(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>দাম (৳)</label>
          <input
            type="number" inputMode="decimal"
            value={touchedPrice ? price : (autoPrice || '')}
            onChange={(e) => { setTouchedPrice(true); setPrice(e.target.value) }}
          />
          <div className="hint">নিজে থেকে হিসাব হয়েছে — চাইলে বদলাতে পারো</div>
        </div>

        {qtyPieces > avail && (
          <div className="error-box">মেয়াদ-ঠিক স্টকে এতটা নেই — আছে {formatQty(avail, item.piecesPerStrip, item.stripsPerBox)}</div>
        )}

        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          disabled={qtyPieces <= 0 || qtyPieces > avail}
          onClick={() =>
            onAdd({
              stockId: item.id, brand: item.brand, strength: item.strength,
              qtyPieces, qtyLabel, price: finalPrice,
            })
          }
        >
          কার্টে যোগ করো {qtyPieces > 0 && `— ${qtyLabel}, ${toBnMoney(finalPrice)}`}
        </button>
      </div>
    </div>
  )
}

// ---------- আজকের বিক্রির তালিকা ----------
function TodaysSales() {
  const [sales, setSales] = useState([])

  useEffect(() => {
    const qy = query(salesCol(), where('day', '==', todayStr()))
    const unsub = onSnapshot(qy, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (b.at?.seconds || 0) - (a.at?.seconds || 0))
      setSales(list)
    })
    return unsub
  }, [])

  const total = sales.reduce((s, x) => s + Number(x.total || 0), 0)

  if (sales.length === 0) {
    return (
      <div className="placeholder">
        <div className="big">🧾</div>
        <div>ওপরে ওষুধ খুঁজে বা 🎤 চেপে বলেই<br />আজকের প্রথম বিক্রিটা করে ফেলো</div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <h3 style={{ fontSize: 17, color: 'var(--teal-900)' }}>আজকের বিক্রি ({toBn(sales.length)}টি)</h3>
        <div style={{ fontWeight: 700, color: 'var(--teal-700)' }}>{toBnMoney(total)}</div>
      </div>
      {sales.map((s) => (
        <div key={s.id} className="card" style={{ padding: 14, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
            <span>
              {s.at?.seconds
                ? new Date(s.at.seconds * 1000).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })
                : '—'}
            </span>
            <span style={{ color: 'var(--teal-700)' }}>{toBnMoney(s.total)}</span>
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 4 }}>
            {(s.items || []).map((it) => `${it.brand} ${it.qtyLabel}`).join(' · ')}
          </div>
        </div>
      ))}
    </div>
  )
}
