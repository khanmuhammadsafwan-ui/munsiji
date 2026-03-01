import React, { useState, useEffect, useRef, useCallback } from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import * as DB from './db';

// ========== STYLES ==========
const C = {
  primary: '#1a5276', primaryLight: '#2e86c1', accent: '#e67e22', danger: '#c0392b',
  success: '#27ae60', bg: '#f0f4f8', card: '#ffffff', text: '#2c3e50', textLight: '#7f8c8d',
  border: '#dfe6e9', white: '#fff', bakiRed: '#e74c3c', cashGreen: '#2ecc71',
};

const S = {
  app: { minHeight: '100vh', background: C.bg, maxWidth: 480, margin: '0 auto', position: 'relative', paddingBottom: 70 },
  header: { background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: C.white, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 },
  headerTitle: { fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 },
  card: { background: C.card, borderRadius: 12, padding: 16, margin: '8px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  btn: (bg, full) => ({ background: bg || C.primary, color: C.white, border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer', width: full ? '100%' : 'auto', opacity: 1, transition: 'all .2s' }),
  btnOutline: { background: 'transparent', color: C.primary, border: `2px solid ${C.primary}`, borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  input: { width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 15, outline: 'none', marginBottom: 10 },
  label: { fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4, display: 'block' },
  bottomNav: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: C.white, display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '6px 0 10px', boxShadow: '0 -2px 12px rgba(0,0,0,0.08)', zIndex: 100 },
  navItem: (active) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontSize: 11, color: active ? C.primary : C.textLight, fontWeight: active ? 700 : 400, cursor: 'pointer', padding: '4px 8px', border: 'none', background: 'none', transition: 'all .2s' }),
  navIcon: { fontSize: 22 },
  sellBtn: { width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg, ${C.accent}, #d35400)`, color: C.white, border: '3px solid #fff', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginTop: -24, boxShadow: '0 4px 12px rgba(230,126,34,0.4)' },
  badge: { background: C.danger, color: C.white, borderRadius: 10, padding: '2px 7px', fontSize: 11, fontWeight: 700, marginLeft: 6 },
  tag: (bg, color) => ({ background: bg, color: color || C.text, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600, display: 'inline-block' }),
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 },
  modalContent: { background: C.white, borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto', padding: 20 },
  stat: (bg) => ({ background: bg || '#eaf2f8', borderRadius: 12, padding: '14px 16px', flex: 1, minWidth: 0 }),
  statLabel: { fontSize: 12, color: C.textLight, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: 700, color: C.text },
  emptyState: { textAlign: 'center', padding: 40, color: C.textLight },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  searchBox: { display: 'flex', alignItems: 'center', background: '#f5f6fa', borderRadius: 10, padding: '0 12px', margin: '0 16px 8px' },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer' },
};

const BN = {
  appName: 'মুন্সীজি', tagline: 'আপনার ডিজিটাল দোকানদার',
  home: 'হোম', stock: 'স্টক', sell: 'বিক্রি', baki: 'বাকি', more: 'আরো',
  todaySale: 'আজকের বিক্রি', totalBaki: 'মোট বাকি', stockValue: 'স্টক মূল্য', cashIn: 'নগদ আয়',
  addProduct: 'পণ্য যোগ করুন', productName: 'পণ্যের নাম', purchasePrice: 'ক্রয়মূল্য', sellingPrice: 'বিক্রয়মূল্য',
  quantity: 'পরিমাণ', unit: 'একক', save: 'সংরক্ষণ', cancel: 'বাতিল', delete: 'মুছুন', edit: 'সম্পাদনা',
  search: 'খুঁজুন...', lowStock: 'স্টক কম', outOfStock: 'স্টক শেষ',
  quickSell: 'দ্রুত বিক্রি', voiceSell: 'ভয়েসে বিক্রি', cash: 'নগদ', onBaki: 'বাকিতে',
  customerName: 'কাস্টমারের নাম', customerPhone: 'ফোন নম্বর', amount: 'পরিমাণ (টাকা)',
  confirm: 'নিশ্চিত করুন', totalAmount: 'মোট টাকা', paidAmount: 'পরিশোধিত', bakiAmount: 'বাকি',
  payment: 'পরিশোধ', recordPayment: 'টাকা আদায়', reminder: 'তাগাদা', noItems: 'কোনো আইটেম নেই',
  login: 'লগইন', phone: 'ফোন নম্বর', otp: 'OTP কোড', sendOTP: 'OTP পাঠান', verifyOTP: 'যাচাই করুন',
  shopName: 'দোকানের নাম', shopType: 'ধরন', location: 'ঠিকানা', setupShop: 'দোকান সেটআপ',
  logout: 'বের হন', items: 'টি আইটেম', taka: '৳', today: 'আজ', thisWeek: 'এই সপ্তাহ',
  profit: 'লাভ', loss: 'লস', salesCount: 'বিক্রি সংখ্যা', products: 'পণ্য',
  voiceHint: '🎤 মাইক বাটন চেপে বলুন, যেমন: "৫ কেজি চাল ২৮০ টাকা, ২ প্যাকেট লবণ ৪০ টাকা"',
  listening: 'শুনছি... বলতে থাকুন', voiceStop: 'থামুন', addToSale: 'বিক্রিতে যোগ করুন',
  category: 'ক্যাটাগরি',
  // Cash Book
  cashBook: 'ক্যাশ বুক', openingBalance: 'ওপেনিং ব্যালেন্স', closingBalance: 'ক্লোজিং ব্যালেন্স',
  todayExpense: 'আজকের খরচ', netCash: 'নিট ক্যাশ', setOpening: 'ওপেনিং সেট করুন',
  // Reports
  reports: 'রিপোর্ট', dailyReport: 'দৈনিক', weeklyReport: 'সাপ্তাহিক', monthlyReport: 'মাসিক',
  totalSales: 'মোট বিক্রি', totalExpenses: 'মোট খরচ', netProfit: 'নিট লাভ', grossProfit: 'মোট লাভ',
  // People
  people: 'কাস্টমার/সাপ্লায়ার', customer: 'কাস্টমার', supplier: 'সাপ্লায়ার', addPerson: 'যোগ করুন',
  personName: 'নাম', address: 'ঠিকানা', note: 'নোট',
  // Expenses
  expenses: 'খরচ', addExpense: 'খরচ যোগ করুন', expenseCategory: 'খরচের ধরন', expenseAmount: 'টাকা',
  expenseNote: 'বিবরণ',
  // Settings
  settings: 'সেটিংস', shopInfo: 'দোকানের তথ্য', editShop: 'তথ্য সম্পাদনা',
  appVersion: 'মুন্সীজি v1.0 (MVP)', backupData: 'ডেটা ব্যাকআপ', helpSupport: 'সাহায্য',
};

const UNITS = ['পিস', 'কেজি', 'গ্রাম', 'লিটার', 'প্যাকেট', 'বোতল', 'ডজন', 'বক্স', 'ব্যাগ', 'হালি'];
const CATEGORIES = ['মুদি', 'ওষুধ', 'প্রসাধনী', 'পানীয়', 'স্ন্যাক্স', 'দুগ্ধ', 'মসলা', 'তেল', 'সাবান/ডিটারজেন্ট', 'অন্যান্য'];
const SHOP_TYPES = ['মুদি দোকান', 'ফার্মেসী', 'কাপড়ের দোকান', 'হার্ডওয়্যার', 'কসমেটিক্স', 'রেস্টুরেন্ট', 'মোবাইল শপ', 'ইলেকট্রনিক্স', 'অন্যান্য'];
const EXPENSE_CATEGORIES = ['দোকান ভাড়া', 'বিদ্যুৎ বিল', 'পানি/গ্যাস', 'পরিবহন', 'কর্মচারী বেতন', 'মোবাইল বিল', 'মেরামত', 'প্যাকেজিং', 'চা/নাস্তা', 'অন্যান্য'];

function formatTaka(n) { return '৳' + (n || 0).toLocaleString('bn-BD'); }
function toBanglaNum(n) { return String(n).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]); }

// ========== LOGIN SCREEN ==========
function LoginScreen({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setError(''); setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        setError('লগইন সমস্যা: ' + e.message);
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ ...S.app, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>📒</div>
        <h1 style={{ fontSize: 32, color: C.primary, fontWeight: 800 }}>{BN.appName}</h1>
        <p style={{ color: C.textLight, fontSize: 15 }}>{BN.tagline}</p>
      </div>
      <div style={{ ...S.card, width: '100%', margin: 0, textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: C.textLight, marginBottom: 20 }}>আপনার দোকানের হিসাব শুরু করুন</p>
        <button style={{ ...S.btn(C.primary, true), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px 24px', fontSize: 16 }}
          onClick={handleGoogleLogin} disabled={loading}>
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.9 33.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.2-2.7-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.5 18.8 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.6-11.2-8.5l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.2-2.7-.4-3.9z"/></svg>
          {loading ? '⏳ লগইন হচ্ছে...' : 'Google দিয়ে চালিয়ে যান'}
        </button>
        {error && <p style={{ color: C.danger, fontSize: 13, marginTop: 12 }}>{error}</p>}
      </div>
    </div>
  );
}

// ========== SHOP SETUP SCREEN ==========
function ShopSetupScreen({ uid, onDone }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !type) return;
    setLoading(true);
    await DB.createShop(uid, { shopName: name, shopType: type, location, plan: 'free' });
    onDone();
  };

  return (
    <div style={{ ...S.app, padding: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <div style={{ fontSize: 48 }}>🏪</div>
        <h2 style={{ color: C.primary }}>{BN.setupShop}</h2>
        <p style={{ color: C.textLight, fontSize: 14 }}>আপনার দোকানের তথ্য দিন</p>
      </div>
      <label style={S.label}>{BN.shopName} *</label>
      <input style={S.input} placeholder="যেমন: করিম স্টোর" value={name} onChange={e => setName(e.target.value)} />
      <label style={S.label}>{BN.shopType} *</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {SHOP_TYPES.map(t => (
          <button key={t} onClick={() => setType(t)}
            style={{ padding: '8px 14px', borderRadius: 20, border: type === t ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
              background: type === t ? '#eaf2f8' : C.white, color: type === t ? C.primary : C.text, fontSize: 13, fontWeight: type === t ? 600 : 400, cursor: 'pointer' }}>
            {t}
          </button>
        ))}
      </div>
      <label style={S.label}>{BN.location}</label>
      <input style={S.input} placeholder="যেমন: ফার্মগেট, ঢাকা" value={location} onChange={e => setLocation(e.target.value)} />
      <button style={{ ...S.btn(C.primary, true), marginTop: 12 }} onClick={handleSave} disabled={loading || !name || !type}>
        {loading ? '⏳ সংরক্ষণ হচ্ছে...' : '✅ শুরু করুন'}
      </button>
    </div>
  );
}

// ========== PRODUCT MODAL ==========
function ProductModal({ product, onSave, onClose, onDelete }) {
  const [form, setForm] = useState(product || { name: '', category: '', purchasePrice: '', sellingPrice: '', qty: '', unit: 'পিস', lowStockAlert: 5 });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={S.modal} onClick={onClose}>
      <div style={S.modalContent} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: C.primary }}>{product ? BN.edit : BN.addProduct}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer' }}>✕</button>
        </div>
        <label style={S.label}>{BN.productName} *</label>
        <input style={S.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="যেমন: মিনিকেট চাল" autoFocus />
        <label style={S.label}>{BN.category}</label>
        <select style={S.input} value={form.category} onChange={e => set('category', e.target.value)}>
          <option value="">বাছাই করুন</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>{BN.purchasePrice} (৳)</label>
            <input style={S.input} type="number" value={form.purchasePrice} onChange={e => set('purchasePrice', +e.target.value)} placeholder="0" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>{BN.sellingPrice} (৳)</label>
            <input style={S.input} type="number" value={form.sellingPrice} onChange={e => set('sellingPrice', +e.target.value)} placeholder="0" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>{BN.quantity}</label>
            <input style={S.input} type="number" value={form.qty} onChange={e => set('qty', +e.target.value)} placeholder="0" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>{BN.unit}</label>
            <select style={S.input} value={form.unit} onChange={e => set('unit', e.target.value)}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <button style={{ ...S.btn(C.success, true), marginTop: 8 }} onClick={() => onSave(form)} disabled={!form.name}>
          {BN.save}
        </button>
        {product && (
          <button style={{ ...S.btn(C.danger, true), marginTop: 8 }} onClick={() => onDelete(product.id)}>
            🗑️ {BN.delete}
          </button>
        )}
      </div>
    </div>
  );
}

// ========== OCR SCAN MODAL ==========
function ScanModal({ onImport, onClose, existingProducts }) {
  const [step, setStep] = useState('capture'); // capture, processing, review
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [parsedItems, setParsedItems] = useState([]);
  const [progress, setProgress] = useState(0);
  const [scanType, setScanType] = useState('order'); // 'order' (stock in) or 'sell' (stock out)
  const fileRef = useRef(null);
  const cameraRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    processOCR(file);
  };

  const processOCR = async (file) => {
    setStep('processing'); setProgress(0);
    try {
      const Tesseract = await import('tesseract.js');
      const result = await Tesseract.recognize(file, 'ben+eng', {
        logger: m => { if (m.status === 'recognizing text') setProgress(Math.round(m.progress * 100)); }
      });
      const text = result.data.text;
      setOcrText(text);
      parseOCRText(text);
      setStep('review');
    } catch (err) {
      console.error('OCR Error:', err);
      setOcrText('OCR প্রসেস করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      setStep('review');
    }
  };

  const parseOCRText = (text) => {
    const lines = text.split('\n').filter(l => l.trim().length > 2);
    const items = [];
    
    const banglaToNum = (s) => {
      const map = { '০': 0, '১': 1, '২': 2, '৩': 3, '৪': 4, '৫': 5, '৬': 6, '৭': 7, '৮': 8, '৯': 9 };
      return +String(s).replace(/[০-৯]/g, d => map[d]).replace(/[^0-9.]/g, '') || 0;
    };

    for (const line of lines) {
      const clean = line.trim();
      if (!clean || clean.length < 3) continue;

      // Try to extract numbers (qty, price)
      const nums = [];
      const numPattern = /([০-৯0-9]+[.]?[০-৯0-9]*)/g;
      let m;
      while ((m = numPattern.exec(clean)) !== null) {
        const n = banglaToNum(m[1]);
        if (n > 0) nums.push(n);
      }

      // Remove numbers and common words to get product name
      let name = clean
        .replace(/[০-৯0-9.]+/g, '')
        .replace(/[৳টাকাTktkx×=\-:।,/\\]+/gi, '')
        .replace(/(কেজি|কিলো|গ্রাম|লিটার|প্যাকেট|পিস|বোতল|ডজন|বক্স|ব্যাগ|হালি|kg|gm|ltr|pcs|pc|pkt|dz)/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (name.length < 2 && nums.length === 0) continue;

      // Try to match with existing products
      let matched = null;
      if (existingProducts && name) {
        for (const p of existingProducts) {
          if (p.name && (p.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(p.name.toLowerCase()))) {
            matched = p;
            break;
          }
        }
      }

      // Determine unit from text
      let unit = 'পিস';
      if (/কেজি|কিলো|kg/i.test(clean)) unit = 'কেজি';
      else if (/গ্রাম|gm|gram/i.test(clean)) unit = 'গ্রাম';
      else if (/লিটার|ltr|litre/i.test(clean)) unit = 'লিটার';
      else if (/প্যাকেট|pkt|packet/i.test(clean)) unit = 'প্যাকেট';
      else if (/বোতল|bottle/i.test(clean)) unit = 'বোতল';
      else if (/ডজন|dozen|dz/i.test(clean)) unit = 'ডজন';

      const item = {
        name: matched?.name || name || 'অজানা পণ্য',
        qty: nums[0] || 1,
        price: nums.length >= 2 ? nums[nums.length - 1] : (matched?.sellingPrice || 0),
        unit,
        matchedId: matched?.id || null,
        rawLine: clean,
        selected: true,
      };

      if (item.name && item.name !== 'অজানা পণ্য') {
        items.push(item);
      } else if (nums.length > 0) {
        items.push(item);
      }
    }
    setParsedItems(items);
  };

  const toggleItem = (idx) => {
    setParsedItems(items => items.map((it, i) => i === idx ? { ...it, selected: !it.selected } : it));
  };

  const updateItem = (idx, field, value) => {
    setParsedItems(items => items.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const handleImport = () => {
    const selected = parsedItems.filter(it => it.selected);
    onImport(selected, scanType);
  };

  return (
    <div style={S.modal}>
      <div style={{ ...S.modalContent, height: '95vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexShrink: 0 }}>
          <h3 style={{ color: C.primary }}>📷 স্লিপ স্ক্যান করুন</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Scan Type Toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexShrink: 0 }}>
          <button onClick={() => setScanType('order')} style={{ ...S.btn(scanType === 'order' ? '#27ae60' : '#ddd', false), flex: 1, padding: '10px 0', color: scanType === 'order' ? C.white : C.text, fontSize: 13 }}>
            📦 অর্ডার স্লিপ (Stock IN)
          </button>
          <button onClick={() => setScanType('sell')} style={{ ...S.btn(scanType === 'sell' ? '#e67e22' : '#ddd', false), flex: 1, padding: '10px 0', color: scanType === 'sell' ? C.white : C.text, fontSize: 13 }}>
            🛒 বিক্রি স্লিপ (Stock OUT)
          </button>
        </div>

        {step === 'capture' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ fontSize: 80 }}>📸</div>
            <p style={{ color: C.textLight, fontSize: 14, textAlign: 'center', maxWidth: 280, lineHeight: 1.6 }}>
              {scanType === 'order'
                ? 'অর্ডার স্লিপ / চালানের ছবি তুলুন বা গ্যালারি থেকে দিন — পণ্য অটো ইনভেন্টরিতে যোগ হবে'
                : 'বিক্রির স্লিপের ছবি তুলুন — স্টক ও বাকি অটো আপডেট হবে'}
            </p>

            {/* Camera Capture */}
            <button onClick={() => cameraRef.current?.click()}
              style={{ ...S.btn('#27ae60', false), padding: '16px 40px', fontSize: 17, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              📷 ক্যামেরা খুলুন
            </button>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFile} />

            {/* Gallery */}
            <button onClick={() => fileRef.current?.click()}
              style={{ ...S.btnOutline, padding: '12px 32px', fontSize: 14 }}>
              🖼️ গ্যালারি থেকে দিন
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

            <div style={{ background: '#f0f4f8', borderRadius: 12, padding: 14, marginTop: 8, maxWidth: 300 }}>
              <p style={{ fontSize: 12, color: C.textLight, textAlign: 'center' }}>
                💡 <strong>টিপস:</strong> ছবি পরিষ্কার ও সোজা তুলুন। প্রিন্টেড স্লিপ সবচেয়ে ভালো কাজ করে।
              </p>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            {imagePreview && <img src={imagePreview} style={{ maxWidth: '90%', maxHeight: 200, borderRadius: 12, objectFit: 'contain' }} />}
            <div style={{ width: '80%', background: '#e0e0e0', borderRadius: 10, height: 12, overflow: 'hidden', marginTop: 16 }}>
              <div style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg, ${C.primary}, ${C.primaryLight})`, borderRadius: 10, transition: 'width 0.3s' }} />
            </div>
            <p style={{ color: C.primary, fontWeight: 600, fontSize: 16 }}>
              🔍 পড়া হচ্ছে... {progress}%
            </p>
            <p style={{ color: C.textLight, fontSize: 13 }}>
              স্লিপের লেখা চিনছি, একটু অপেক্ষা করুন...
            </p>
          </div>
        )}

        {step === 'review' && (
          <div style={{ flex: 1, overflow: 'auto' }}>
            {/* Image Preview */}
            {imagePreview && (
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <img src={imagePreview} style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 10, objectFit: 'contain' }} />
              </div>
            )}

            {/* Raw OCR Text (collapsible) */}
            <details style={{ marginBottom: 12 }}>
              <summary style={{ fontSize: 13, color: C.textLight, cursor: 'pointer' }}>📝 OCR থেকে পড়া টেক্সট দেখুন</summary>
              <pre style={{ background: '#f5f6fa', padding: 10, borderRadius: 8, fontSize: 12, whiteSpace: 'pre-wrap', marginTop: 8, maxHeight: 120, overflow: 'auto' }}>{ocrText || 'কিছু পড়া যায়নি'}</pre>
            </details>

            {/* Parsed Items */}
            {parsedItems.length > 0 ? (
              <>
                <p style={{ fontWeight: 700, color: C.primary, marginBottom: 8 }}>
                  ✅ {parsedItems.filter(i => i.selected).length}টি পণ্য চিনতে পেরেছি:
                </p>
                {parsedItems.map((item, i) => (
                  <div key={i} style={{ ...S.card, margin: '8px 0', padding: 12, border: item.selected ? `2px solid ${C.success}` : `1px solid ${C.border}`, opacity: item.selected ? 1 : 0.5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <input type="checkbox" checked={item.selected} onChange={() => toggleItem(i)} style={{ width: 20, height: 20, cursor: 'pointer' }} />
                      {item.matchedId && <span style={S.tag('#e2efda', '#27ae60')}>✓ ম্যাচ</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 2 }}>
                        <label style={{ fontSize: 11, color: C.textLight }}>পণ্যের নাম</label>
                        <input style={{ ...S.input, marginBottom: 4, padding: 8, fontSize: 14 }} value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 11, color: C.textLight }}>পরিমাণ</label>
                        <input style={{ ...S.input, marginBottom: 4, padding: 8 }} type="number" value={item.qty} onChange={e => updateItem(i, 'qty', +e.target.value)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 11, color: C.textLight }}>দাম (৳)</label>
                        <input style={{ ...S.input, marginBottom: 4, padding: 8 }} type="number" value={item.price} onChange={e => updateItem(i, 'price', +e.target.value)} />
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: C.textLight, marginTop: 2 }}>মূল: "{item.rawLine}"</div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <p style={{ fontSize: 48 }}>🤔</p>
                <p style={{ color: C.textLight, marginBottom: 12 }}>স্লিপ থেকে পণ্য চিনতে পারিনি</p>
                <p style={{ fontSize: 13, color: C.textLight }}>ছবি আরো পরিষ্কার করে তুলে আবার চেষ্টা করুন</p>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <button onClick={() => { setStep('capture'); setImage(null); setImagePreview(null); setParsedItems([]); setOcrText(''); }}
                style={{ ...S.btnOutline, flex: 1, fontSize: 13 }}>
                🔄 আবার স্ক্যান
              </button>
              {parsedItems.filter(i => i.selected).length > 0 && (
                <button onClick={handleImport}
                  style={{ ...S.btn(scanType === 'order' ? '#27ae60' : '#e67e22', false), flex: 2, fontSize: 14 }}>
                  {scanType === 'order'
                    ? `📦 ${parsedItems.filter(i => i.selected).length}টি পণ্য স্টকে যোগ করুন`
                    : `🛒 ${parsedItems.filter(i => i.selected).length}টি পণ্য বিক্রি করুন`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== SELL MODAL ==========
function SellModal({ products, onSell, onClose }) {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('tap'); // 'tap' or 'voice'
  const [payMode, setPayMode] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [step, setStep] = useState('items'); // 'items' or 'checkout'
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [voiceParsed, setVoiceParsed] = useState([]);
  const recognitionRef = useRef(null);

  const total = cart.reduce((s, c) => s + c.total, 0);
  const bakiAmt = payMode === 'baki' ? Math.max(0, total - (+paidAmount || 0)) : 0;

  const addToCart = (product) => {
    const existing = cart.find(c => c.productId === product.id);
    if (existing) {
      setCart(cart.map(c => c.productId === product.id ? { ...c, qty: c.qty + 1, total: (c.qty + 1) * c.price } : c));
    } else {
      setCart([...cart, { productId: product.id, name: product.name, price: product.sellingPrice || 0, qty: 1, total: product.sellingPrice || 0 }]);
    }
  };

  const updateQty = (idx, qty) => {
    if (qty <= 0) { setCart(cart.filter((_, i) => i !== idx)); return; }
    setCart(cart.map((c, i) => i === idx ? { ...c, qty, total: qty * c.price } : c));
  };

  const removeFromCart = (idx) => setCart(cart.filter((_, i) => i !== idx));

  // ========== VOICE INPUT ==========
  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('আপনার ব্রাউজার ভয়েস ইনপুট সাপোর্ট করে না। Chrome ব্যবহার করুন।');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'bn-BD';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (e) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      setVoiceText(text);
      parseVoice(text);
    };

    recognition.onerror = (e) => { console.error('Voice error:', e); setIsListening(false); };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopVoice = () => {
    if (recognitionRef.current) { recognitionRef.current.stop(); }
    setIsListening(false);
  };

  const parseVoice = (text) => {
    // Parse Bengali voice input like "৫ কেজি চাল ২৮০ টাকা, ২ প্যাকেট লবণ ৪০ টাকা"
    const banglaToNum = (s) => {
      const map = { '০': 0, '১': 1, '২': 2, '৩': 3, '৪': 4, '৫': 5, '৬': 6, '৭': 7, '৮': 8, '৯': 9 };
      return +String(s).replace(/[০-৯]/g, d => map[d]).replace(/[^0-9.]/g, '') || 0;
    };

    const items = text.split(/[,।\n]+/).filter(Boolean);
    const parsed = [];

    for (const item of items) {
      const clean = item.trim().toLowerCase();
      if (!clean) continue;

      // Try to extract: qty, unit, name, price
      const numPattern = /([০-৯0-9.]+)/g;
      const nums = [...clean.matchAll(numPattern)].map(m => banglaToNum(m[1]));

      // Try fuzzy match product name
      let matchedProduct = null;
      for (const p of products) {
        if (clean.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(clean.split(/\s+/)[1] || '')) {
          matchedProduct = p;
          break;
        }
      }

      if (nums.length >= 2) {
        parsed.push({ name: matchedProduct?.name || item.replace(/[০-৯0-9৳টাকা]/g, '').trim(), qty: nums[0], price: nums[nums.length - 1], productId: matchedProduct?.id, total: nums[0] * nums[nums.length - 1] });
      } else if (nums.length === 1 && matchedProduct) {
        parsed.push({ name: matchedProduct.name, qty: nums[0], price: matchedProduct.sellingPrice, productId: matchedProduct.id, total: nums[0] * matchedProduct.sellingPrice });
      }
    }
    setVoiceParsed(parsed);
  };

  const addVoiceToCart = () => {
    setCart([...cart, ...voiceParsed]);
    setVoiceParsed([]);
    setVoiceText('');
    setMode('tap');
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) && (p.qty || 0) > 0);

  const handleCheckout = () => {
    onSell({
      items: cart, totalAmount: total, paidAmount: payMode === 'cash' ? total : (+paidAmount || 0),
      bakiAmount: bakiAmt, paymentMethod: payMode, customerName, customerPhone
    });
  };

  return (
    <div style={S.modal}>
      <div style={{ ...S.modalContent, height: '95vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexShrink: 0 }}>
          <h3 style={{ color: C.primary }}>{step === 'items' ? '🛒 ' + BN.quickSell : '💰 চেকআউট'}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer' }}>✕</button>
        </div>

        {step === 'items' ? (<>
          {/* Mode Toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexShrink: 0 }}>
            <button onClick={() => setMode('tap')} style={{ ...S.btn(mode === 'tap' ? C.primary : '#ddd', false), flex: 1, padding: '10px 0', color: mode === 'tap' ? C.white : C.text }}>
              👆 {BN.quickSell}
            </button>
            <button onClick={() => setMode('voice')} style={{ ...S.btn(mode === 'voice' ? C.accent : '#ddd', false), flex: 1, padding: '10px 0', color: mode === 'voice' ? C.white : C.text }}>
              🎤 {BN.voiceSell}
            </button>
          </div>

          {mode === 'voice' ? (
            <div style={{ flex: 1, overflow: 'auto' }}>
              <div style={{ ...S.card, margin: 0, background: '#fef9f3', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: C.textLight, marginBottom: 16 }}>{BN.voiceHint}</p>
                <button onClick={isListening ? stopVoice : startVoice}
                  style={{ width: 80, height: 80, borderRadius: '50%', border: 'none', background: isListening ? C.danger : C.accent, color: C.white,
                    fontSize: 36, cursor: 'pointer', boxShadow: isListening ? '0 0 0 8px rgba(231,76,60,0.2)' : '0 4px 12px rgba(230,126,34,0.3)', animation: isListening ? 'pulse 1.5s infinite' : 'none' }}>
                  {isListening ? '⏹' : '🎤'}
                </button>
                <p style={{ marginTop: 8, fontSize: 13, color: isListening ? C.danger : C.textLight, fontWeight: isListening ? 600 : 400 }}>
                  {isListening ? BN.listening : 'মাইক চাপুন'}
                </p>
                <style>{`@keyframes pulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.08); } }`}</style>
              </div>

              {voiceText && (
                <div style={{ ...S.card, margin: '12px 0', background: '#f0f4f8' }}>
                  <p style={{ fontSize: 12, color: C.textLight, marginBottom: 4 }}>শোনা হয়েছে:</p>
                  <p style={{ fontSize: 15, color: C.text }}>{voiceText}</p>
                </div>
              )}

              {voiceParsed.length > 0 && (
                <div style={{ ...S.card, margin: '8px 0' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>✅ চিনতে পেরেছি:</p>
                  {voiceParsed.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < voiceParsed.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                      <span>{item.name} × {item.qty}</span>
                      <span style={{ fontWeight: 600 }}>{formatTaka(item.total)}</span>
                    </div>
                  ))}
                  <button style={{ ...S.btn(C.success, true), marginTop: 12 }} onClick={addVoiceToCart}>
                    ✅ {BN.addToSale} ({voiceParsed.length}টি)
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ flex: 1, overflow: 'auto' }}>
              <div style={{ ...S.searchBox, margin: '0 0 8px' }}>
                <span>🔍</span>
                <input style={{ border: 'none', background: 'none', padding: '10px 8px', fontSize: 14, outline: 'none', width: '100%' }}
                  placeholder={BN.search} value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div style={{ maxHeight: 200, overflow: 'auto', marginBottom: 8 }}>
                {filteredProducts.map(p => (
                  <div key={p.id} onClick={() => addToCart(p)} style={{ ...S.listItem, padding: '10px 12px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: C.textLight }}>স্টক: {p.qty} {p.unit}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: C.primary }}>{formatTaka(p.sellingPrice)}</div>
                      <span style={{ fontSize: 20 }}>➕</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cart Summary */}
          {cart.length > 0 && (
            <div style={{ borderTop: `2px solid ${C.primary}`, paddingTop: 12, flexShrink: 0 }}>
              <p style={{ fontWeight: 700, marginBottom: 8 }}>🧺 কার্ট ({cart.length}টি আইটেম)</p>
              {cart.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
                  <span style={{ flex: 1 }}>{item.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => updateQty(i, item.qty - 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${C.border}`, background: C.white, cursor: 'pointer', fontSize: 16 }}>−</button>
                    <span style={{ fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => updateQty(i, item.qty + 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${C.border}`, background: C.white, cursor: 'pointer', fontSize: 16 }}>+</button>
                    <span style={{ fontWeight: 700, minWidth: 60, textAlign: 'right' }}>{formatTaka(item.total)}</span>
                    <button onClick={() => removeFromCart(i)} style={{ border: 'none', background: 'none', fontSize: 16, cursor: 'pointer', color: C.danger }}>✕</button>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: `1px solid ${C.border}`, marginTop: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 800 }}>{BN.totalAmount}</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: C.primary }}>{formatTaka(total)}</span>
              </div>
              <button style={S.btn(C.success, true)} onClick={() => setStep('checkout')}>💰 চেকআউটে যান →</button>
            </div>
          )}
        </>) : (
          /* CHECKOUT STEP */
          <div style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ ...S.card, margin: '0 0 12px', background: '#eaf2f8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>মোট আইটেম</span><span style={{ fontWeight: 700 }}>{cart.length}টি</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 800 }}>{BN.totalAmount}</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: C.primary }}>{formatTaka(total)}</span>
              </div>
            </div>

            <p style={{ fontWeight: 600, marginBottom: 8 }}>পেমেন্ট মোড:</p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button onClick={() => setPayMode('cash')}
                style={{ ...S.btn(payMode === 'cash' ? C.success : '#ddd', false), flex: 1, color: payMode === 'cash' ? C.white : C.text }}>
                💵 {BN.cash}
              </button>
              <button onClick={() => setPayMode('baki')}
                style={{ ...S.btn(payMode === 'baki' ? C.danger : '#ddd', false), flex: 1, color: payMode === 'baki' ? C.white : C.text }}>
                📝 {BN.onBaki}
              </button>
            </div>

            {payMode === 'baki' && (<>
              <label style={S.label}>{BN.customerName} *</label>
              <input style={S.input} value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="যেমন: রহিম ভাই" />
              <label style={S.label}>{BN.customerPhone}</label>
              <input style={S.input} type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="01XXXXXXXXX" />
              <label style={S.label}>এখন কত দিচ্ছে? (৳)</label>
              <input style={S.input} type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} placeholder="0" />
              <div style={{ ...S.card, margin: '8px 0', background: '#fdf2f2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>বাকি থাকবে:</span>
                  <span style={{ fontWeight: 800, color: C.danger, fontSize: 18 }}>{formatTaka(bakiAmt)}</span>
                </div>
              </div>
            </>)}

            <button style={{ ...S.btn(C.success, true), marginTop: 12 }} onClick={handleCheckout}
              disabled={payMode === 'baki' && !customerName}>
              ✅ {BN.confirm}
            </button>
            <button style={{ ...S.btnOutline, width: '100%', marginTop: 8 }} onClick={() => setStep('items')}>← আইটেম এডিট করুন</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== BAKI PAYMENT MODAL ==========
function BakiPayModal({ baki, onPay, onClose }) {
  const [amount, setAmount] = useState('');
  return (
    <div style={S.modal} onClick={onClose}>
      <div style={{ ...S.modalContent, maxHeight: 400 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ color: C.primary, marginBottom: 16 }}>💰 {BN.recordPayment}</h3>
        <div style={{ ...S.card, margin: '0 0 16px', background: '#fdf2f2' }}>
          <p style={{ fontWeight: 600 }}>{baki.customerName}</p>
          <p style={{ fontSize: 13, color: C.textLight }}>{baki.customerPhone}</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: C.danger, marginTop: 8 }}>বাকি: {formatTaka(baki.totalOwed)}</p>
        </div>
        <label style={S.label}>কত টাকা পরিশোধ করছে?</label>
        <input style={S.input} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" autoFocus />
        <button style={S.btn(C.success, true)} onClick={() => onPay(baki.id, +amount)} disabled={!amount || +amount <= 0}>
          ✅ {formatTaka(+amount || 0)} আদায় করুন
        </button>
      </div>
    </div>
  );
}

// ========== EXPENSE MODAL ==========
function ExpenseModal({ onSave, onClose }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [note, setNote] = useState('');
  const submit = () => {
    if (!amount || isNaN(amount)) return;
    onSave({ amount: parseFloat(amount), category, note });
  };
  return (
    <div style={S.modal} onClick={onClose}>
      <div style={S.modalContent} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ color: C.primary }}>💸 {BN.addExpense}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>
        <label style={S.label}>{BN.expenseCategory}</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {EXPENSE_CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              style={{ padding: '8px 14px', borderRadius: 20, border: `1.5px solid ${category === c ? C.primary : C.border}`,
                background: category === c ? '#eaf2f8' : C.white, color: category === c ? C.primary : C.text,
                fontSize: 13, fontWeight: category === c ? 700 : 400, cursor: 'pointer' }}>
              {c}
            </button>
          ))}
        </div>
        <label style={S.label}>{BN.expenseAmount}</label>
        <input style={S.input} type="number" placeholder="টাকার পরিমাণ" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
        <label style={S.label}>{BN.expenseNote}</label>
        <input style={S.input} placeholder="বিবরণ (ঐচ্ছিক)" value={note} onChange={e => setNote(e.target.value)} />
        <button style={S.btn(C.primary, true)} onClick={submit}>✅ {BN.save}</button>
      </div>
    </div>
  );
}

// ========== CASH BOOK VIEW ==========
function CashBookView({ uid, dashboard, expenses, onBack }) {
  const [opening, setOpening] = useState('');
  const [cashEntry, setCashEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    DB.getCashBookEntry(uid, today).then(entry => {
      setCashEntry(entry);
      if (entry) setOpening(String(entry.openingBalance || 0));
      setLoading(false);
    });
  }, [uid]);

  const todayCash = dashboard?.todayCash || 0;
  const todayExpTotal = expenses.filter(e => {
    if (!e.createdAt) return false;
    const d = e.createdAt.toDate ? e.createdAt.toDate() : new Date(e.createdAt);
    const t = new Date(); t.setHours(0,0,0,0);
    return d >= t;
  }).reduce((s, e) => s + (e.amount || 0), 0);
  const openBal = cashEntry?.openingBalance || 0;
  const closingBal = openBal + todayCash - todayExpTotal;

  const saveOpening = async () => {
    const val = parseFloat(opening) || 0;
    await DB.saveCashBookEntry(uid, today, { openingBalance: val, salesCash: todayCash, expenses: todayExpTotal, closingBalance: val + todayCash - todayExpTotal });
    setCashEntry({ openingBalance: val });
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>⏳</div>;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer' }}>←</button>
        <h3 style={{ color: C.primary }}>💰 {BN.cashBook}</h3>
        <span style={{ fontSize: 13, color: C.textLight }}>{new Date().toLocaleDateString('bn-BD')}</span>
      </div>

      {/* Opening Balance */}
      <div style={{ ...S.card, background: '#eaf2f8', border: `1px solid ${C.primaryLight}` }}>
        <div style={S.statLabel}>{BN.openingBalance}</div>
        {cashEntry?.openingBalance !== undefined ? (
          <div style={{ ...S.statValue, color: C.primary }}>{formatTaka(openBal)}</div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={{ ...S.input, marginBottom: 0, flex: 1 }} type="number" placeholder="আজকের শুরুতে ক্যাশ" value={opening} onChange={e => setOpening(e.target.value)} />
            <button style={S.btn(C.primary)} onClick={saveOpening}>{BN.setOpening}</button>
          </div>
        )}
      </div>

      {/* Cash Flow */}
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <div style={{ ...S.stat('#eafaf1'), flex: 1 }}>
          <div style={S.statLabel}>➕ নগদ আয়</div>
          <div style={{ ...S.statValue, color: C.success, fontSize: 18 }}>{formatTaka(todayCash)}</div>
        </div>
        <div style={{ ...S.stat('#fdf2f2'), flex: 1 }}>
          <div style={S.statLabel}>➖ খরচ</div>
          <div style={{ ...S.statValue, color: C.danger, fontSize: 18 }}>{formatTaka(todayExpTotal)}</div>
        </div>
      </div>

      {/* Closing Balance */}
      <div style={{ ...S.card, marginTop: 10, background: closingBal >= 0 ? '#eafaf1' : '#fdf2f2', textAlign: 'center' }}>
        <div style={S.statLabel}>{BN.closingBalance}</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: closingBal >= 0 ? C.success : C.danger }}>{formatTaka(closingBal)}</div>
        <div style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>
          {formatTaka(openBal)} + {formatTaka(todayCash)} - {formatTaka(todayExpTotal)}
        </div>
      </div>
    </div>
  );
}

// ========== REPORTS VIEW ==========
function ReportsView({ uid, onBack }) {
  const [period, setPeriod] = useState('daily');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    let start = new Date();
    if (period === 'daily') { start.setHours(0,0,0,0); }
    else if (period === 'weekly') { start.setDate(now.getDate() - 7); start.setHours(0,0,0,0); }
    else { start.setDate(1); start.setHours(0,0,0,0); }
    setLoading(true);
    DB.getReportData(uid, start, now).then(d => { setReportData(d); setLoading(false); });
  }, [uid, period]);

  const tabs = [
    { key: 'daily', label: BN.dailyReport },
    { key: 'weekly', label: BN.weeklyReport },
    { key: 'monthly', label: BN.monthlyReport },
  ];

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer' }}>←</button>
        <h3 style={{ color: C.primary }}>📈 {BN.reports}</h3>
      </div>

      {/* Period Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setPeriod(t.key)}
            style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: `1.5px solid ${period === t.key ? C.primary : C.border}`,
              background: period === t.key ? C.primary : C.white, color: period === t.key ? C.white : C.text,
              fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40 }}>⏳ লোড হচ্ছে...</div> : reportData && (
        <div>
          {/* Summary Cards */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <div style={{ ...S.stat('#eafaf1'), flex: 1 }}>
              <div style={S.statLabel}>{BN.totalSales}</div>
              <div style={{ ...S.statValue, color: C.success, fontSize: 18 }}>{formatTaka(reportData.totalSales)}</div>
              <div style={{ fontSize: 11, color: C.textLight }}>{toBanglaNum(reportData.salesCount)}টি বিক্রি</div>
            </div>
            <div style={{ ...S.stat('#fdf2f2'), flex: 1 }}>
              <div style={S.statLabel}>{BN.totalExpenses}</div>
              <div style={{ ...S.statValue, color: C.danger, fontSize: 18 }}>{formatTaka(reportData.totalExpenses)}</div>
              <div style={{ fontSize: 11, color: C.textLight }}>{toBanglaNum(reportData.expenseCount)}টি খরচ</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <div style={{ ...S.stat('#eaf2f8'), flex: 1 }}>
              <div style={S.statLabel}>নগদ আয়</div>
              <div style={{ ...S.statValue, fontSize: 18 }}>{formatTaka(reportData.totalCash)}</div>
            </div>
            <div style={{ ...S.stat('#fef9e7'), flex: 1 }}>
              <div style={S.statLabel}>বাকি দেওয়া</div>
              <div style={{ ...S.statValue, color: C.accent, fontSize: 18 }}>{formatTaka(reportData.totalBakiGiven)}</div>
            </div>
          </div>

          {/* Net Profit Card */}
          <div style={{ ...S.card, textAlign: 'center', background: reportData.netProfit >= 0 ? '#eafaf1' : '#fdf2f2',
            border: `2px solid ${reportData.netProfit >= 0 ? C.success : C.danger}` }}>
            <div style={S.statLabel}>{BN.netProfit}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: reportData.netProfit >= 0 ? C.success : C.danger }}>
              {reportData.netProfit >= 0 ? '📈' : '📉'} {formatTaka(Math.abs(reportData.netProfit))}
            </div>
            <div style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>
              বিক্রি {formatTaka(reportData.totalSales)} − খরচ {formatTaka(reportData.totalExpenses)}
            </div>
          </div>

          {/* Expense Breakdown */}
          {Object.keys(reportData.expensesByCategory).length > 0 && (
            <div style={{ ...S.card, marginTop: 10 }}>
              <p style={{ fontWeight: 700, color: C.primary, marginBottom: 10 }}>💸 খরচের বিবরণ</p>
              {Object.entries(reportData.expensesByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}`, fontSize: 14 }}>
                  <span>{cat}</span>
                  <span style={{ fontWeight: 600, color: C.danger }}>{formatTaka(amt)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Daily Sales Breakdown */}
          {Object.keys(reportData.dailySales).length > 1 && (
            <div style={{ ...S.card, marginTop: 10 }}>
              <p style={{ fontWeight: 700, color: C.primary, marginBottom: 10 }}>📊 দিনভিত্তিক বিক্রি</p>
              {Object.entries(reportData.dailySales).map(([day, amt]) => (
                <div key={day} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}`, fontSize: 14 }}>
                  <span>{day}</span>
                  <span style={{ fontWeight: 600, color: C.success }}>{formatTaka(amt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ========== PEOPLE VIEW (Customers & Suppliers) ==========
function PeopleView({ uid, customers, bakiList, onBack, showSuccess }) {
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', note: '', type: 'customer' });

  const filtered = filter === 'all' ? customers : customers.filter(c => c.type === filter);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    await DB.addCustomer(uid, form);
    setForm({ name: '', phone: '', address: '', note: '', type: 'customer' });
    setShowAdd(false);
    showSuccess('✅ যোগ হয়েছে');
  };

  const handleDelete = async (id) => {
    if (confirm('মুছে ফেলবেন?')) {
      await DB.deleteCustomer(id);
      showSuccess('🗑️ মুছে ফেলা হয়েছে');
    }
  };

  // Merge baki data with customers
  const getCustomerBaki = (phone) => {
    const b = bakiList.find(x => x.customerPhone === phone);
    return b?.totalOwed || 0;
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer' }}>←</button>
        <h3 style={{ color: C.primary }}>👥 {BN.people}</h3>
        <button style={{ ...S.btn(C.success), padding: '6px 14px', fontSize: 13, marginLeft: 'auto' }} onClick={() => setShowAdd(true)}>
          ➕ {BN.addPerson}
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[{ key: 'all', label: 'সবাই' }, { key: 'customer', label: '🛒 কাস্টমার' }, { key: 'supplier', label: '🏭 সাপ্লায়ার' }].map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1.5px solid ${filter === t.key ? C.primary : C.border}`,
              background: filter === t.key ? '#eaf2f8' : C.white, color: filter === t.key ? C.primary : C.text,
              fontSize: 13, fontWeight: filter === t.key ? 700 : 400, cursor: 'pointer' }}>
            {t.label} ({(t.key === 'all' ? customers : customers.filter(c => c.type === t.key)).length})
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={S.emptyState}><div style={S.emptyIcon}>👥</div><p>কেউ নেই</p></div>
      ) : (
        <div style={{ background: C.white, borderRadius: 12 }}>
          {filtered.map(c => (
            <div key={c.id} style={{ ...S.listItem, padding: '14px 16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>
                  {c.name}
                  <span style={S.tag(c.type === 'supplier' ? '#fef9e7' : '#eaf2f8', c.type === 'supplier' ? '#d68910' : C.primary)}>
                    {c.type === 'supplier' ? 'সাপ্লায়ার' : 'কাস্টমার'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: C.textLight }}>{c.phone || 'ফোন নেই'} {c.address ? `| ${c.address}` : ''}</div>
                {c.note && <div style={{ fontSize: 11, color: C.textLight, fontStyle: 'italic' }}>{c.note}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                {c.phone && getCustomerBaki(c.phone) > 0 && (
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.danger }}>{formatTaka(getCustomerBaki(c.phone))}</div>
                )}
                <button onClick={() => handleDelete(c.id)} style={{ border: 'none', background: 'none', fontSize: 16, cursor: 'pointer', color: C.textLight }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div style={S.modal} onClick={() => setShowAdd(false)}>
          <div style={S.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ color: C.primary }}>➕ {BN.addPerson}</h3>
              <button onClick={() => setShowAdd(false)} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {['customer', 'supplier'].map(t => (
                <button key={t} onClick={() => setForm({ ...form, type: t })}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1.5px solid ${form.type === t ? C.primary : C.border}`,
                    background: form.type === t ? '#eaf2f8' : C.white, fontSize: 14, fontWeight: form.type === t ? 700 : 400, cursor: 'pointer' }}>
                  {t === 'customer' ? '🛒 কাস্টমার' : '🏭 সাপ্লায়ার'}
                </button>
              ))}
            </div>
            <label style={S.label}>{BN.personName} *</label>
            <input style={S.input} placeholder="নাম" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus />
            <label style={S.label}>{BN.customerPhone}</label>
            <input style={S.input} type="tel" placeholder="ফোন নম্বর" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <label style={S.label}>{BN.address}</label>
            <input style={S.input} placeholder="ঠিকানা" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            <label style={S.label}>{BN.note}</label>
            <input style={S.input} placeholder="নোট (ঐচ্ছিক)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            <button style={S.btn(C.primary, true)} onClick={handleSave}>✅ {BN.save}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== SETTINGS VIEW ==========
function SettingsView({ uid, shop, user, onBack, showSuccess }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ shopName: shop.shopName, shopType: shop.shopType, location: shop.location || '' });

  const handleSave = async () => {
    await DB.updateShop(uid, form);
    setEditing(false);
    showSuccess('✅ তথ্য আপডেট হয়েছে');
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer' }}>←</button>
        <h3 style={{ color: C.primary }}>⚙️ {BN.settings}</h3>
      </div>

      {/* Profile */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ fontWeight: 700, color: C.primary }}>👤 প্রোফাইল</p>
        </div>
        <p style={{ fontSize: 14, marginBottom: 4 }}>📧 {user?.email || 'N/A'}</p>
        <p style={{ fontSize: 14 }}>🆔 {user?.displayName || 'N/A'}</p>
      </div>

      {/* Shop Info */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ fontWeight: 700, color: C.primary }}>🏪 {BN.shopInfo}</p>
          <button style={S.btnOutline} onClick={() => setEditing(!editing)}>{editing ? BN.cancel : BN.editShop}</button>
        </div>
        {editing ? (
          <div>
            <label style={S.label}>{BN.shopName}</label>
            <input style={S.input} value={form.shopName} onChange={e => setForm({ ...form, shopName: e.target.value })} />
            <label style={S.label}>{BN.shopType}</label>
            <select style={S.input} value={form.shopType} onChange={e => setForm({ ...form, shopType: e.target.value })}>
              {SHOP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <label style={S.label}>{BN.location}</label>
            <input style={S.input} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            <button style={S.btn(C.primary, true)} onClick={handleSave}>✅ {BN.save}</button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 14, marginBottom: 4 }}>নাম: {shop.shopName}</p>
            <p style={{ fontSize: 14, marginBottom: 4 }}>ধরন: {shop.shopType}</p>
            <p style={{ fontSize: 14 }}>ঠিকানা: {shop.location || 'N/A'}</p>
          </div>
        )}
      </div>

      {/* App Info */}
      <div style={S.card}>
        <p style={{ fontWeight: 700, color: C.primary, marginBottom: 8 }}>ℹ️ অ্যাপ সম্পর্কে</p>
        <p style={{ fontSize: 14 }}>{BN.appVersion}</p>
        <p style={{ fontSize: 13, color: C.textLight }}>আপনার ডিজিটাল দোকানদার</p>
      </div>

      {/* Help */}
      <div style={S.card}>
        <p style={{ fontWeight: 700, color: C.primary, marginBottom: 8 }}>❓ {BN.helpSupport}</p>
        <p style={{ fontSize: 13, color: C.textLight, lineHeight: 1.6 }}>
          📷 স্ক্যান বাটনে চাপ দিয়ে অর্ডার স্লিপ বা সেলিং স্লিপ ছবি তুলুন — পণ্য অটো যোগ হবে।
          🎤 বিক্রি করতে ভয়েসে বলুন "৫ কেজি চাল ২৮০ টাকা"।
          📒 বাকিতে বিক্রি করলে কাস্টমারের নাম দিন, অটো ট্র্যাক হবে।
        </p>
      </div>

      {/* Logout */}
      <button style={{ ...S.btn(C.danger, true), marginTop: 16 }} onClick={() => signOut(auth)}>
        🚪 {BN.logout}
      </button>
    </div>
  );
}

// ========== MAIN APP ==========
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [shop, setShop] = useState(null);
  const [shopLoading, setShopLoading] = useState(false);
  const [tab, setTab] = useState('home');
  const [products, setProducts] = useState([]);
  const [bakiList, setBakiList] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showBakiPay, setShowBakiPay] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [subTab, setSubTab] = useState(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Auth listener
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        setShopLoading(true);
        const s = await DB.getShop(u.uid);
        setShop(s);
        setShopLoading(false);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Realtime listeners
  useEffect(() => {
    if (!user?.uid || !shop) return;
    const unsub1 = DB.onProductsChange(user.uid, setProducts);
    const unsub2 = DB.onBakiChange(user.uid, setBakiList);
    const unsub3 = DB.onExpensesChange(user.uid, setExpenses);
    const unsub4 = DB.onCustomersChange(user.uid, setCustomers);
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, [user?.uid, shop]);

  // Dashboard data
  useEffect(() => {
    if (!user?.uid || !shop) return;
    DB.getDashboardData(user.uid).then(setDashboard);
  }, [user?.uid, shop, products, bakiList]);

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 2500); };

  // Product handlers
  const handleSaveProduct = async (form) => {
    if (editProduct) {
      await DB.updateProduct(editProduct.id, form);
      showSuccess('✅ পণ্য আপডেট হয়েছে');
    } else {
      await DB.addProduct(user.uid, form);
      showSuccess('✅ পণ্য যোগ হয়েছে');
    }
    setShowProductModal(false);
    setEditProduct(null);
  };

  const handleDeleteProduct = async (id) => {
    if (confirm('এই পণ্যটি মুছে ফেলবেন?')) {
      await DB.deleteProduct(id);
      setShowProductModal(false);
      setEditProduct(null);
      showSuccess('🗑️ পণ্য মুছে ফেলা হয়েছে');
    }
  };

  // Sell handler
  const handleSell = async (saleData) => {
    await DB.createSale(user.uid, saleData);
    setShowSellModal(false);
    showSuccess(`✅ বিক্রি সম্পন্ন! মোট: ${formatTaka(saleData.totalAmount)}`);
    DB.getDashboardData(user.uid).then(setDashboard);
  };

  // Scan import handler
  const handleScanImport = async (items, scanType) => {
    if (scanType === 'order') {
      // Stock IN: add products to inventory
      for (const item of items) {
        if (item.matchedId) {
          // Update existing product quantity
          const existing = products.find(p => p.id === item.matchedId);
          if (existing) {
            await DB.updateProduct(item.matchedId, { qty: (existing.qty || 0) + item.qty, purchasePrice: item.price || existing.purchasePrice });
          }
        } else {
          // Add new product
          await DB.addProduct(user.uid, { name: item.name, qty: item.qty, purchasePrice: item.price, sellingPrice: Math.round(item.price * 1.15), unit: item.unit || 'পিস', category: '', lowStockAlert: 5 });
        }
      }
      setShowScanModal(false);
      showSuccess(`📦 ${items.length}টি পণ্য স্টকে যোগ হয়েছে!`);
    } else {
      // Stock OUT: create sale from scanned items
      const saleItems = items.map(it => ({ productId: it.matchedId || null, name: it.name, qty: it.qty, price: it.price, total: it.qty * it.price }));
      const total = saleItems.reduce((s, it) => s + it.total, 0);
      await DB.createSale(user.uid, { items: saleItems, totalAmount: total, paidAmount: total, bakiAmount: 0, paymentMethod: 'cash', customerName: '', customerPhone: '' });
      setShowScanModal(false);
      showSuccess(`🛒 বিক্রি সম্পন্ন! মোট: ${formatTaka(total)}`);
    }
    DB.getDashboardData(user.uid).then(setDashboard);
  };

  // Baki payment handler
  const handleBakiPay = async (bakiId, amount) => {
    await DB.recordBakiPayment(bakiId, amount);
    setShowBakiPay(null);
    showSuccess(`✅ ${formatTaka(amount)} আদায় হয়েছে`);
  };

  // Expense handler
  const handleAddExpense = async (data) => {
    await DB.addExpense(user.uid, data);
    setShowExpenseModal(false);
    showSuccess(`✅ ${formatTaka(data.amount)} খরচ যোগ হয়েছে`);
  };

  // Tab change handler
  const handleTabChange = (t) => { setTab(t); setSubTab(null); setSearchText(''); };

  // Auth states
  if (authLoading || shopLoading) return <div style={S.app}><div className="loader"></div></div>;
  if (!user) return <LoginScreen />;
  if (!shop) return <ShopSetupScreen uid={user.uid} onDone={async () => setShop(await DB.getShop(user.uid))} />;

  const filteredProducts = products.filter(p => p.name?.toLowerCase().includes(searchText.toLowerCase()));
  const totalBaki = bakiList.reduce((s, b) => s + (b.totalOwed || 0), 0);

  return (
    <div style={S.app}>
      {/* Success Toast */}
      {successMsg && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#27ae60', color: '#fff',
          padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600, zIndex: 300, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', maxWidth: 400 }}>
          {successMsg}
        </div>
      )}

      {/* Header */}
      <div style={S.header}>
        <div style={S.headerTitle}>📒 {BN.appName} <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.8 }}>{shop.shopName}</span></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => { handleTabChange('more'); setSubTab('settings'); }} style={{ border: 'none', background: 'rgba(255,255,255,0.2)', color: C.white, borderRadius: 8, padding: '6px 10px', fontSize: 14, cursor: 'pointer' }}>⚙️</button>
        </div>
      </div>

      {/* TAB: HOME / DASHBOARD */}
      {tab === 'home' && (
        <div style={{ padding: '8px 0 16px' }}>
          {/* Stat Cards Row 1 */}
          <div style={{ display: 'flex', gap: 10, padding: '0 16px', marginBottom: 10 }}>
            <div style={S.stat('#eafaf1')}>
              <div style={S.statLabel}>{BN.todaySale}</div>
              <div style={{ ...S.statValue, color: C.success }}>{formatTaka(dashboard?.todayTotal)}</div>
              <div style={{ fontSize: 11, color: C.textLight }}>{toBanglaNum(dashboard?.totalSalesCount || 0)}টি বিক্রি</div>
            </div>
            <div style={S.stat('#fdf2f2')}>
              <div style={S.statLabel}>{BN.totalBaki}</div>
              <div style={{ ...S.statValue, color: C.danger }}>{formatTaka(totalBaki)}</div>
              <div style={{ fontSize: 11, color: C.textLight }}>{toBanglaNum(bakiList.filter(b => b.totalOwed > 0).length)} জন</div>
            </div>
          </div>

          {/* Stat Cards Row 2 */}
          <div style={{ display: 'flex', gap: 10, padding: '0 16px', marginBottom: 10 }}>
            <div style={S.stat('#eaf2f8')}>
              <div style={S.statLabel}>{BN.stockValue}</div>
              <div style={S.statValue}>{formatTaka(dashboard?.totalStockValue)}</div>
              <div style={{ fontSize: 11, color: C.textLight }}>{toBanglaNum(dashboard?.totalProducts || 0)}টি পণ্য</div>
            </div>
            <div style={S.stat('#f0faf0')}>
              <div style={S.statLabel}>{BN.cashIn}</div>
              <div style={{ ...S.statValue, color: C.success }}>{formatTaka(dashboard?.todayCash)}</div>
              <div style={{ fontSize: 11, color: C.textLight }}>{BN.today}</div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', gap: 10, padding: '0 16px', marginBottom: 10 }}>
            <button onClick={() => setShowSellModal(true)} style={{ flex: 1, padding: '14px', borderRadius: 12, background: `linear-gradient(135deg, ${C.accent}, #d35400)`, color: C.white, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              🛒 দ্রুত বিক্রি
            </button>
            <button onClick={() => setShowExpenseModal(true)} style={{ flex: 1, padding: '14px', borderRadius: 12, background: `linear-gradient(135deg, ${C.danger}, #a93226)`, color: C.white, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              💸 খরচ যোগ
            </button>
          </div>

          {/* Low Stock Alerts */}
          {dashboard?.lowStockItems?.length > 0 && (
            <div style={{ ...S.card, border: `1px solid #f5b041`, background: '#fef9e7' }}>
              <p style={{ fontWeight: 700, color: '#d68910', marginBottom: 8 }}>⚠️ স্টক কম ({toBanglaNum(dashboard.lowStockItems.length)}টি পণ্য)</p>
              {dashboard.lowStockItems.slice(0, 5).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                  <span>{p.name}</span>
                  <span style={S.tag(p.qty <= 0 ? '#fce4ec' : '#fff3cd', p.qty <= 0 ? C.danger : '#d68910')}>
                    {p.qty <= 0 ? BN.outOfStock : `${toBanglaNum(p.qty)} ${p.unit}`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Today's Sales List */}
          <div style={S.card}>
            <p style={{ fontWeight: 700, color: C.primary, marginBottom: 10 }}>📋 আজকের বিক্রি</p>
            {(dashboard?.todaySales?.length || 0) === 0 ? (
              <p style={{ color: C.textLight, fontSize: 13, textAlign: 'center', padding: 16 }}>আজ এখনো কোনো বিক্রি হয়নি</p>
            ) : (
              dashboard.todaySales.slice(0, 8).map((sale, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 7 ? `1px solid ${C.border}` : 'none', fontSize: 13 }}>
                  <div>
                    <span>{sale.items?.map(it => it.name).join(', ').substring(0, 40)}</span>
                    {sale.bakiAmount > 0 && <span style={S.badge}>বাকি</span>}
                  </div>
                  <span style={{ fontWeight: 700 }}>{formatTaka(sale.totalAmount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: INVENTORY */}
      {tab === 'stock' && (
        <div>
          <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: C.primary }}>📦 {BN.stock} ({toBanglaNum(products.length)})</h3>
            <button style={S.btn(C.success)} onClick={() => { setEditProduct(null); setShowProductModal(true); }}>➕ {BN.addProduct}</button>
          </div>
          <div style={S.searchBox}>
            <span>🔍</span>
            <input style={{ border: 'none', background: 'none', padding: '10px 8px', fontSize: 14, outline: 'none', width: '100%' }}
              placeholder={BN.search} value={searchText} onChange={e => setSearchText(e.target.value)} />
          </div>
          {filteredProducts.length === 0 ? (
            <div style={S.emptyState}>
              <div style={S.emptyIcon}>📦</div>
              <p>{BN.noItems}</p>
              <button style={{ ...S.btn(C.primary), marginTop: 12 }} onClick={() => { setEditProduct(null); setShowProductModal(true); }}>
                ➕ {BN.addProduct}
              </button>
            </div>
          ) : (
            <div style={{ background: C.white }}>
              {filteredProducts.map(p => (
                <div key={p.id} style={S.listItem} onClick={() => { setEditProduct(p); setShowProductModal(true); }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: C.textLight }}>
                      {p.category && <span style={S.tag('#eaf2f8')}>{p.category}</span>}
                      <span style={{ marginLeft: 6 }}>ক্রয়: {formatTaka(p.purchasePrice)} | বিক্রয়: {formatTaka(p.sellingPrice)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: (p.qty || 0) <= (p.lowStockAlert || 5) ? C.danger : C.text }}>
                      {toBanglaNum(p.qty || 0)}
                    </div>
                    <div style={{ fontSize: 11, color: C.textLight }}>{p.unit}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: BAKI */}
      {tab === 'baki' && (
        <div>
          <div style={{ padding: '12px 16px' }}>
            <h3 style={{ color: C.primary }}>📝 {BN.baki}</h3>
            <div style={{ ...S.card, margin: '12px 0', background: '#fdf2f2', textAlign: 'center' }}>
              <div style={S.statLabel}>মোট পাওনা</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.danger }}>{formatTaka(totalBaki)}</div>
              <div style={{ fontSize: 12, color: C.textLight }}>{toBanglaNum(bakiList.filter(b => b.totalOwed > 0).length)} জনের কাছে</div>
            </div>
          </div>
          {bakiList.filter(b => b.totalOwed > 0).length === 0 ? (
            <div style={S.emptyState}>
              <div style={S.emptyIcon}>🎉</div>
              <p>কারো কোনো বাকি নেই!</p>
            </div>
          ) : (
            <div style={{ background: C.white }}>
              {bakiList.filter(b => b.totalOwed > 0).sort((a, b) => (b.totalOwed || 0) - (a.totalOwed || 0)).map(b => (
                <div key={b.id} style={{ ...S.listItem, padding: '14px 16px' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{b.customerName}</div>
                    <div style={{ fontSize: 12, color: C.textLight }}>{b.customerPhone || 'ফোন নম্বর নেই'}</div>
                    {b.payments?.length > 0 && (
                      <div style={{ fontSize: 11, color: C.success, marginTop: 2 }}>
                        সর্বশেষ পরিশোধ: {formatTaka(b.payments[b.payments.length - 1]?.amount)}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.danger }}>{formatTaka(b.totalOwed)}</div>
                    <button onClick={(e) => { e.stopPropagation(); setShowBakiPay(b); }}
                      style={{ ...S.btn(C.success), padding: '6px 14px', fontSize: 12 }}>
                      💰 আদায়
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: MORE - Hub or Sub-views */}
      {tab === 'more' && (
        subTab === 'cashbook' ? <CashBookView uid={user.uid} dashboard={dashboard} expenses={expenses} onBack={() => setSubTab(null)} /> :
        subTab === 'reports' ? <ReportsView uid={user.uid} onBack={() => setSubTab(null)} /> :
        subTab === 'people' ? <PeopleView uid={user.uid} customers={customers} bakiList={bakiList} onBack={() => setSubTab(null)} showSuccess={showSuccess} /> :
        subTab === 'settings' ? <SettingsView uid={user.uid} shop={shop} user={user} onBack={() => setSubTab(null)} showSuccess={showSuccess} /> :
        (
          <div style={{ padding: 16 }}>
            <h3 style={{ color: C.primary, marginBottom: 16 }}>📋 {BN.more}</h3>

            {/* Quick Expense Button */}
            <button onClick={() => setShowExpenseModal(true)} style={{ ...S.btn(C.accent, true), marginBottom: 16, padding: '14px 24px', fontSize: 16 }}>
              💸 {BN.addExpense}
            </button>

            {/* Menu Cards */}
            {[
              { key: 'cashbook', icon: '💰', label: BN.cashBook, desc: 'দৈনিক ক্যাশ ইন-আউট হিসাব', color: '#eafaf1' },
              { key: 'reports', icon: '📈', label: BN.reports, desc: 'বিক্রি, খরচ ও লাভের রিপোর্ট', color: '#eaf2f8' },
              { key: 'people', icon: '👥', label: BN.people, desc: `${toBanglaNum(customers.length)} জন সেভ করা`, color: '#fef9e7' },
              { key: 'expenses', icon: '💸', label: BN.expenses, desc: 'সকল খরচের তালিকা', color: '#fdf2f2' },
              { key: 'settings', icon: '⚙️', label: BN.settings, desc: 'দোকান, প্রোফাইল, সাহায্য', color: '#f4ecf7' },
            ].map(item => (
              <div key={item.key}
                onClick={() => item.key === 'expenses' ? setShowExpenseModal(true) : setSubTab(item.key)}
                style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', background: item.color, marginBottom: 8 }}>
                <span style={{ fontSize: 28 }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: C.textLight }}>{item.desc}</div>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 18, color: C.textLight }}>→</span>
              </div>
            ))}

            {/* Today's Expenses List */}
            {expenses.filter(e => {
              if (!e.createdAt) return false;
              const d = e.createdAt.toDate ? e.createdAt.toDate() : new Date(e.createdAt);
              const t = new Date(); t.setHours(0,0,0,0);
              return d >= t;
            }).length > 0 && (
              <div style={{ ...S.card, marginTop: 8 }}>
                <p style={{ fontWeight: 700, color: C.primary, marginBottom: 10 }}>💸 আজকের খরচ</p>
                {expenses.filter(e => {
                  if (!e.createdAt) return false;
                  const d = e.createdAt.toDate ? e.createdAt.toDate() : new Date(e.createdAt);
                  const t = new Date(); t.setHours(0,0,0,0);
                  return d >= t;
                }).map((e, i) => (
                  <div key={e.id || i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                    <div>
                      <span style={S.tag('#fdf2f2', C.danger)}>{e.category}</span>
                      {e.note && <span style={{ marginLeft: 6, color: C.textLight }}>{e.note}</span>}
                    </div>
                    <span style={{ fontWeight: 700, color: C.danger }}>{formatTaka(e.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Logout */}
            <button style={{ ...S.btn(C.danger, true), marginTop: 16 }} onClick={() => signOut(auth)}>
              🚪 {BN.logout}
            </button>
          </div>
        )
      )}

      {/* BOTTOM NAVIGATION */}
      <div style={S.bottomNav}>
        <button style={S.navItem(tab === 'home')} onClick={() => handleTabChange('home')}>
          <span style={S.navIcon}>🏠</span>{BN.home}
        </button>
        <button style={S.navItem(tab === 'stock')} onClick={() => handleTabChange('stock')}>
          <span style={S.navIcon}>📦</span>{BN.stock}
        </button>
        <button style={{ ...S.sellBtn, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})` }} onClick={() => setShowScanModal(true)}>📷</button>
        <button style={S.navItem(tab === 'baki')} onClick={() => handleTabChange('baki')}>
          <span style={S.navIcon}>📒</span>{BN.baki}
          {totalBaki > 0 && <span style={S.badge}>{bakiList.filter(b => b.totalOwed > 0).length}</span>}
        </button>
        <button style={S.navItem(tab === 'more')} onClick={() => handleTabChange('more')}>
          <span style={S.navIcon}>📈</span>{BN.more}
        </button>
      </div>

      {/* MODALS */}
      {showScanModal && (
        <ScanModal existingProducts={products} onImport={handleScanImport} onClose={() => setShowScanModal(false)} />
      )}
      {showProductModal && (
        <ProductModal product={editProduct} onSave={handleSaveProduct} onDelete={handleDeleteProduct}
          onClose={() => { setShowProductModal(false); setEditProduct(null); }} />
      )}
      {showSellModal && (
        <SellModal products={products.filter(p => (p.qty || 0) > 0)} onSell={handleSell} onClose={() => setShowSellModal(false)} />
      )}
      {showBakiPay && (
        <BakiPayModal baki={showBakiPay} onPay={handleBakiPay} onClose={() => setShowBakiPay(null)} />
      )}
      {showExpenseModal && (
        <ExpenseModal onSave={handleAddExpense} onClose={() => setShowExpenseModal(false)} />
      )}
    </div>
  );
}
