import { db } from './firebase';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs,
  query, where, orderBy, limit, onSnapshot, serverTimestamp, Timestamp,
  increment, writeBatch, setDoc
} from 'firebase/firestore';

// ========== SHOP ==========
export async function createShop(uid, data) {
  await setDoc(doc(db, 'shops', uid), { ...data, uid, createdAt: serverTimestamp() });
}
export async function getShop(uid) {
  const snap = await getDoc(doc(db, 'shops', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
export async function updateShop(uid, data) {
  await updateDoc(doc(db, 'shops', uid), data);
}

// ========== PRODUCTS ==========
export async function addProduct(uid, data) {
  return addDoc(collection(db, 'products'), { ...data, uid, createdAt: serverTimestamp() });
}
export async function getProducts(uid) {
  const q = query(collection(db, 'products'), where('uid', '==', uid), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function updateProduct(id, data) {
  await updateDoc(doc(db, 'products', id), data);
}
export async function deleteProduct(id) {
  await deleteDoc(doc(db, 'products', id));
}

// ========== SALES ==========
export async function createSale(uid, saleData) {
  const batch = writeBatch(db);
  const saleRef = doc(collection(db, 'sales'));
  batch.set(saleRef, { ...saleData, uid, createdAt: serverTimestamp() });

  // Update product quantities
  for (const item of saleData.items) {
    if (item.productId) {
      const prodRef = doc(db, 'products', item.productId);
      batch.update(prodRef, { qty: increment(-item.qty) });
    }
  }

  // If baki, create/update baki record
  if (saleData.bakiAmount > 0 && saleData.customerName) {
    const bakiQ = query(collection(db, 'baki'), where('uid', '==', uid), where('customerPhone', '==', saleData.customerPhone || ''));
    const bakiSnap = await getDocs(bakiQ);
    if (bakiSnap.empty) {
      const bakiRef = doc(collection(db, 'baki'));
      batch.set(bakiRef, {
        uid, customerName: saleData.customerName, customerPhone: saleData.customerPhone || '',
        totalOwed: saleData.bakiAmount, payments: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp()
      });
    } else {
      const existing = bakiSnap.docs[0];
      batch.update(existing.ref, { totalOwed: increment(saleData.bakiAmount), updatedAt: serverTimestamp() });
    }
  }

  await batch.commit();
  return saleRef.id;
}

export async function getTodaySales(uid) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const q = query(collection(db, 'sales'), where('uid', '==', uid), where('createdAt', '>=', Timestamp.fromDate(today)), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getSales(uid, startDate, endDate) {
  const q = query(collection(db, 'sales'), where('uid', '==', uid),
    where('createdAt', '>=', Timestamp.fromDate(startDate)),
    where('createdAt', '<=', Timestamp.fromDate(endDate)),
    orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ========== BAKI (Credit) ==========
export async function getBakiList(uid) {
  const q = query(collection(db, 'baki'), where('uid', '==', uid), orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function recordBakiPayment(bakiId, amount) {
  const ref = doc(db, 'baki', bakiId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const payments = data.payments || [];
  payments.push({ amount, date: new Date().toISOString() });
  const newTotal = Math.max(0, (data.totalOwed || 0) - amount);
  await updateDoc(ref, { totalOwed: newTotal, payments, updatedAt: serverTimestamp() });
}

export async function deleteBaki(id) {
  await deleteDoc(doc(db, 'baki', id));
}

// ========== CUSTOMERS & SUPPLIERS ==========
export async function getCustomers(uid) {
  const q = query(collection(db, 'customers'), where('uid', '==', uid), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function addCustomer(uid, data) {
  return addDoc(collection(db, 'customers'), { ...data, uid, type: data.type || 'customer', createdAt: serverTimestamp() });
}
export async function updateCustomer(id, data) {
  await updateDoc(doc(db, 'customers', id), data);
}
export async function deleteCustomer(id) {
  await deleteDoc(doc(db, 'customers', id));
}
export function onCustomersChange(uid, callback) {
  const q = query(collection(db, 'customers'), where('uid', '==', uid));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ========== EXPENSES ==========
export async function addExpense(uid, data) {
  return addDoc(collection(db, 'expenses'), { ...data, uid, createdAt: serverTimestamp() });
}
export async function getExpenses(uid, startDate, endDate) {
  const q = query(collection(db, 'expenses'), where('uid', '==', uid),
    where('createdAt', '>=', Timestamp.fromDate(startDate)),
    where('createdAt', '<=', Timestamp.fromDate(endDate)),
    orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function getTodayExpenses(uid) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const q = query(collection(db, 'expenses'), where('uid', '==', uid),
    where('createdAt', '>=', Timestamp.fromDate(today)), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function deleteExpense(id) {
  await deleteDoc(doc(db, 'expenses', id));
}
export function onExpensesChange(uid, callback) {
  const q = query(collection(db, 'expenses'), where('uid', '==', uid));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ========== CASH BOOK ==========
export async function getCashBookEntry(uid, dateStr) {
  const snap = await getDoc(doc(db, 'cashbook', `${uid}_${dateStr}`));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
export async function saveCashBookEntry(uid, dateStr, data) {
  await setDoc(doc(db, 'cashbook', `${uid}_${dateStr}`), { ...data, uid, date: dateStr, updatedAt: serverTimestamp() });
}
export async function getCashBookRange(uid, startDate, endDate) {
  const q = query(collection(db, 'cashbook'), where('uid', '==', uid),
    where('date', '>=', startDate), where('date', '<=', endDate), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ========== REPORTS ==========
export async function getReportData(uid, startDate, endDate) {
  const [sales, expenses] = await Promise.all([
    getSales(uid, startDate, endDate),
    getExpenses(uid, startDate, endDate)
  ]);
  const totalSales = sales.reduce((s, x) => s + (x.totalAmount || 0), 0);
  const totalCash = sales.reduce((s, x) => s + (x.paidAmount || 0), 0);
  const totalBakiGiven = sales.reduce((s, x) => s + (x.bakiAmount || 0), 0);
  const totalExpenses = expenses.reduce((s, x) => s + (x.amount || 0), 0);
  const totalCost = sales.reduce((s, x) => s + (x.items || []).reduce((c, it) => c + ((it.costPrice || 0) * (it.qty || 0)), 0), 0);
  const grossProfit = totalSales - totalCost;
  const netProfit = grossProfit - totalExpenses;
  // Group sales by day
  const dailySales = {};
  sales.forEach(s => {
    const d = s.createdAt?.toDate ? s.createdAt.toDate().toLocaleDateString('bn-BD') : 'N/A';
    dailySales[d] = (dailySales[d] || 0) + (s.totalAmount || 0);
  });
  // Group expenses by category
  const expensesByCategory = {};
  expenses.forEach(e => {
    expensesByCategory[e.category || 'অন্যান্য'] = (expensesByCategory[e.category || 'অন্যান্য'] || 0) + (e.amount || 0);
  });
  return { totalSales, totalCash, totalBakiGiven, totalExpenses, totalCost, grossProfit, netProfit,
    salesCount: sales.length, expenseCount: expenses.length, dailySales, expensesByCategory, sales, expenses };
}

// ========== DASHBOARD AGGREGATION ==========
export async function getDashboardData(uid) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [products, todaySales, bakiList] = await Promise.all([
    getProducts(uid),
    getTodaySales(uid),
    getBakiList(uid)
  ]);

  const totalStockValue = products.reduce((sum, p) => sum + ((p.sellingPrice || 0) * (p.qty || 0)), 0);
  const totalStockCost = products.reduce((sum, p) => sum + ((p.purchasePrice || 0) * (p.qty || 0)), 0);
  const lowStockItems = products.filter(p => (p.qty || 0) <= (p.lowStockAlert || 5));
  const todayTotal = todaySales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const todayCash = todaySales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  const todayBaki = todaySales.reduce((sum, s) => sum + (s.bakiAmount || 0), 0);
  const totalBaki = bakiList.reduce((sum, b) => sum + (b.totalOwed || 0), 0);
  const totalProducts = products.length;
  const totalSalesCount = todaySales.length;

  return {
    totalStockValue, totalStockCost, lowStockItems, todayTotal, todayCash,
    todayBaki, totalBaki, totalProducts, totalSalesCount, products, todaySales, bakiList
  };
}

// ========== REALTIME LISTENERS ==========
export function onProductsChange(uid, callback) {
  const q = query(collection(db, 'products'), where('uid', '==', uid));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export function onBakiChange(uid, callback) {
  const q = query(collection(db, 'baki'), where('uid', '==', uid));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
