// ============================================================
// বাংলা ভয়েস সেল — উচ্চারণ থেকে ওষুধ ও পরিমাণ বোঝা
// "নাপা দুই পাতা", "সেকলো এক ফাইল", "ফেক্সো ৫ পিস"
// ============================================================

// বাংলা → মোটামুটি ল্যাটিন ট্রান্সলিটারেশন (ব্র্যান্ড ম্যাচিংয়ের জন্য)
const CONS = {
  'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
  'চ': 'c', 'ছ': 'ch', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
  'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
  'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
  'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
  'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 's', 'ষ': 's',
  'স': 's', 'হ': 'h', 'ড়': 'r', 'ঢ়': 'r', 'য়': 'y', 'ৎ': 't',
  'ং': 'ng', 'ঃ': 'h', 'ঁ': '',
}
const VOWELS = {
  'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u',
  'ঋ': 'ri', 'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
  'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'ri',
  'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou', '্': '',
}
const BN_DIGITS = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' }

export function bnToLatin(text) {
  let out = ''
  for (const ch of text) {
    if (CONS[ch] !== undefined) out += CONS[ch]
    else if (VOWELS[ch] !== undefined) out += VOWELS[ch]
    else if (BN_DIGITS[ch] !== undefined) out += BN_DIGITS[ch]
    else out += ch
  }
  return out.toLowerCase()
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

function levenshtein(a, b) {
  const m = a.length, n = b.length
  if (!m) return n
  if (!n) return m
  const row = Array.from({ length: n + 1 }, (_, i) => i)
  for (let i = 1; i <= m; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= n; j++) {
      const tmp = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return row[n]
}

// একটা শব্দ কোনো স্টক আইটেমের সাথে মেলে কিনা
function matchScore(word, item) {
  const w = norm(bnToLatin(word))
  if (w.length < 2) return Infinity
  const candidates = [norm(item.brand), norm(item.generic || '')]
  let best = Infinity
  for (const c of candidates) {
    if (!c) continue
    // পুরো নাম বা নামের শুরুর অংশের সাথে তুলনা
    const target = c.slice(0, Math.max(w.length, 3))
    const d = levenshtein(w, target)
    const full = levenshtein(w, c)
    best = Math.min(best, d, full)
  }
  return best
}

// সংখ্যা-শব্দ
const NUM_WORDS = {
  'এক': 1, 'দুই': 2, 'তিন': 3, 'চার': 4, 'পাঁচ': 5, 'পাচ': 5,
  'ছয়': 6, 'ছয়': 6, 'সাত': 7, 'আট': 8, 'নয়': 9, 'নয়': 9,
  'দশ': 10, 'বারো': 12, 'পনেরো': 15, 'বিশ': 20, 'অর্ধেক': 0.5,
}
// ইউনিট-শব্দ (দোকানে "ফাইল" মানেও পাতা)
const UNIT_WORDS = {
  'পাতা': 'strip', 'পাত': 'strip', 'ফাইল': 'strip', 'স্ট্রিপ': 'strip',
  'পিস': 'piece', 'পিছ': 'piece', 'টা': 'piece', 'টি': 'piece',
  'বক্স': 'box', 'বাক্স': 'box', 'বোতল': 'piece', 'ফাইলটা': 'strip',
}

function parseNumber(token) {
  const t = token.replace(/[০-৯]/g, (d) => BN_DIGITS[d])
  if (/^\d+$/.test(t)) return parseInt(t, 10)
  return NUM_WORDS[token] ?? null
}

// মূল ফাংশন: কথার টেক্সট + স্টক লিস্ট → { item, qty: {box, strip, piece} }
export function parseSaleUtterance(text, stockItems) {
  const tokens = text.trim().split(/\s+/)
  const qty = { box: 0, strip: 0, piece: 0 }
  const nameTokens = []

  for (let i = 0; i < tokens.length; i++) {
    const n = parseNumber(tokens[i])
    if (n !== null) {
      const unit = UNIT_WORDS[tokens[i + 1]] || null
      if (unit) { qty[unit] += n; i++ }
      else qty.piece += n
      continue
    }
    if (UNIT_WORDS[tokens[i]]) {
      // "পাতা" একা এলে ১ ধরা
      qty[UNIT_WORDS[tokens[i]]] += 1
      continue
    }
    nameTokens.push(tokens[i])
  }

  // নামের শব্দগুলো দিয়ে সবচেয়ে কাছের স্টক আইটেম খোঁজা
  let bestItem = null
  let bestScore = Infinity
  for (const item of stockItems) {
    for (const w of nameTokens) {
      const s = matchScore(w, item)
      if (s < bestScore) { bestScore = s; bestItem = item }
    }
    // পরপর দুই শব্দ মিলিয়েও দেখা ("নাপা এক্সট্রা")
    for (let i = 0; i + 1 < nameTokens.length; i++) {
      const s = matchScore(nameTokens[i] + nameTokens[i + 1], item)
      if (s < bestScore) { bestScore = s; bestItem = item }
    }
  }

  const threshold = 2
  return {
    item: bestScore <= threshold ? bestItem : null,
    qty,
    heard: text,
  }
}
