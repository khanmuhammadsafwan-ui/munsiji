// বক্স → পাতা → পিস হিসাব, বাংলা সংখ্যা, মেয়াদ স্ট্যাটাস

const BN = '০১২৩৪৫৬৭৮৯'

export const toBn = (n) =>
  String(n).replace(/[0-9]/g, (d) => BN[d])

export const toBnMoney = (n) =>
  '৳ ' + toBn(Number(n || 0).toLocaleString('en-IN'))

// বক্স/পাতা/পিস → মোট পিস
export function toPieces({ box = 0, strip = 0, piece = 0 }, piecesPerStrip, stripsPerBox) {
  return (
    Number(box || 0) * Number(stripsPerBox || 1) * Number(piecesPerStrip || 1) +
    Number(strip || 0) * Number(piecesPerStrip || 1) +
    Number(piece || 0)
  )
}

// মোট পিস → "২ বক্স ৩ পাতা ৫ পিস"
export function formatQty(totalPieces, piecesPerStrip = 1, stripsPerBox = 1) {
  let rest = Number(totalPieces || 0)
  const pps = Math.max(1, Number(piecesPerStrip || 1))
  const spb = Math.max(1, Number(stripsPerBox || 1))
  const perBox = pps * spb
  const box = Math.floor(rest / perBox)
  rest -= box * perBox
  const strip = Math.floor(rest / pps)
  const piece = rest - strip * pps
  const parts = []
  if (box) parts.push(`${toBn(box)} বক্স`)
  if (strip) parts.push(`${toBn(strip)} পাতা`)
  if (piece || parts.length === 0) parts.push(`${toBn(piece)} পিস`)
  return parts.join(' ')
}

// মেয়াদ: 'expired' | 'soon' (৯০ দিনের মধ্যে) | 'ok'
// expiry ফরম্যাট: "YYYY-MM" (মাসের শেষ দিন পর্যন্ত মেয়াদ ধরা হয়)
export function expiryStatus(expiry) {
  if (!expiry) return 'ok'
  const [y, m] = expiry.split('-').map(Number)
  if (!y || !m) return 'ok'
  const endOfMonth = new Date(y, m, 0, 23, 59, 59)
  const now = new Date()
  if (endOfMonth < now) return 'expired'
  const days = (endOfMonth - now) / (1000 * 60 * 60 * 24)
  return days <= 90 ? 'soon' : 'ok'
}

// একাধিক ব্যাচের মধ্যে সবচেয়ে খারাপ স্ট্যাটাস
export function worstExpiry(batches = []) {
  let worst = 'ok'
  for (const b of batches) {
    if (Number(b.qty) <= 0) continue
    const st = expiryStatus(b.expiry)
    if (st === 'expired') return 'expired'
    if (st === 'soon') worst = 'soon'
  }
  return worst
}

// "YYYY-MM" → "জুন ২০২৭"
const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']
export function formatExpiry(expiry) {
  if (!expiry) return '—'
  const [y, m] = expiry.split('-').map(Number)
  if (!y || !m) return expiry
  return `${BN_MONTHS[m - 1]} ${toBn(y)}`
}
