import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import { Toaster } from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"
import { useLocation } from "react-router-dom"

export function AppLayout() {
  const location = useLocation()

  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <Toaster position="top-right" />
    </div>
  )
}
