import { useState, useMemo } from "react"
import { useStore } from "@/store/useStore"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit2, Trash2, Download } from "lucide-react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import toast from "react-hot-toast"
import type { Product } from "@/data/mockData"

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct } = useStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("All")

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(products.map(p => p.category)))]
  }, [products])

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.barcode.includes(searchTerm) ||
                          p.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val)
    setCurrentPage(1)
  }

  const handleCreateProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    addProduct({
      name: formData.get("name") as string,
      barcode: formData.get("barcode") as string,
      category: formData.get("category") as any,
      price: Number(formData.get("price")),
      stock: Number(formData.get("stock")),
      brand: "Generic",
      material: "Cotton",
      size: "M",
      color: "Black",
      costPrice: Number(formData.get("price")) * 0.6
    })
    toast.success("Product created successfully")
    setIsCreateOpen(false)
  }

  const handleEditProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedProduct) return
    const formData = new FormData(e.currentTarget)
    updateProduct(selectedProduct.id, {
      name: formData.get("name") as string,
      barcode: formData.get("barcode") as string,
      category: formData.get("category") as any,
      price: Number(formData.get("price")),
      stock: Number(formData.get("stock")),
    })
    toast.success("Product updated successfully")
    setIsEditOpen(false)
  }

  const handleDeleteProduct = () => {
    if (!selectedProduct) return
    deleteProduct(selectedProduct.id)
    toast.success("Product deleted successfully")
    setIsDeleteOpen(false)
  }

  const openEdit = (product: Product) => {
    setSelectedProduct(product)
    setIsEditOpen(true)
  }

  const openDelete = (product: Product) => {
    setSelectedProduct(product)
    setIsDeleteOpen(true)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your inventory, pricing, and stock levels.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline"><Download className="w-4 h-4 mr-2"/> Export</Button>
          <Button onClick={() => setIsCreateOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Product</Button>
        </div>
      </div>

      <Card className="border-none shadow-sm glass">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search products, barcode, category..." 
                className="pl-9 h-10 bg-white"
              />
            </div>
            <div className="flex w-full sm:w-[200px]">
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full rounded-md border bg-white/50">
            <Table className="w-full min-w-[1100px]">
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-[60px]">S. No</TableHead>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead className="w-[300px]">Product details</TableHead>
                  <TableHead className="w-[150px]">Category</TableHead>
                  <TableHead className="w-[150px]">Price</TableHead>
                  <TableHead className="w-[150px]">Stock</TableHead>
                  <TableHead className="text-right w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product, index) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium text-muted-foreground">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="w-10 h-10 rounded bg-light flex items-center justify-center text-primary font-bold text-xs">
                        {product.name.charAt(0)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">{product.name}</div>
                      <div className="text-xs text-muted-foreground flex gap-2 mt-1">
                        <span>{product.barcode}</span>
                        <span>•</span>
                        <span>{product.brand}</span>
                        <span>•</span>
                        <span>{product.color}, {product.size}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal bg-primary/10 text-primary hover:bg-primary/20">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">₹{product.price}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${product.stock > 20 ? 'bg-emerald-500' : product.stock > 0 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                        <span>{product.stock} in stock</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Edit"
                        onClick={() => openEdit(product)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete"
                        onClick={() => openDelete(product)}
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
               Showing {filteredProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
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

      {/* CREATE PRODUCT DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProduct} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input name="name" placeholder="Enter product name" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Barcode</Label>
                <Input name="barcode" placeholder="Barcode" required />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input name="category" placeholder="Category" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input name="price" type="number" placeholder="Price" required />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input name="stock" type="number" placeholder="Stock level" required />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit">Create Product</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT PRODUCT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditProduct} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input name="name" defaultValue={selectedProduct?.name} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Barcode</Label>
                <Input name="barcode" defaultValue={selectedProduct?.barcode} required />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input name="category" defaultValue={selectedProduct?.category} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input name="price" type="number" defaultValue={selectedProduct?.price} required />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input name="stock" type="number" defaultValue={selectedProduct?.stock} required />
              </div>
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
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete <strong>{selectedProduct?.name}</strong>? This action cannot be undone.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>Delete Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
