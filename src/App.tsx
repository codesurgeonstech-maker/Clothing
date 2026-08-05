import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AppLayout } from "./components/layout/AppLayout"
import Dashboard from "./pages/Dashboard"
import Billing from "./pages/Billing"
import Products from "./pages/Products"
import Customers from "./pages/Customers"
import Reports from "./pages/Reports"
import Analytics from "./pages/Analytics"
import Marketing from "./pages/Marketing"
import Settings from "./pages/Settings"

import { Smartphone } from "lucide-react"

function App() {
  return (
    <>
      {/* Mobile Blocker Overlay */}
      <div className="md:hidden fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <Smartphone className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Desktop Only</h1>
        <p className="text-slate-500">
          CodeSurgeons POS is designed for tablets and desktop screens. Please open this application on a larger screen.
        </p>
      </div>

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="billing" element={<Billing />} />
            <Route path="products" element={<Products />} />
            <Route path="customers" element={<Customers />} />
            <Route path="reports" element={<Reports />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="marketing" element={<Marketing />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
