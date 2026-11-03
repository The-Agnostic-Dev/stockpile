import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { Adjustments } from './pages/Adjustments'
import { Alerts } from './pages/Alerts'
import { Counter } from './pages/Counter'
import { DailyReport } from './pages/DailyReport'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { NewProduct } from './pages/NewProduct'
import { ProductDetail } from './pages/ProductDetail'
import { Products } from './pages/Products'
import { Receipt } from './pages/Receipt'
import { Sales } from './pages/Sales'
import { AuthProvider, useAuth } from './state/AuthContext'
import { ProductsProvider } from './state/ProductsContext'

function RequireStaff({ children }: { children: ReactNode }) {
  const { staff, ready } = useAuth()
  if (!ready) return null
  return staff ? children : <Navigate to="/login" replace />
}

function ManagersOnly({ children }: { children: ReactNode }) {
  const { canManage } = useAuth()
  return canManage ? children : <Navigate to="/" replace />
}

export function App() {
  return (
    <AuthProvider>
      <ProductsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <RequireStaff>
                  <Layout />
                </RequireStaff>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="counter" element={<Counter />} />
              <Route path="products" element={<Products />} />
              <Route path="products/new" element={<ManagersOnly><NewProduct /></ManagersOnly>} />
              <Route path="products/:id" element={<ProductDetail />} />
              <Route path="sales" element={<Sales />} />
              <Route path="sales/:id" element={<Receipt />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="adjustments" element={<ManagersOnly><Adjustments /></ManagersOnly>} />
              <Route path="reports/daily" element={<ManagersOnly><DailyReport /></ManagersOnly>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ProductsProvider>
    </AuthProvider>
  )
}
