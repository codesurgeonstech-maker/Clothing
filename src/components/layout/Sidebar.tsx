import { NavLink } from "react-router-dom"
import { LayoutDashboard, Receipt, Package, Users, BarChart3, PieChart, Settings, Megaphone } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Receipt, label: "Billing / POS", path: "/billing" },
  { icon: Package, label: "Products", path: "/products" },
  { icon: Users, label: "Customers", path: "/customers" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
  // { icon: PieChart, label: "Analytics", path: "/analytics" },
  // { icon: Megaphone, label: "Marketing", path: "/marketing" },
  { icon: Settings, label: "Settings", path: "/settings" },
]

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-white h-screen flex flex-col hidden md:flex sticky top-0 left-0 shadow-sm z-10">
      <div className="h-16 flex items-center px-6 border-b border-border/40">
        <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
            C
          </div>
          CodeSurgeons POS
        </div>
      </div>
      <div className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
          Overview
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-muted-foreground hover:bg-light hover:text-primary"
              )
            }
          >
            <item.icon className={cn("w-5 h-5")} />
            {item.label}
          </NavLink>
        ))}
      </div>
      <div className="p-4 border-t border-border/40">
        <div className="flex items-center gap-3 px-3 py-2 bg-light rounded-xl">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            JD
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">John Doe</p>
            <p className="text-xs text-muted-foreground truncate">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
