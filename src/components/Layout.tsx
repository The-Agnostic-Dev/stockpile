import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../state/AuthContext'

const ROLE_LABELS = { owner: 'Owner', manager: 'Store manager', counter: 'Counter' } as const

export function Layout() {
  const { staff, signOut, canManage } = useAuth()
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">S</span>
          <div>
            <strong>Stockpile</strong>
            <small>Mama Ngozi Pharmacy &amp; Provisions</small>
          </div>
        </div>
        <nav className="nav">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/counter">Counter</NavLink>
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/sales">Sales</NavLink>
          <NavLink to="/alerts">Alerts</NavLink>
          {canManage && <NavLink to="/adjustments">Adjustments</NavLink>}
          {canManage && <NavLink to="/reports/daily">Daily report</NavLink>}
        </nav>
        <div className="who">
          <span>
            {staff?.name} <small>{staff && ROLE_LABELS[staff.role]}</small>
          </span>
          <button className="link" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
