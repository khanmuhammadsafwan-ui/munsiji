import { NavLink } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase.js'

const navItems = [
  { to: '/', icon: '🏠', label: 'হোম' },
  { to: '/sell', icon: '🧾', label: 'বিক্রি' },
  { to: '/stock', icon: '💊', label: 'স্টক' },
  { to: '/baki', icon: '📒', label: 'বাকি' },
]

export default function AppShell({ shop, children }) {
  return (
    <>
      <header className="app-header">
        <div>
          <div className="shop-name">{shop.name}</div>
          <div className="shop-sub">{shop.area || 'ফার্মেসী'} · {shop.owner}</div>
        </div>
        <button
          className="btn btn-ghost"
          style={{ borderColor: 'rgba(255,255,255,.35)', color: '#fff', minHeight: 40, padding: '6px 14px', fontSize: 14 }}
          onClick={() => signOut(auth)}
        >
          বের হও
        </button>
      </header>

      <main className="app-body">{children}</main>

      <nav className="bottom-nav" aria-label="মূল নেভিগেশন">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span className="icon" aria-hidden="true">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
