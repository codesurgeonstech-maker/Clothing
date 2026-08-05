import { useState, useMemo } from "react"
import { useStore } from "@/store/useStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Download, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, subDays, isAfter, parseISO } from "date-fns"

const COLORS = ['#4F46E5', '#3B82F6', '#10B981', '#F59E0B', '#64748B', '#EC4899', '#8B5CF6']

export default function Reports() {
  const { bills, products } = useStore()
  const [dateRange, setDateRange] = useState("30") // days
  const [categoryFilter, setCategoryFilter] = useState("All")

  // --- Filtered Data ---
  const filteredBills = useMemo(() => {
    const cutoffDate = subDays(new Date(), parseInt(dateRange))
    return bills.filter(b => isAfter(parseISO(b.date), cutoffDate))
  }, [bills, dateRange])

  const filteredProducts = useMemo(() => {
    if (categoryFilter === "All") return products
    return products.filter(p => p.category === categoryFilter)
  }, [products, categoryFilter])

  // --- Overview / Sales Data ---
  const salesByDate = useMemo(() => {
    const grouped = filteredBills.reduce((acc, bill) => {
      const dateStr = format(parseISO(bill.date), 'MMM dd')
      if (!acc[dateStr]) acc[dateStr] = { name: dateStr, revenue: 0, profit: 0, timestamp: parseISO(bill.date).getTime() }
      acc[dateStr].revenue += bill.total
      acc[dateStr].profit += bill.total * 0.2 // Mock profit margin
      return acc
    }, {} as Record<string, { name: string, revenue: number, profit: number, timestamp: number }>)
    
    return Object.values(grouped)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-14)
  }, [filteredBills])

  const salesByMode = useMemo(() => {
    const grouped = filteredBills.reduce((acc, bill) => {
      if (!acc[bill.paymentMode]) acc[bill.paymentMode] = 0
      acc[bill.paymentMode] += bill.total
      return acc
    }, {} as Record<string, number>)
    return Object.entries(grouped).map(([name, value]) => ({ name, value }))
  }, [filteredBills])

  // --- Inventory Data ---
  const stockByCategory = useMemo(() => {
    const grouped = filteredProducts.reduce((acc, p) => {
      if (!acc[p.category]) acc[p.category] = 0
      acc[p.category] += p.stock
      return acc
    }, {} as Record<string, number>)
    return Object.entries(grouped).map(([name, stock]) => ({ name, stock }))
  }, [filteredProducts])

  const stockStatus = useMemo(() => {
    const status = { 'In Stock': 0, 'Low Stock': 0, 'Out of Stock': 0 }
    filteredProducts.forEach(p => {
      if (p.stock === 0) status['Out of Stock']++
      else if (p.stock < 20) status['Low Stock']++
      else status['In Stock']++
    })
    return Object.entries(status).map(([name, value]) => ({ name, value }))
  }, [filteredProducts])

  const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))]

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reports</h1>
          <p className="text-muted-foreground mt-1">Detailed breakdown of sales and inventory.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button><Download className="w-4 h-4 mr-2" /> Export Report</Button>
        </div>
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="bg-white/50 border backdrop-blur-sm p-1 rounded-xl h-12">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 h-9">Overview</TabsTrigger>
          <TabsTrigger value="sales" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 h-9">Sales</TabsTrigger>
          <TabsTrigger value="inventory" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 h-9">Inventory</TabsTrigger>
        </TabsList>
        
        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          <div className="flex items-center gap-4 bg-white/50 p-4 rounded-xl border backdrop-blur-sm">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">Time Range:</span>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 3 Months</SelectItem>
                <SelectItem value="365">Last 1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm glass">
              <CardHeader>
                <CardTitle>Revenue vs Profit (Trend)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesByDate} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} tickFormatter={(value) => `₹${(value/1000).toFixed(1)}k`} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{fill: '#EEF2FF'}}
                      />
                      <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={24} name="Revenue" />
                      <Bar dataKey="profit" fill="#10B981" radius={[4, 4, 0, 0]} barSize={24} name="Profit" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm glass">
              <CardHeader>
                <CardTitle>Sales by Payment Mode</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <div className="h-[300px] w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={salesByMode}
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {salesByMode.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => `₹${value.toFixed(2)}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-slate-900">{filteredBills.length}</span>
                    <span className="text-sm text-muted-foreground">Total Orders</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SALES TAB */}
        <TabsContent value="sales" className="space-y-6">
          <div className="flex items-center gap-4 bg-white/50 p-4 rounded-xl border backdrop-blur-sm">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">Time Range:</span>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 3 Months</SelectItem>
                <SelectItem value="365">Last 1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <Card className="border-none shadow-sm glass">
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesByDate} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} tickFormatter={(value) => `₹${(value/1000).toFixed(1)}k`} />
                      <RechartsTooltip cursor={{fill: '#EEF2FF'}} />
                      <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={24} name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm glass">
              <CardHeader>
                <CardTitle>Sales by Mode</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <div className="h-[250px] w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={salesByMode} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                        {salesByMode.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm glass overflow-hidden">
            <CardHeader>
              <CardTitle>Recent Sales Details</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.slice(0, 10).map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-medium">{format(parseISO(bill.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{bill.id}</TableCell>
                      <TableCell>{bill.customerName}</TableCell>
                      <TableCell>{bill.paymentMode}</TableCell>
                      <TableCell className="text-right font-medium">₹{bill.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  {filteredBills.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No sales found in this period.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* INVENTORY TAB */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="flex items-center gap-4 bg-white/50 p-4 rounded-xl border backdrop-blur-sm">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">Category:</span>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                   <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <Card className="border-none shadow-sm glass">
              <CardHeader>
                <CardTitle>Stock by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockByCategory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                      <RechartsTooltip cursor={{fill: '#EEF2FF'}} />
                      <Bar dataKey="stock" fill="#10B981" radius={[4, 4, 0, 0]} barSize={24} name="Units in Stock" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm glass">
              <CardHeader>
                <CardTitle>Stock Status</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <div className="h-[250px] w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stockStatus} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                        {stockStatus.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm glass overflow-hidden">
            <CardHeader>
              <CardTitle>Inventory List</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.slice(0, 15).map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.barcode}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="text-right font-medium">₹{product.price}</TableCell>
                      <TableCell className={`text-right font-bold ${product.stock < 20 ? 'text-destructive' : 'text-emerald-600'}`}>
                        {product.stock}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No products found in this category.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
