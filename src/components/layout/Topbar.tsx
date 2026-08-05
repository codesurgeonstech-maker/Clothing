import { Bell, Search, Menu } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function Topbar() {
  return (
    <header className="h-16 border-b bg-white/70 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
        <div className="relative max-w-md w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search customers, bills, or products... (Ctrl+K)" 
            className="pl-9 bg-light/50 border-none focus-visible:ring-1 focus-visible:ring-primary h-10 rounded-xl"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-white"></span>
        </Button>
      </div>
    </header>
  )
}
