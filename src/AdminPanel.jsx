import React, { useState, useEffect } from 'react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';

// ========== CONFIG ==========
// 🔧 তোমার admin email এখানে সেট করো
const ADMIN_EMAILS = ['CHANGE_THIS@gmail.com'];

// ========== COLORS & STYLES ==========
const C = {
  primary: '#1a56db', primaryLight: '#3b82f6', accent: '#7c3aed',
  success: '#059669', danger: '#dc2626', warning: '#d97706',
  text: '#1f2937', textLight: '#6b7280', border: '#e5e7eb',
  white: '#ffffff', bg: '#f0f2f5', card: '#ffffff',
};

const S = {
  container: { minHeight: '100vh', background: C.bg, fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif' },
  header: { background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, color: C.white, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  card: { background: C.white, borderRadius: 14, padding: 18, margin: '0 0 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  statCard: (bg) => ({ background: bg, borderRadius: 14, padding: 18, flex: 1, minWidth: 140 }),
  statValue: { fontSize: 28, fontWeight: 800 },
  statLabel: { fontSize: 12, color: C.textLight, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { padding: '12px 14px', textAlign: 'left', borderBottom: `2px solid ${C.primary}`, color: C.primary, fontWeight: 700, fontSize: 12, textTransform: 'uppercase' },
  td: { padding: '12px 14px', borderBottom: `1px solid ${C.border}` },
  btn: (bg) => ({ background: bg, color: C.white, border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }),
  badge: (bg, color) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 20, background: bg, color, fontSize: 11, fontWeight: 600 }),
  sidebar: { width: 240, background: C.white, borderRight: `1px solid ${C.border}`, height: '100vh', position: 'fixed', left: 0, top: 0, paddingTop: 70 },
  sideItem: (active) => ({ display: 'block', width: '100%', padding: '12px 20px', border: 'none', background: active ? '#eef2ff' : 'transparent', color: active ? C.primary : C.text, fontSize: 14, fontWeight: active ? 700 : 400, cursor: 'pointer', textAlign: 'left', borderLeft: active ? `3px solid ${C.primary}` : '3px solid transparent' }),
  main: { marginLeft: 240, padding: 24 },
  bar: (pct, color) => ({ height: 22, width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 4, minWidth: pct > 0 ? 4 : 0, transition: 'width 0.5s ease' }),
};

// ========== HELPERS ==========
const formatTaka = (n) => `৳${(n || 0).toLocaleString('en-IN')}`;
const toBanglaNum = (n) => String(n).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]);
const timeAgo = (date) => {
  if (!date) return 'N/A';
  const d = date.toDate ? date.toDate() : new Date(date);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'এইমাত্র';
  if (diff < 3600) return `${Math.floor(diff / 60)} মিনিট আগে`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ঘন্টা আগে`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} দিন আগে`;
  return d.toLocaleDateString('bn-BD');
};

// ========== ADMIN PANEL ==========
export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [page, setPage] = useState('dashboard');
  const [data, setData] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sideOpen, setSideOpen] = useState(false);

  useEffect(() => {
    window.addEventListener('resize', () => setIsMobile(window.innerWidth < 768));
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u && ADMIN_EMAILS.includes(u.email)) {
        setAuthorized(true);
        loadAllData();
      } else {
        setAuthorized(false);
      }
      setLoading(false);
    });
  }, []);

  // ========== DATA LOADING ==========
  const loadAllData = async () => {
    try {
      const [shopsSnap, productsSnap, salesSnap, bakiSnap, expensesSnap, customersSnap] = await Promise.all([
        getDocs(collection(db, 'shops')),
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'sales')),
        getDocs(collection(db, 'baki')),
        getDocs(collection(db, 'expenses')),
        getDocs(collection(db, 'customers')),
      ]);

      const shops = shopsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const sales = salesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const baki = bakiSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const expenses = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const customers = customersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Aggregate per user
      const users = {};
      shops.forEach(s => {
        users[s.uid || s.id] = {
          ...s, uid: s.uid || s.id,
          products: [], sales: [], baki: [], expenses: [], customers: [],
          totalSales: 0, totalProducts: 0, totalBaki: 0, totalExpenses: 0,
        };
      });

      products.forEach(p => { if (users[p.uid]) { users[p.uid].products.push(p); users[p.uid].totalProducts++; } });
      sales.forEach(s => { if (users[s.uid]) { users[s.uid].sales.push(s); users[s.uid].totalSales += (s.totalAmount || 0); } });
      baki.forEach(b => { if (users[b.uid]) { users[b.uid].baki.push(b); users[b.uid].totalBaki += (b.totalOwed || 0); } });
      expenses.forEach(e => { if (users[e.uid]) { users[e.uid].expenses.push(e); users[e.uid].totalExpenses += (e.amount || 0); } });
      customers.forEach(c => { if (users[c.uid]) { users[c.uid].customers.push(c); } });

      // Today's data
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todaySales = sales.filter(s => {
        const d = s.createdAt?.toDate ? s.createdAt.toDate() : null;
        return d && d >= today;
      });
      const todayExpenses = expenses.filter(e => {
        const d = e.createdAt?.toDate ? e.createdAt.toDate() : null;
        return d && d >= today;
      });

      // Last 7 days sales by day
      const dailySales = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
        const label = d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });
        dailySales[label] = 0;
      }
      sales.forEach(s => {
        const d = s.createdAt?.toDate ? s.createdAt.toDate() : null;
        if (!d) return;
        const diff = (Date.now() - d.getTime()) / (1000 * 86400);
        if (diff <= 7) {
          const label = d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });
          if (dailySales[label] !== undefined) dailySales[label] += (s.totalAmount || 0);
        }
      });

      setData({
        users: Object.values(users),
        totalShops: shops.length,
        totalProducts: products.length,
        totalSales: sales.reduce((s, x) => s + (x.totalAmount || 0), 0),
        totalSalesCount: sales.length,
        totalBaki: baki.reduce((s, x) => s + (x.totalOwed || 0), 0),
        totalExpenses: expenses.reduce((s, x) => s + (x.amount || 0), 0),
        totalCustomers: customers.length,
        todaySalesTotal: todaySales.reduce((s, x) => s + (x.totalAmount || 0), 0),
        todaySalesCount: todaySales.length,
        todayExpensesTotal: todayExpenses.reduce((s, x) => s + (x.amount || 0), 0),
        dailySales,
        allSales: sales,
        allProducts: products,
      });
    } catch (err) {
      console.error('Admin data load error:', err);
    }
  };

  // ========== LOGIN SCREEN ==========
  if (loading) return (
    <div style={{ ...S.container, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📒</div>
        <p style={{ color: C.textLight }}>লোড হচ্ছে...</p>
      </div>
    </div>
  );

  if (!user) return (
    <div style={{ ...S.container, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ ...S.card, maxWidth: 400, width: '90%', textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
        <h2 style={{ color: C.primary, marginBottom: 8 }}>Munsiji Admin</h2>
        <p style={{ color: C.textLight, marginBottom: 24, fontSize: 14 }}>শুধুমাত্র অনুমোদিত অ্যাডমিনদের জন্য</p>
        <button onClick={() => signInWithPopup(auth, googleProvider)} style={{ ...S.btn(C.primary), width: '100%', padding: '14px', fontSize: 16 }}>
          🔑 Google দিয়ে লগইন
        </button>
      </div>
    </div>
  );

  if (!authorized) return (
    <div style={{ ...S.container, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ ...S.card, maxWidth: 400, width: '90%', textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
        <h2 style={{ color: C.danger, marginBottom: 8 }}>অ্যাক্সেস নেই</h2>
        <p style={{ color: C.textLight, marginBottom: 8, fontSize: 14 }}>
          <strong>{user.email}</strong> অ্যাডমিন হিসেবে অনুমোদিত নয়।
        </p>
        <p style={{ color: C.textLight, marginBottom: 24, fontSize: 12 }}>
          অনুমোদিত: {ADMIN_EMAILS.join(', ')}
        </p>
        <button onClick={() => signOut(auth)} style={{ ...S.btn(C.danger), width: '100%' }}>
          🚪 লগআউট
        </button>
      </div>
    </div>
  );

  if (!data) return (
    <div style={{ ...S.container, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <p style={{ color: C.textLight }}>ডেটা লোড হচ্ছে...</p>
      </div>
    </div>
  );

  // ========== SIDEBAR ==========
  const menuItems = [
    { key: 'dashboard', icon: '📊', label: 'ড্যাশবোর্ড' },
    { key: 'users', icon: '👥', label: `ইউজার (${data.totalShops})` },
    { key: 'sales', icon: '💰', label: 'বিক্রি রিপোর্ট' },
    { key: 'analytics', icon: '📈', label: 'অ্যানালিটিক্স' },
  ];

  const Sidebar = () => (
    <div style={isMobile ? { ...S.sidebar, width: '80%', zIndex: 1000, boxShadow: '4px 0 20px rgba(0,0,0,0.2)', display: sideOpen ? 'block' : 'none' } : S.sidebar}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.primary }}>📒 Munsiji</div>
        <div style={{ fontSize: 11, color: C.textLight }}>Admin Panel</div>
      </div>
      {menuItems.map(m => (
        <button key={m.key} onClick={() => { setPage(m.key); setSelectedUser(null); setSideOpen(false); }}
          style={S.sideItem(page === m.key)}>
          {m.icon} {m.label}
        </button>
      ))}
      <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, padding: '0 20px' }}>
        <div style={{ fontSize: 12, color: C.textLight, marginBottom: 8 }}>{user.email}</div>
        <button onClick={() => signOut(auth)} style={{ ...S.btn(C.danger), width: '100%', fontSize: 12, padding: '8px' }}>
          🚪 লগআউট
        </button>
      </div>
    </div>
  );

  // ========== DASHBOARD PAGE ==========
  const DashboardPage = () => {
    const maxDaily = Math.max(...Object.values(data.dailySales), 1);
    return (
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 20 }}>📊 ড্যাশবোর্ড</h2>

        {/* Top Stats */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <div style={S.statCard('#eef2ff')}>
            <div style={S.statLabel}>মোট দোকান</div>
            <div style={{ ...S.statValue, color: C.primary }}>{toBanglaNum(data.totalShops)}</div>
          </div>
          <div style={S.statCard('#ecfdf5')}>
            <div style={S.statLabel}>মোট বিক্রি</div>
            <div style={{ ...S.statValue, color: C.success }}>{formatTaka(data.totalSales)}</div>
            <div style={{ fontSize: 11, color: C.textLight }}>{toBanglaNum(data.totalSalesCount)}টি</div>
          </div>
          <div style={S.statCard('#fef2f2')}>
            <div style={S.statLabel}>মোট বাকি</div>
            <div style={{ ...S.statValue, color: C.danger }}>{formatTaka(data.totalBaki)}</div>
          </div>
          <div style={S.statCard('#fefce8')}>
            <div style={S.statLabel}>মোট খরচ</div>
            <div style={{ ...S.statValue, color: C.warning }}>{formatTaka(data.totalExpenses)}</div>
          </div>
        </div>

        {/* Today's Summary */}
        <div style={S.card}>
          <h3 style={{ color: C.primary, marginBottom: 14, fontSize: 16 }}>🕐 আজকের সারসংক্ষেপ</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: 12, color: C.textLight }}>আজকের বিক্রি: </span>
              <strong style={{ color: C.success }}>{formatTaka(data.todaySalesTotal)}</strong>
              <span style={{ fontSize: 12, color: C.textLight }}> ({toBanglaNum(data.todaySalesCount)}টি)</span>
            </div>
            <div>
              <span style={{ fontSize: 12, color: C.textLight }}>আজকের খরচ: </span>
              <strong style={{ color: C.danger }}>{formatTaka(data.todayExpensesTotal)}</strong>
            </div>
            <div>
              <span style={{ fontSize: 12, color: C.textLight }}>মোট পণ্য: </span>
              <strong>{toBanglaNum(data.totalProducts)}</strong>
            </div>
            <div>
              <span style={{ fontSize: 12, color: C.textLight }}>মোট কাস্টমার: </span>
              <strong>{toBanglaNum(data.totalCustomers)}</strong>
            </div>
          </div>
        </div>

        {/* 7-Day Sales Chart */}
        <div style={S.card}>
          <h3 style={{ color: C.primary, marginBottom: 14, fontSize: 16 }}>📈 সাপ্তাহিক বিক্রি (শেষ ৭ দিন)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(data.dailySales).map(([day, amt]) => (
              <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 80, fontSize: 12, color: C.textLight, textAlign: 'right' }}>{day}</div>
                <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={S.bar((amt / maxDaily) * 100, amt > 0 ? C.success : '#e5e7eb')} />
                </div>
                <div style={{ width: 80, fontSize: 12, fontWeight: 600, color: amt > 0 ? C.success : C.textLight }}>{formatTaka(amt)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Users */}
        <div style={S.card}>
          <h3 style={{ color: C.primary, marginBottom: 14, fontSize: 16 }}>🏆 শীর্ষ দোকান (বিক্রি অনুযায়ী)</h3>
          {data.users.sort((a, b) => b.totalSales - a.totalSales).slice(0, 5).map((u, i) => (
            <div key={u.uid} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 4 ? `1px solid ${C.border}` : 'none', cursor: 'pointer' }}
              onClick={() => { setSelectedUser(u); setPage('users'); }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{u.shopName || 'N/A'}</div>
                <div style={{ fontSize: 12, color: C.textLight }}>{u.shopType || ''} • {toBanglaNum(u.products.length)} পণ্য</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: C.success }}>{formatTaka(u.totalSales)}</div>
                <div style={{ fontSize: 11, color: C.textLight }}>{toBanglaNum(u.sales.length)}টি বিক্রি</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ========== USERS PAGE ==========
  const UsersPage = () => {
    if (selectedUser) return <UserDetail user={selectedUser} onBack={() => setSelectedUser(null)} />;

    return (
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 20 }}>👥 সকল ইউজার ({toBanglaNum(data.totalShops)})</h2>

        <div style={{ ...S.card, overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>#</th>
                <th style={S.th}>দোকান</th>
                <th style={S.th}>ধরন</th>
                <th style={S.th}>পণ্য</th>
                <th style={S.th}>বিক্রি</th>
                <th style={S.th}>বাকি</th>
                <th style={S.th}>যোগদান</th>
                <th style={S.th}>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {data.users.sort((a, b) => b.totalSales - a.totalSales).map((u, i) => (
                <tr key={u.uid} style={{ background: i % 2 === 0 ? C.white : '#fafafa' }}>
                  <td style={S.td}>{toBanglaNum(i + 1)}</td>
                  <td style={S.td}>
                    <div style={{ fontWeight: 600 }}>{u.shopName || 'N/A'}</div>
                    <div style={{ fontSize: 11, color: C.textLight }}>{u.location || ''}</div>
                  </td>
                  <td style={S.td}><span style={S.badge('#eef2ff', C.primary)}>{u.shopType || 'N/A'}</span></td>
                  <td style={S.td}>{toBanglaNum(u.products.length)}</td>
                  <td style={S.td}><strong style={{ color: C.success }}>{formatTaka(u.totalSales)}</strong></td>
                  <td style={S.td}><strong style={{ color: u.totalBaki > 0 ? C.danger : C.textLight }}>{formatTaka(u.totalBaki)}</strong></td>
                  <td style={S.td}><span style={{ fontSize: 12 }}>{timeAgo(u.createdAt)}</span></td>
                  <td style={S.td}>
                    <button onClick={() => setSelectedUser(u)} style={{ ...S.btn(C.primary), padding: '6px 12px', fontSize: 12 }}>
                      বিস্তারিত →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ========== USER DETAIL ==========
  const UserDetail = ({ user: u, onBack }) => (
    <div>
      <button onClick={onBack} style={{ border: 'none', background: 'none', fontSize: 16, cursor: 'pointer', marginBottom: 16, color: C.primary, fontWeight: 600 }}>
        ← ইউজার তালিকায় ফিরুন
      </button>

      {/* User Header */}
      <div style={{ ...S.card, background: `linear-gradient(135deg, #eef2ff, #f5f3ff)`, border: `2px solid ${C.primaryLight}` }}>
        <h2 style={{ color: C.primary, marginBottom: 8 }}>🏪 {u.shopName}</h2>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 14 }}>
          <span>📍 {u.location || 'N/A'}</span>
          <span>🏷️ {u.shopType || 'N/A'}</span>
          <span>📅 যোগদান: {timeAgo(u.createdAt)}</span>
          <span>🆔 {u.uid?.substring(0, 12)}...</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '12px 0' }}>
        <div style={S.statCard('#ecfdf5')}>
          <div style={S.statLabel}>মোট বিক্রি</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.success }}>{formatTaka(u.totalSales)}</div>
          <div style={{ fontSize: 11, color: C.textLight }}>{toBanglaNum(u.sales.length)}টি</div>
        </div>
        <div style={S.statCard('#fef2f2')}>
          <div style={S.statLabel}>বাকি</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.danger }}>{formatTaka(u.totalBaki)}</div>
          <div style={{ fontSize: 11, color: C.textLight }}>{toBanglaNum(u.baki.filter(b => b.totalOwed > 0).length)} জন</div>
        </div>
        <div style={S.statCard('#fefce8')}>
          <div style={S.statLabel}>খরচ</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.warning }}>{formatTaka(u.totalExpenses)}</div>
        </div>
        <div style={S.statCard('#eef2ff')}>
          <div style={S.statLabel}>পণ্য</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.primary }}>{toBanglaNum(u.totalProducts)}</div>
        </div>
      </div>

      {/* Recent Sales */}
      <div style={S.card}>
        <h3 style={{ color: C.primary, marginBottom: 12, fontSize: 16 }}>🛒 সাম্প্রতিক বিক্রি (শেষ ১০টি)</h3>
        {u.sales.length === 0 ? <p style={{ color: C.textLight }}>কোনো বিক্রি নেই</p> :
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>তারিখ</th><th style={S.th}>পণ্য</th><th style={S.th}>মোট</th><th style={S.th}>নগদ</th><th style={S.th}>বাকি</th>
            </tr></thead>
            <tbody>
              {u.sales.sort((a, b) => {
                const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
                const db2 = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
                return db2 - da;
              }).slice(0, 10).map((s, i) => (
                <tr key={s.id || i}>
                  <td style={S.td}>{timeAgo(s.createdAt)}</td>
                  <td style={S.td}>{(s.items || []).map(it => it.name).join(', ').substring(0, 40)}</td>
                  <td style={S.td}><strong>{formatTaka(s.totalAmount)}</strong></td>
                  <td style={S.td}>{formatTaka(s.paidAmount)}</td>
                  <td style={S.td}>{s.bakiAmount > 0 ? <span style={S.badge('#fef2f2', C.danger)}>{formatTaka(s.bakiAmount)}</span> : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </div>

      {/* Products */}
      <div style={S.card}>
        <h3 style={{ color: C.primary, marginBottom: 12, fontSize: 16 }}>📦 পণ্য তালিকা ({toBanglaNum(u.products.length)})</h3>
        {u.products.length === 0 ? <p style={{ color: C.textLight }}>কোনো পণ্য নেই</p> :
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>নাম</th><th style={S.th}>স্টক</th><th style={S.th}>ক্রয়</th><th style={S.th}>বিক্রয়</th><th style={S.th}>স্টক মূল্য</th>
            </tr></thead>
            <tbody>
              {u.products.slice(0, 20).map(p => (
                <tr key={p.id}>
                  <td style={S.td}>{p.name}</td>
                  <td style={S.td}><span style={S.badge((p.qty || 0) <= 5 ? '#fef2f2' : '#ecfdf5', (p.qty || 0) <= 5 ? C.danger : C.success)}>{toBanglaNum(p.qty || 0)} {p.unit}</span></td>
                  <td style={S.td}>{formatTaka(p.purchasePrice)}</td>
                  <td style={S.td}>{formatTaka(p.sellingPrice)}</td>
                  <td style={S.td}>{formatTaka((p.sellingPrice || 0) * (p.qty || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </div>

      {/* Baki List */}
      {u.baki.filter(b => b.totalOwed > 0).length > 0 && (
        <div style={S.card}>
          <h3 style={{ color: C.danger, marginBottom: 12, fontSize: 16 }}>📒 বাকির তালিকা</h3>
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>কাস্টমার</th><th style={S.th}>ফোন</th><th style={S.th}>বাকি</th><th style={S.th}>আপডেট</th>
            </tr></thead>
            <tbody>
              {u.baki.filter(b => b.totalOwed > 0).sort((a, b) => b.totalOwed - a.totalOwed).map(b => (
                <tr key={b.id}>
                  <td style={S.td}>{b.customerName}</td>
                  <td style={S.td}>{b.customerPhone || '-'}</td>
                  <td style={S.td}><strong style={{ color: C.danger }}>{formatTaka(b.totalOwed)}</strong></td>
                  <td style={S.td}>{timeAgo(b.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // ========== SALES PAGE ==========
  const SalesPage = () => {
    const recentSales = data.allSales.sort((a, b) => {
      const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
      const db2 = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
      return db2 - da;
    }).slice(0, 50);

    return (
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 20 }}>💰 সকল বিক্রি ({toBanglaNum(data.totalSalesCount)})</h2>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={S.statCard('#ecfdf5')}>
            <div style={S.statLabel}>সর্বমোট</div>
            <div style={{ ...S.statValue, color: C.success, fontSize: 22 }}>{formatTaka(data.totalSales)}</div>
          </div>
          <div style={S.statCard('#eef2ff')}>
            <div style={S.statLabel}>আজ</div>
            <div style={{ ...S.statValue, color: C.primary, fontSize: 22 }}>{formatTaka(data.todaySalesTotal)}</div>
          </div>
        </div>

        <div style={{ ...S.card, overflowX: 'auto' }}>
          <h3 style={{ color: C.primary, marginBottom: 12, fontSize: 16 }}>সাম্প্রতিক ৫০টি বিক্রি</h3>
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>সময়</th><th style={S.th}>দোকান</th><th style={S.th}>পণ্য</th><th style={S.th}>মোট</th><th style={S.th}>নগদ</th><th style={S.th}>বাকি</th>
            </tr></thead>
            <tbody>
              {recentSales.map((s, i) => {
                const shop = data.users.find(u => u.uid === s.uid);
                return (
                  <tr key={s.id || i} style={{ background: i % 2 === 0 ? C.white : '#fafafa' }}>
                    <td style={S.td}>{timeAgo(s.createdAt)}</td>
                    <td style={S.td}><span style={{ fontWeight: 600 }}>{shop?.shopName || 'N/A'}</span></td>
                    <td style={S.td}>{(s.items || []).map(it => it.name).join(', ').substring(0, 30)}</td>
                    <td style={S.td}><strong>{formatTaka(s.totalAmount)}</strong></td>
                    <td style={S.td}>{formatTaka(s.paidAmount)}</td>
                    <td style={S.td}>{s.bakiAmount > 0 ? <span style={S.badge('#fef2f2', C.danger)}>{formatTaka(s.bakiAmount)}</span> : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ========== ANALYTICS PAGE ==========
  const AnalyticsPage = () => {
    // Sales by shop type
    const byShopType = {};
    data.users.forEach(u => {
      const t = u.shopType || 'অন্যান্য';
      if (!byShopType[t]) byShopType[t] = { count: 0, sales: 0 };
      byShopType[t].count++;
      byShopType[t].sales += u.totalSales;
    });
    const maxSales = Math.max(...Object.values(byShopType).map(v => v.sales), 1);

    // Top products
    const productSales = {};
    data.allSales.forEach(s => {
      (s.items || []).forEach(it => {
        if (!productSales[it.name]) productSales[it.name] = { qty: 0, revenue: 0 };
        productSales[it.name].qty += (it.qty || 0);
        productSales[it.name].revenue += ((it.price || 0) * (it.qty || 0));
      });
    });
    const topProducts = Object.entries(productSales).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 10);

    return (
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 20 }}>📈 অ্যানালিটিক্স</h2>

        {/* Platform Summary */}
        <div style={S.card}>
          <h3 style={{ color: C.primary, marginBottom: 14, fontSize: 16 }}>🌐 প্ল্যাটফর্ম সারসংক্ষেপ</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <div style={{ padding: 12, background: '#eef2ff', borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.primary }}>{toBanglaNum(data.totalShops)}</div>
              <div style={{ fontSize: 12, color: C.textLight }}>দোকান</div>
            </div>
            <div style={{ padding: 12, background: '#ecfdf5', borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.success }}>{toBanglaNum(data.totalSalesCount)}</div>
              <div style={{ fontSize: 12, color: C.textLight }}>বিক্রি</div>
            </div>
            <div style={{ padding: 12, background: '#fefce8', borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.warning }}>{toBanglaNum(data.totalProducts)}</div>
              <div style={{ fontSize: 12, color: C.textLight }}>পণ্য</div>
            </div>
            <div style={{ padding: 12, background: '#fef2f2', borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.danger }}>{toBanglaNum(data.totalCustomers)}</div>
              <div style={{ fontSize: 12, color: C.textLight }}>কাস্টমার</div>
            </div>
          </div>
        </div>

        {/* Sales by Shop Type */}
        <div style={S.card}>
          <h3 style={{ color: C.primary, marginBottom: 14, fontSize: 16 }}>🏷️ দোকানের ধরন অনুযায়ী বিক্রি</h3>
          {Object.entries(byShopType).sort((a, b) => b[1].sales - a[1].sales).map(([type, val]) => (
            <div key={type} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>{type} ({toBanglaNum(val.count)}টি দোকান)</span>
                <strong style={{ color: C.success }}>{formatTaka(val.sales)}</strong>
              </div>
              <div style={{ background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                <div style={S.bar((val.sales / maxSales) * 100, C.primary)} />
              </div>
            </div>
          ))}
        </div>

        {/* Top Products */}
        <div style={S.card}>
          <h3 style={{ color: C.primary, marginBottom: 14, fontSize: 16 }}>🏆 শীর্ষ পণ্য (রেভিনিউ অনুযায়ী)</h3>
          {topProducts.length === 0 ? <p style={{ color: C.textLight }}>এখনো ডেটা নেই</p> :
            <table style={S.table}>
              <thead><tr>
                <th style={S.th}>#</th><th style={S.th}>পণ্য</th><th style={S.th}>বিক্রি পরিমাণ</th><th style={S.th}>রেভিনিউ</th>
              </tr></thead>
              <tbody>
                {topProducts.map(([name, val], i) => (
                  <tr key={name}>
                    <td style={S.td}>{toBanglaNum(i + 1)}</td>
                    <td style={S.td}><strong>{name}</strong></td>
                    <td style={S.td}>{toBanglaNum(val.qty)}</td>
                    <td style={S.td}><strong style={{ color: C.success }}>{formatTaka(val.revenue)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </div>

        {/* User Engagement */}
        <div style={S.card}>
          <h3 style={{ color: C.primary, marginBottom: 14, fontSize: 16 }}>📊 ইউজার এনগেজমেন্ট</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 12, color: C.textLight }}>সক্রিয় দোকান (বিক্রি আছে)</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.success }}>{toBanglaNum(data.users.filter(u => u.sales.length > 0).length)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.textLight }}>নিষ্ক্রিয় দোকান</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.danger }}>{toBanglaNum(data.users.filter(u => u.sales.length === 0).length)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.textLight }}>গড় বিক্রি/দোকান</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.primary }}>{formatTaka(data.totalShops > 0 ? data.totalSales / data.totalShops : 0)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.textLight }}>গড় পণ্য/দোকান</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.accent }}>{toBanglaNum(data.totalShops > 0 ? Math.round(data.totalProducts / data.totalShops) : 0)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ========== RENDER ==========
  return (
    <div style={S.container}>
      {/* Mobile Header */}
      {isMobile && (
        <div style={{ ...S.header, position: 'sticky', top: 0, zIndex: 999 }}>
          <button onClick={() => setSideOpen(!sideOpen)} style={{ border: 'none', background: 'none', color: C.white, fontSize: 22, cursor: 'pointer' }}>☰</button>
          <span style={{ fontWeight: 700 }}>📒 Munsiji Admin</span>
          <button onClick={loadAllData} style={{ border: 'none', background: 'rgba(255,255,255,0.2)', color: C.white, borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>🔄</button>
        </div>
      )}

      {/* Mobile overlay */}
      {isMobile && sideOpen && <div onClick={() => setSideOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} />}

      <Sidebar />

      {/* Desktop Header */}
      {!isMobile && (
        <div style={{ ...S.header, marginLeft: 240 }}>
          <span style={{ fontWeight: 700, fontSize: 18 }}>
            {menuItems.find(m => m.key === page)?.icon} {menuItems.find(m => m.key === page)?.label}
          </span>
          <button onClick={loadAllData} style={{ ...S.btn('rgba(255,255,255,0.2)'), padding: '8px 16px', fontSize: 13 }}>🔄 রিফ্রেশ</button>
        </div>
      )}

      {/* Content */}
      <div style={isMobile ? { padding: 16 } : S.main}>
        {!isMobile && <div style={{ height: 70 }} />}
        {page === 'dashboard' && <DashboardPage />}
        {page === 'users' && <UsersPage />}
        {page === 'sales' && <SalesPage />}
        {page === 'analytics' && <AnalyticsPage />}
      </div>
    </div>
  );
}
