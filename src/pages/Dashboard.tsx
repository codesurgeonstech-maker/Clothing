import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/store/useStore"
import { IndianRupee, Users, ShoppingBag, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts'
import { format, subDays, isSameDay } from 'date-fns'

export default function Dashboard() {
  const { bills, customers, products } = useStore()

  const { totalRevenue, todayRevenue, chartData, recentBills } = useMemo(() => {
    // 1. Sort bills by date descending
    const sortedBills = [...bills].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    // 2. Total Revenue
    const totalRev = sortedBills.reduce((acc, bill) => acc + bill.total, 0)
    
    // 3. Today's Revenue
    const today = new Date()
    const todayRev = sortedBills
      .filter(bill => isSameDay(new Date(bill.date), today))
      .reduce((acc, bill) => acc + bill.total, 0)
      
    // 4. Last 7 Days Chart Data
    const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(today, 6 - i))
    const chart = last7Days.map(date => {
      const dailyBills = sortedBills.filter(b => isSameDay(new Date(b.date), date))
      const dailySales = dailyBills.reduce((acc, b) => acc + b.total, 0)
      return {
        name: format(date, 'EEE'),
        sales: dailySales,
      }
    })
    
    return {
      totalRevenue: totalRev,
      todayRevenue: todayRev,
      chartData: chart,
      recentBills: sortedBills.slice(0, 5)
    }
  }, [bills])

  const kpis = [
    { title: "Today's Sales", value: `₹${todayRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: IndianRupee, trend: "Live", positive: true },
    { title: "Total Revenue", value: `₹${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: IndianRupee, trend: "Overall", positive: true },
    { title: "Total Customers", value: customers.length, icon: Users, trend: "Database", positive: true },
    { title: "Total Products", value: products.length, icon: ShoppingBag, trend: "Catalog", positive: true },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your store today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <Card key={i} className="border-none shadow-sm glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <kpi.icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className={`text-xs mt-1 flex items-center ${kpi.positive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {kpi.positive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {kpi.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 border-none shadow-sm glass">
          <CardHeader>
            <CardTitle>Revenue Overview (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} tickFormatter={(value) => `₹${value}`} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Sales']}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm glass">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {recentBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                      {bill.customerName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{bill.customerName === "Walk-in Customer" ? "Walk-in" : bill.customerName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[11px] font-mono text-slate-400">{bill.id}</p>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <p className="text-[11px] text-slate-500">{format(new Date(bill.date), 'MMM d, h:mm a')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="font-bold text-sm text-emerald-600">
                      +₹{bill.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] uppercase font-bold tracking-wider mt-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {bill.paymentMode}
                    </div>
                  </div>
                </div>
              ))}
              {recentBills.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  No recent transactions
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
