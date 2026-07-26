import { useState } from 'react'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../firebase.js'

export default function Login() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const googleLogin = async () => {
    setError('')
    setBusy(true)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      // সফল হলে App.jsx-এর onAuthStateChanged নিজেই পরের স্ক্রিনে নিয়ে যাবে
    } catch (e) {
      console.error(e)
      if (e.code === 'auth/popup-closed-by-user') {
        setError('লগইন মাঝপথে বন্ধ হয়ে গেছে — আবার চেষ্টা করো')
      } else if (e.code === 'auth/unauthorized-domain') {
        setError('এই ঠিকানাটা Firebase-এ অনুমোদিত নয় — Authorized domains-এ যোগ করতে হবে')
      } else {
        setError('লগইন করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করো।')
      }
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
            <div className="brand-tag">ফার্মেসীর পুরো হিসাব, এক জায়গায়</div>
          </div>
        </div>
        <div className="strip-motif" aria-hidden="true">
          <span /><span /><span /><span /><span />
        </div>
        <h1>শুরু করতে লগইন করো</h1>
        <p>তোমার Google (Gmail) অ্যাকাউন্ট দিয়েই হবে — আলাদা পাসওয়ার্ড মনে রাখতে হবে না</p>
      </div>

      <div className="card">
        {error && <div className="error-box">{error}</div>}
        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          onClick={googleLogin}
          disabled={busy}
        >
          {busy ? 'লগইন হচ্ছে…' : (
            <>
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.2 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.2 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C41.4 35.4 44 30.2 44 24c0-1.3-.1-2.6-.4-3.9z"/>
              </svg>
              Google দিয়ে লগইন করো
            </>
          )}
        </button>
        <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', textAlign: 'center', marginTop: 12 }}>
          সম্পূর্ণ ফ্রি — কোনো SMS বা কার্ড লাগে না
        </div>
      </div>
    </div>
  )
}
