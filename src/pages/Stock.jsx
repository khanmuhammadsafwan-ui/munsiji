import { useEffect, useMemo, useState } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '../firebase.js'
import { MEDICINES } from '../data/medicines.js'
import {
  toPieces, formatQty, worstExpiry, formatExpiry, toBn, toBnMoney,
} from '../lib/units.js'

const stockCol = () => collection(db, 'shops', auth.currentUser.uid, 'stock')

const EXPIRY_BADGE = {
  expired: { text: 'মেয়াদ শেষ', style: { background: 'var(--danger-bg)', color: 'var(--danger)' } },
  soon:    { text: 'মেয়াদ শেষের পথে', style: { background: 'var(--amber-bg)', color: '#8a5a12' } },
}

export default function Stock() {
  const [items, setItems] = useState(null)
  const [query, setQuery] = useState('')
  // view: 'list' | 'pick' | 'form'
  const [view, setView] = useState('list')
  const [picked, setPicked] = useState(null)      // মাস্টার ডেটাবেস থেকে বাছাই / null = কাস্টম
  const [target, setTarget] = useState(null)      // বিদ্যমান আইটেমে ব্যাচ যোগ

  useEffect(() => {
    const unsub = onSnapshot(stockCol(), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => a.brand.localeCompare(b.brand))
      setItems(list)
    })
    return unsub
  }, [])

  const filtered = useMemo(() => {
    if (!items) return []
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (it) =>
        it.brand.toLowerCase().includes(q) ||
        (it.generic || '').toLowerCase().includes(q) ||
        (it.company || '').toLowerCase().includes(q),
    )
  }, [items, query])

  if (items === null) {
    return (
      <div className="loading-screen" style={{ minHeight: '40vh' }}>
        <div className="spinner" />
        <div>স্টক আসছে…</div>
      </div>
    )
  }

  if (view === 'pick') {
    return (
      <PickMedicine
        onPick={(med) => { setPicked(med); setView('form') }}
        onCustom={() => { setPicked(null); setView('form') }}
        onBack={() => setView('list')}
      />
    )
  }

  if (view === 'form') {
    return (
      <StockForm
        med={picked}
        existing={target}
        onDone={() => { setView('list'); setTarget(null); setPicked(null) }}
      />
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <input
          style={{
            flex: 1, minHeight: 'var(--tap)', padding: '10px 14px',
            border: '2px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--card)',
          }}
          placeholder="🔍 ওষুধ খোঁজো (নাম / জেনেরিক)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn btn-primary" onClick={() => setView('pick')}>➕ যোগ</button>
      </div>

      {filtered.length === 0 && (
        <div className="placeholder">
          <div className="big">💊</div>
          <div>
            {items.length === 0
              ? 'এখনো কোনো ওষুধ যোগ করা হয়নি — “➕ যোগ” চেপে শুরু করো'
              : 'এই নামে কিছু পাওয়া যায়নি'}
          </div>
        </div>
      )}

      {filtered.map((it) => {
        const st = worstExpiry(it.batches)
        const badge = EXPIRY_BADGE[st]
        const totalQty = (it.batches || []).reduce((s, b) => s + Number(b.qty || 0), 0)
        const low = totalQty <= Number(it.lowStock || 0)
        return (
          <div key={it.id} className="card" style={{ marginBottom: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--teal-900)' }}>
                  {it.brand} <span style={{ fontWeight: 500, fontSize: 15 }}>{it.strength}</span>
                </div>
                <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
                  {it.generic} · {it.company} · {it.form}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 700, color: 'var(--teal-700)' }}>
                  {toBnMoney(it.sellPerPiece)} <span style={{ fontSize: 13, fontWeight: 500 }}>/পিস</span>
                </div>
                {it.sellPerStrip > 0 && (
                  <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                    {toBnMoney(it.sellPerStrip)} /পাতা
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span style={{
                background: low ? 'var(--danger-bg)' : 'var(--teal-050)',
                color: low ? 'var(--danger)' : 'var(--teal-900)',
                borderRadius: 8, padding: '4px 10px', fontSize: 14, fontWeight: 600,
              }}>
                {formatQty(totalQty, it.piecesPerStrip, it.stripsPerBox)}
                {low && ' · স্টক কম!'}
              </span>
              {badge && (
                <span style={{ ...badge.style, borderRadius: 8, padding: '4px 10px', fontSize: 14, fontWeight: 600 }}>
                  ⏳ {badge.text}
                </span>
              )}
            </div>

            {(it.batches || []).filter((b) => Number(b.qty) > 0).map((b, i) => (
              <div key={i} style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 6 }}>
                ব্যাচ {b.no || '—'} · মেয়াদ: {formatExpiry(b.expiry)} · {toBn(b.qty)} পিস
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                className="btn btn-ghost"
                style={{ flex: 1, minHeight: 44, fontSize: 15 }}
                onClick={() => { setTarget(it); setPicked(null); setView('form') }}
              >
                ➕ নতুন ব্যাচ
              </button>
              <button
                className="btn btn-ghost"
                style={{ minHeight: 44, fontSize: 15, borderColor: 'var(--danger-bg)', color: 'var(--danger)' }}
                onClick={async () => {
                  if (confirm(`"${it.brand} ${it.strength}" স্টক থেকে বাদ দেবে?`)) {
                    await deleteDoc(doc(stockCol(), it.id))
                  }
                }}
              >
                🗑️
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------- মাস্টার ডেটাবেস থেকে ওষুধ বাছাই ----------
function PickMedicine({ onPick, onCustom, onBack }) {
  const [q, setQ] = useState('')
  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return MEDICINES.slice(0, 30)
    return MEDICINES.filter(
      (m) =>
        m.b.toLowerCase().includes(s) ||
        m.g.toLowerCase().includes(s) ||
        m.c.toLowerCase().includes(s),
    ).slice(0, 40)
  }, [q])

  return (
    <div>
      <button className="btn btn-ghost" style={{ marginBottom: 12, minHeight: 42 }} onClick={onBack}>← ফিরে যাও</button>
      <h2 style={{ fontSize: 19, color: 'var(--teal-900)', marginBottom: 10 }}>কোন ওষুধ যোগ করবে?</h2>
      <input
        style={{
          width: '100%', minHeight: 'var(--tap)', padding: '10px 14px', marginBottom: 12,
          border: '2px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--card)',
        }}
        placeholder="🔍 নাম বা জেনেরিক লেখো — যেমন Napa"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />
      <button className="btn btn-ghost" style={{ width: '100%', marginBottom: 12 }} onClick={onCustom}>
        ✏️ তালিকায় নেই — নিজে লিখে যোগ করবো
      </button>
      {results.map((m) => (
        <button
          key={m.id}
          onClick={() => onPick(m)}
          style={{
            width: '100%', textAlign: 'left', background: 'var(--card)',
            border: '2px solid var(--line)', borderRadius: 'var(--radius)',
            padding: '12px 14px', marginBottom: 8, minHeight: 'var(--tap)',
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--teal-900)' }}>
            {m.b} <span style={{ fontWeight: 500, fontSize: 14 }}>{m.s}</span>
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>{m.g} · {m.c} · {m.f}</div>
        </button>
      ))}
    </div>
  )
}

// ---------- স্টক / ব্যাচ ফর্ম ----------
function StockForm({ med, existing, onDone }) {
  const isBatchOnly = Boolean(existing)
  const [brand, setBrand] = useState(existing?.brand ?? med?.b ?? '')
  const [generic, setGeneric] = useState(existing?.generic ?? med?.g ?? '')
  const [company, setCompany] = useState(existing?.company ?? med?.c ?? '')
  const [strength, setStrength] = useState(existing?.strength ?? med?.s ?? '')
  const [form, setForm] = useState(existing?.form ?? med?.f ?? 'ট্যাবলেট')
  const [pps, setPps] = useState(existing?.piecesPerStrip ?? 10)
  const [spb, setSpb] = useState(existing?.stripsPerBox ?? 5)
  const [sellPiece, setSellPiece] = useState(existing?.sellPerPiece ?? '')
  const [sellStrip, setSellStrip] = useState(existing?.sellPerStrip ?? '')
  const [lowStock, setLowStock] = useState(existing?.lowStock ?? 20)
  const [batchNo, setBatchNo] = useState('')
  const [expiry, setExpiry] = useState('')
  const [qBox, setQBox] = useState('')
  const [qStrip, setQStrip] = useState('')
  const [qPiece, setQPiece] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    setError('')
    if (!brand.trim()) { setError('ওষুধের নাম লেখো'); return }
    const qty = toPieces({ box: qBox, strip: qStrip, piece: qPiece }, pps, spb)
    if (qty <= 0) { setError('কতটুকু স্টক ঢুকছে তা লেখো (বক্স / পাতা / পিস)'); return }
    if (!expiry) { setError('মেয়াদের মাসটা দাও — ফার্মেসীতে এটা বাদ দেওয়া যাবে না'); return }
    if (!isBatchOnly && !(Number(sellPiece) > 0)) { setError('প্রতি পিসের বিক্রয়মূল্য দাও'); return }
    setBusy(true)
    try {
      const batch = { no: batchNo.trim(), expiry, qty }
      if (isBatchOnly) {
        await updateDoc(doc(stockCol(), existing.id), {
          batches: [...(existing.batches || []), batch],
          updatedAt: serverTimestamp(),
        })
      } else {
        await addDoc(stockCol(), {
          brand: brand.trim(),
          generic: generic.trim(),
          company: company.trim(),
          strength: strength.trim(),
          form,
          piecesPerStrip: Number(pps) || 1,
          stripsPerBox: Number(spb) || 1,
          sellPerPiece: Number(sellPiece) || 0,
          sellPerStrip: Number(sellStrip) || Number(sellPiece) * (Number(pps) || 1),
          lowStock: Number(lowStock) || 0,
          batches: [batch],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }
      onDone()
    } catch (e) {
      console.error(e)
      setError('সংরক্ষণ করা যায়নি। আবার চেষ্টা করো।')
      setBusy(false)
    }
  }

  return (
    <div>
      <button className="btn btn-ghost" style={{ marginBottom: 12, minHeight: 42 }} onClick={onDone}>← ফিরে যাও</button>
      <h2 style={{ fontSize: 19, color: 'var(--teal-900)', marginBottom: 12 }}>
        {isBatchOnly ? `${existing.brand} ${existing.strength} — নতুন ব্যাচ` : 'স্টকে ওষুধ যোগ করো'}
      </h2>

      <div className="card">
        {error && <div className="error-box">{error}</div>}

        {!isBatchOnly && (
          <>
            <div className="field">
              <label>ওষুধের নাম *</label>
              <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="যেমন: Napa" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label>জেনেরিক</label>
                <input value={generic} onChange={(e) => setGeneric(e.target.value)} placeholder="Paracetamol" />
              </div>
              <div className="field">
                <label>স্ট্রেংথ</label>
                <input value={strength} onChange={(e) => setStrength(e.target.value)} placeholder="500mg" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label>কোম্পানি</label>
                <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Beximco" />
              </div>
              <div className="field">
                <label>ফর্ম</label>
                <select value={form} onChange={(e) => setForm(e.target.value)}>
                  {['ট্যাবলেট', 'ক্যাপসুল', 'সিরাপ', 'সাসপেনশন', 'চিবানো ট্যাবলেট', 'ইনজেকশন', 'ইনহেলার', 'ড্রপ', 'ক্রিম', 'স্যাশে', 'অন্যান্য'].map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label>১ পাতায় কত পিস</label>
                <input type="number" inputMode="numeric" value={pps} onChange={(e) => setPps(e.target.value)} />
              </div>
              <div className="field">
                <label>১ বক্সে কত পাতা</label>
                <input type="number" inputMode="numeric" value={spb} onChange={(e) => setSpb(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label>বিক্রয়মূল্য / পিস (৳) *</label>
                <input type="number" inputMode="decimal" value={sellPiece} onChange={(e) => setSellPiece(e.target.value)} />
              </div>
              <div className="field">
                <label>বিক্রয়মূল্য / পাতা (৳)</label>
                <input type="number" inputMode="decimal" value={sellStrip} onChange={(e) => setSellStrip(e.target.value)} />
                <div className="hint">ফাঁকা রাখলে পিস × পাতার হিসাবে ধরা হবে</div>
              </div>
            </div>

            <div className="field">
              <label>স্টক কম-এর সতর্কতা (পিস)</label>
              <input type="number" inputMode="numeric" value={lowStock} onChange={(e) => setLowStock(e.target.value)} />
              <div className="hint">স্টক এর নিচে নামলে লাল সতর্কতা দেখাবে</div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '6px 0 16px' }} />
          </>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label>ব্যাচ নম্বর</label>
            <input value={batchNo} onChange={(e) => setBatchNo(e.target.value)} placeholder="ঐচ্ছিক" />
          </div>
          <div className="field">
            <label>মেয়াদ (মাস) *</label>
            <input type="month" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>কতটুকু ঢুকছে *</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <input type="number" inputMode="numeric" placeholder="বক্স" value={qBox} onChange={(e) => setQBox(e.target.value)} />
            <input type="number" inputMode="numeric" placeholder="পাতা" value={qStrip} onChange={(e) => setQStrip(e.target.value)} />
            <input type="number" inputMode="numeric" placeholder="পিস" value={qPiece} onChange={(e) => setQPiece(e.target.value)} />
          </div>
        </div>

        <button className="btn btn-primary" style={{ width: '100%' }} onClick={save} disabled={busy}>
          {busy ? 'সংরক্ষণ হচ্ছে…' : isBatchOnly ? 'ব্যাচ যোগ করো' : 'স্টকে যোগ করো'}
        </button>
      </div>
    </div>
  )
}
