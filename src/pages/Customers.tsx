import { useState } from "react"
import { useStore } from "@/store/useStore"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, MessageCircle, Edit, Trash2 } from "lucide-react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import toast from "react-hot-toast"
import type { Customer } from "@/data/mockData"

export default function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useStore()
  const [searchTerm, setSearchTerm] = useState("")

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  )

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const handleCreateCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    addCustomer({
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      whatsapp: formData.get("whatsapp") as string,
      email: formData.get("email") as string,
      birthday: new Date().toISOString(),
      favoriteCategory: "Shirts",
      favoriteColor: "Blue",
    })
    toast.success("Customer created successfully")
    setIsCreateOpen(false)
  }

  const handleEditCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedCustomer) return
    const formData = new FormData(e.currentTarget)
    updateCustomer(selectedCustomer.id, {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      whatsapp: formData.get("whatsapp") as string,
      email: formData.get("email") as string,
    })
    toast.success("Customer updated successfully")
    setIsEditOpen(false)
  }

  const handleDeleteCustomer = () => {
    if (!selectedCustomer) return
    deleteCustomer(selectedCustomer.id)
    toast.success("Customer deleted successfully")
    setIsDeleteOpen(false)
  }

  const openEdit = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsEditOpen(true)
  }

  const openDelete = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDeleteOpen(true)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your customer relationships and loyalty.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Customer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-none shadow-sm glass bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Customers</h3>
            <div className="text-3xl font-bold text-slate-900">{customers.length}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm glass bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Repeat Rate</h3>
            <div className="text-3xl font-bold text-slate-900">
              {Math.round((customers.filter(c => c.repeatCustomer).length / customers.length) * 100)}%
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm glass bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Avg. Spent / Customer</h3>
            <div className="text-3xl font-bold text-slate-900">
              ₹{Math.round(customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm glass">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search by name or phone..."
                className="pl-9 h-10 bg-white"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full rounded-md border bg-white/50">
            <Table className="w-full min-w-[1100px]">
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-[60px]">S. No</TableHead>
                  <TableHead className="w-[250px]">Customer</TableHead>
                  <TableHead className="w-[200px]">Contact</TableHead>
                  <TableHead className="w-[150px]">Loyalty Points</TableHead>
                  <TableHead className="w-[150px]">Total Spent</TableHead>
                  <TableHead className="w-[150px]">Preferences</TableHead>
                  <TableHead className="text-right w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.map((customer, index) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium text-muted-foreground">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 flex items-center gap-2">
                            {customer.name}
                            {customer.repeatCustomer && (
                              <Badge variant="secondary" className="h-4 text-[10px] px-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Repeat</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">ID: {customer.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{customer.phone}</div>
                      <div className="text-xs text-muted-foreground">{customer.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-amber-600">{customer.loyaltyPoints} pts</div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ₹{customer.totalSpent.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="bg-white text-xs">{customer.favoriteCategory}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#25D366] hover:text-[#25D366] hover:bg-[#25D366]/10"
                        title="WhatsApp Chat"
                        onClick={() => window.open(`https://wa.me/${customer.whatsapp.replace(/\D/g, '')}`, '_blank')}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Edit"
                        onClick={() => openEdit(customer)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete"
                        onClick={() => openDelete(customer)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 pb-2 px-2 gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {filteredCustomers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} entries
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="text-sm font-medium">
                Page {currentPage} of {totalPages || 1}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CREATE CUSTOMER DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCustomer} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input name="name" placeholder="Enter customer name" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input name="phone" placeholder="Phone number" required />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input name="whatsapp" placeholder="WhatsApp number" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input name="email" type="email" placeholder="Email address" />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit">Create Customer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT CUSTOMER DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditCustomer} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input name="name" defaultValue={selectedCustomer?.name} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input name="phone" defaultValue={selectedCustomer?.phone} required />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input name="whatsapp" defaultValue={selectedCustomer?.whatsapp} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input name="email" type="email" defaultValue={selectedCustomer?.email} />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete <strong>{selectedCustomer?.name}</strong>? This action cannot be undone.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteCustomer}>Delete Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
