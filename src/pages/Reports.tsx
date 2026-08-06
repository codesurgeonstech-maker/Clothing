import { useState, useMemo, useEffect } from "react"
import { useStore } from "@/store/useStore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Download, Filter, TrendingUp, TrendingDown, AlertTriangle, Percent } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, subDays, isAfter, parseISO } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

const COLORS = ['#4F46E5', '#3B82F6', '#10B981', '#F59E0B', '#64748B', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F43F5E']

export default function Reports() {
  const { bills, products } = useStore()
  const [dateRange, setDateRange] = useState("30") // days
  
  // Sales Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Secondary Tab for Overview
  const [overviewTab, setOverviewTab] = useState("general")

  // --- Filtered Data ---
  const filteredBills = useMemo(() => {
    const cutoffDate = subDays(new Date(), parseInt(dateRange))
    return bills.filter(b => isAfter(parseISO(b.date), cutoffDate)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [bills, dateRange])
  
  const totalPages = Math.ceil(filteredBills.length / itemsPerPage)
  
  const paginatedBills = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredBills.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredBills, currentPage])

  useEffect(() => setCurrentPage(1), [dateRange])

  // --- Analytics Engines ---
  
  const productStats = useMemo(() => {
    const stats: Record<string, { id: string, name: string, brand: string, category: string, material: string, unitsSold: number, revenue: number, profit: number, refunds: number, exchanges: number }> = {}
    
    // Initialize all products to capture Dead Stock
    products.forEach(p => {
      stats[p.id] = { id: p.id, name: p.name, brand: p.brand, category: p.category, material: p.material, unitsSold: 0, revenue: 0, profit: 0, refunds: 0, exchanges: 0 }
    })

    filteredBills.forEach(bill => {
      const isRefunded = bill.status === "Refunded"
      bill.items.forEach(item => {
        if (stats[item.productId]) {
          const product = products.find(p => p.id === item.productId)
          // Defaulting to 60% of price if costPrice is missing for any reason
          const cost = product ? product.costPrice : item.price * 0.6 
          
          if (!isRefunded) {
             stats[item.productId].unitsSold += item.quantity
             stats[item.productId].revenue += item.total
             stats[item.productId].profit += item.total - (cost * item.quantity)
             
             // Mocking some exchanges (e.g. 2% chance per unit sold) just for demonstration as requested
             if (Math.random() > 0.98) stats[item.productId].exchanges += 1
          } else {
             stats[item.productId].refunds += item.quantity
          }
        }
      })
    })

    return Object.values(stats)
  }, [filteredBills, products])

  const totalRevenue = productStats.reduce((sum, p) => sum + p.revenue, 0)

  // Brand Stats
  const brandStats = useMemo(() => {
    const stats: Record<string, { name: string, unitsSold: number, revenue: number, profit: number, refunds: number, totalInteraction: number, exchanges: number }> = {}
    productStats.forEach(p => {
       if (!stats[p.brand]) stats[p.brand] = { name: p.brand, unitsSold: 0, revenue: 0, profit: 0, refunds: 0, totalInteraction: 0, exchanges: 0 }
       stats[p.brand].unitsSold += p.unitsSold
       stats[p.brand].revenue += p.revenue
       stats[p.brand].profit += p.profit
       stats[p.brand].refunds += p.refunds
       stats[p.brand].exchanges += p.exchanges
       stats[p.brand].totalInteraction += (p.unitsSold + p.refunds + p.exchanges)
    })
    return Object.values(stats).filter(b => b.totalInteraction > 0).sort((a,b) => b.revenue - a.revenue)
  }, [productStats])

  // Category Stats
  const categoryStats = useMemo(() => {
    const stats: Record<string, { name: string, unitsSold: number, revenue: number, profit: number }> = {}
    productStats.forEach(p => {
       if (!stats[p.category]) stats[p.category] = { name: p.category, unitsSold: 0, revenue: 0, profit: 0 }
       stats[p.category].unitsSold += p.unitsSold
       stats[p.category].revenue += p.revenue
       stats[p.category].profit += p.profit
    })
    return Object.values(stats).filter(c => c.unitsSold > 0).sort((a,b) => b.revenue - a.revenue)
  }, [productStats])

  // Fabric Stats
  const fabricStats = useMemo(() => {
    const stats: Record<string, { name: string, unitsSold: number, revenue: number, profit: number }> = {}
    productStats.forEach(p => {
       if (!stats[p.material]) stats[p.material] = { name: p.material, unitsSold: 0, revenue: 0, profit: 0 }
       stats[p.material].unitsSold += p.unitsSold
       stats[p.material].revenue += p.revenue
       stats[p.material].profit += p.profit
    })
    return Object.values(stats).filter(f => f.unitsSold > 0).sort((a,b) => b.revenue - a.revenue)
  }, [productStats])


  // Basic Trend Data
  const salesByDate = useMemo(() => {
    const grouped = filteredBills.reduce((acc, bill) => {
      const dateStr = format(parseISO(bill.date), 'MMM dd')
      if (!acc[dateStr]) acc[dateStr] = { name: dateStr, revenue: 0, profit: 0, timestamp: parseISO(bill.date).getTime() }
      acc[dateStr].revenue += bill.total
      acc[dateStr].profit += bill.total * 0.2 // basic mock
      return acc
    }, {} as Record<string, { name: string, revenue: number, profit: number, timestamp: number }>)
    
    return Object.values(grouped).sort((a, b) => a.timestamp - b.timestamp).slice(-14)
  }, [filteredBills])


  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Comprehensive breakdown of store performance.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button><Download className="w-4 h-4 mr-2" /> Export Report</Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white/50 border backdrop-blur-sm p-1 rounded-xl h-12">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 h-9">Overview</TabsTrigger>
          <TabsTrigger value="sales" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 h-9">Sales History</TabsTrigger>
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

          <Tabs value={overviewTab} onValueChange={setOverviewTab} className="w-full">
            <div className="border-b pb-0 mb-6 overflow-x-auto hide-scrollbar">
              <TabsList className="bg-transparent h-10 p-0 justify-start w-max">
                <TabsTrigger value="general" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent data-[state=active]:shadow-none px-6 pb-2.5 pt-2">General Trend</TabsTrigger>
                <TabsTrigger value="products" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent data-[state=active]:shadow-none px-6 pb-2.5 pt-2">Products</TabsTrigger>
                <TabsTrigger value="brands" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent data-[state=active]:shadow-none px-6 pb-2.5 pt-2">Brands</TabsTrigger>
                <TabsTrigger value="categories" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent data-[state=active]:shadow-none px-6 pb-2.5 pt-2">Categories</TabsTrigger>
                <TabsTrigger value="fabrics" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent data-[state=active]:shadow-none px-6 pb-2.5 pt-2">Fabrics</TabsTrigger>
              </TabsList>
            </div>

            {/* General Sub-Tab */}
            <TabsContent value="general" className="space-y-6">
              <Card className="border-none shadow-sm glass">
                <CardHeader>
                  <CardTitle>Revenue vs Profit (Trend)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesByDate} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} tickFormatter={(value) => `₹${(value/1000).toFixed(1)}k`} />
                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{fill: '#EEF2FF'}} />
                        <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={32} name="Revenue" />
                        <Bar dataKey="profit" fill="#10B981" radius={[4, 4, 0, 0]} barSize={32} name="Profit" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products Sub-Tab */}
            <TabsContent value="products" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glass border-none shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Top Selling Product</p>
                        <h4 className="text-lg font-bold line-clamp-1">{[...productStats].sort((a,b) => b.unitsSold - a.unitsSold)[0]?.name || "N/A"}</h4>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass border-none shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                        <TrendingDown className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Lowest Selling Product</p>
                        <h4 className="text-lg font-bold line-clamp-1">{[...productStats].filter(p => p.unitsSold > 0).sort((a,b) => a.unitsSold - b.unitsSold)[0]?.name || "N/A"}</h4>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass border-none shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Dead Stock Items</p>
                        <h4 className="text-2xl font-bold">{productStats.filter(p => p.unitsSold === 0).length}</h4>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass border-none shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                        <Percent className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Highest Margin</p>
                        <h4 className="text-lg font-bold line-clamp-1">{[...productStats].filter(p => p.revenue > 0).sort((a,b) => (b.profit/b.revenue) - (a.profit/a.revenue))[0]?.name || "N/A"}</h4>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass border-none shadow-sm">
                  <CardHeader>
                    <CardTitle>Fast Moving Stock (Top 10)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Units</TableHead>
                            <TableHead className="text-right">Revenue</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...productStats].filter(p => p.unitsSold > 0).sort((a,b) => b.unitsSold - a.unitsSold).slice(0,10).map((p) => (
                            <TableRow key={p.id}>
                              <TableCell className="font-medium">{p.name}</TableCell>
                              <TableCell className="text-right">{p.unitsSold}</TableCell>
                              <TableCell className="text-right text-emerald-600">₹{p.revenue.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="glass border-none shadow-sm">
                  <CardHeader>
                    <CardTitle>Slow Moving Stock (Bottom 10)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Units</TableHead>
                            <TableHead className="text-right">Margin</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...productStats].filter(p => p.unitsSold > 0).sort((a,b) => a.unitsSold - b.unitsSold).slice(0,10).map((p) => (
                            <TableRow key={p.id}>
                              <TableCell className="font-medium">{p.name}</TableCell>
                              <TableCell className="text-right text-amber-600">{p.unitsSold}</TableCell>
                              <TableCell className="text-right">{((p.profit/p.revenue)*100).toFixed(1)}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              <Card className="glass border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Returns & Exchanges Analysis</CardTitle>
                  <CardDescription>Products requiring post-sales support</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Units Sold</TableHead>
                        <TableHead className="text-right">Units Returned</TableHead>
                        <TableHead className="text-right">Units Exchanged</TableHead>
                        <TableHead className="text-right">Issue Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...productStats].filter(p => p.refunds > 0 || p.exchanges > 0).sort((a,b) => (b.refunds + b.exchanges) - (a.refunds + a.exchanges)).slice(0,10).map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-right">{p.unitsSold}</TableCell>
                          <TableCell className="text-right text-red-500">{p.refunds}</TableCell>
                          <TableCell className="text-right text-amber-500">{p.exchanges}</TableCell>
                          <TableCell className="text-right font-bold text-red-600">
                            {p.unitsSold > 0 ? (((p.refunds + p.exchanges)/p.unitsSold)*100).toFixed(1) : 100}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Brands Sub-Tab */}
            <TabsContent value="brands" className="space-y-6">
              <Card className="glass border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Brand Analytics</CardTitle>
                  <CardDescription>Performance breakdown by product brand</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Brand Name</TableHead>
                        <TableHead className="text-right">Units Sold</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                        <TableHead className="text-right">Return %</TableHead>
                        <TableHead className="text-right">Exchange %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {brandStats.map((brand) => (
                        <TableRow key={brand.name}>
                          <TableCell className="font-bold">{brand.name}</TableCell>
                          <TableCell className="text-right">{brand.unitsSold}</TableCell>
                          <TableCell className="text-right">₹{brand.revenue.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-emerald-600">₹{brand.profit.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={brand.profit/brand.revenue > 0.3 ? "default" : "secondary"}>
                              {brand.revenue > 0 ? ((brand.profit/brand.revenue)*100).toFixed(1) : 0}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-red-500">
                            {brand.unitsSold > 0 ? ((brand.refunds/brand.unitsSold)*100).toFixed(1) : 0}%
                          </TableCell>
                          <TableCell className="text-right text-amber-500">
                            {brand.unitsSold > 0 ? ((brand.exchanges/brand.unitsSold)*100).toFixed(1) : 0}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Categories Sub-Tab */}
            <TabsContent value="categories" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="glass border-none shadow-sm lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Sales Contribution</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center">
                    <div className="h-[300px] w-full relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={categoryStats} innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="revenue">
                            {categoryStats.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <RechartsTooltip formatter={(value: any) => `₹${Number(value).toFixed(2)}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass border-none shadow-sm lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Category Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">Profit</TableHead>
                          <TableHead className="text-right">Margin</TableHead>
                          <TableHead className="text-right">Sales %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categoryStats.map((cat) => (
                          <TableRow key={cat.name}>
                            <TableCell className="font-bold">{cat.name}</TableCell>
                            <TableCell className="text-right">₹{cat.revenue.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-emerald-600">₹{cat.profit.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              {cat.revenue > 0 ? ((cat.profit/cat.revenue)*100).toFixed(1) : 0}%
                            </TableCell>
                            <TableCell className="text-right font-bold text-primary">
                              {totalRevenue > 0 ? ((cat.revenue/totalRevenue)*100).toFixed(1) : 0}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Fabrics Sub-Tab */}
            <TabsContent value="fabrics" className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glass border-none shadow-sm">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-muted-foreground">Most Loved Fabric</p>
                    <h4 className="text-xl font-bold mt-1 text-primary">{[...fabricStats].sort((a,b) => b.unitsSold - a.unitsSold)[0]?.name || "N/A"}</h4>
                    <p className="text-xs text-muted-foreground mt-1">Based on units sold</p>
                  </CardContent>
                </Card>
                <Card className="glass border-none shadow-sm">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-muted-foreground">Highest Selling Fabric</p>
                    <h4 className="text-xl font-bold mt-1 text-emerald-600">{[...fabricStats].sort((a,b) => b.revenue - a.revenue)[0]?.name || "N/A"}</h4>
                    <p className="text-xs text-muted-foreground mt-1">Based on total revenue</p>
                  </CardContent>
                </Card>
                <Card className="glass border-none shadow-sm">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-muted-foreground">Highest Profit Fabric</p>
                    <h4 className="text-xl font-bold mt-1 text-blue-600">{[...fabricStats].sort((a,b) => b.profit - a.profit)[0]?.name || "N/A"}</h4>
                    <p className="text-xs text-muted-foreground mt-1">Based on absolute profit</p>
                  </CardContent>
                </Card>
                <Card className="glass border-none shadow-sm">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-muted-foreground">Lowest Selling Fabric</p>
                    <h4 className="text-xl font-bold mt-1 text-red-600">{[...fabricStats].sort((a,b) => a.unitsSold - b.unitsSold)[0]?.name || "N/A"}</h4>
                    <p className="text-xs text-muted-foreground mt-1">Based on units sold</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="glass border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Fabric Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fabric Material</TableHead>
                        <TableHead className="text-right">Units Sold</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fabricStats.map((fab) => (
                        <TableRow key={fab.name}>
                          <TableCell className="font-bold">{fab.name}</TableCell>
                          <TableCell className="text-right">{fab.unitsSold}</TableCell>
                          <TableCell className="text-right">₹{fab.revenue.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-emerald-600">₹{fab.profit.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                             {fab.revenue > 0 ? ((fab.profit/fab.revenue)*100).toFixed(1) : 0}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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

          <Card className="border-none shadow-sm glass overflow-hidden">
            <CardHeader>
              <CardTitle>Sales History Data</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">S.No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBills.map((bill, idx) => (
                    <TableRow key={bill.id}>
                      <TableCell>{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                      <TableCell className="font-medium">{format(parseISO(bill.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{bill.id}</TableCell>
                      <TableCell>{bill.customerName}</TableCell>
                      <TableCell>{bill.paymentMode}</TableCell>
                      <TableCell className="text-right font-medium">₹{bill.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  {filteredBills.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No sales found in this period.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t border-slate-100">
                <span className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredBills.length)} of {filteredBills.length} entries
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}
