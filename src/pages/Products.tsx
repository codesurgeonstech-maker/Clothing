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
import { ManageableDropdown } from "@/components/ManageableDropdown"

export default function Products() {
  const { 
    products, addProduct, updateProduct, deleteProduct,
    categories, addCategory, updateCategory, deleteCategory,
    fabrics, addFabric, updateFabric, deleteFabric,
    bills
  } = useStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("All")

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Form states
  const initialFormState = { brand: "", category: "", material: "", price: "", imageUrl: "", barcode: "" }
  const [newProductForm, setNewProductForm] = useState(initialFormState)
  const [editProductForm, setEditProductForm] = useState(initialFormState)

  const filterCategories = useMemo(() => {
    return ["All", ...categories.map(c => c.name)]
  }, [categories])

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.brand.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.material.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (isEdit) {
          setEditProductForm(prev => ({ ...prev, imageUrl: reader.result as string }))
        } else {
          setNewProductForm(prev => ({ ...prev, imageUrl: reader.result as string }))
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreateProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    addProduct({
      name: `${newProductForm.brand} ${newProductForm.category}`,
      barcode: newProductForm.barcode || `890${Math.floor(Math.random() * 100000)}`,
      category: newProductForm.category || "Uncategorized",
      price: Number(newProductForm.price),
      brand: newProductForm.brand || "Generic",
      material: newProductForm.material || "Cotton",
      size: "M",
      color: "Black",
      costPrice: Number(newProductForm.price) * 0.6,
      imageUrl: newProductForm.imageUrl || `https://ui-avatars.com/api/?name=${newProductForm.category.charAt(0)}&background=random`
    })
    toast.success("Product created successfully")
    setIsCreateOpen(false)
    setNewProductForm(initialFormState)
  }

  const handleEditProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedProduct) return
    updateProduct(selectedProduct.id, {
      name: `${editProductForm.brand} ${editProductForm.category}`,
      barcode: editProductForm.barcode,
      category: editProductForm.category,
      price: Number(editProductForm.price),
      brand: editProductForm.brand,
      material: editProductForm.material,
      imageUrl: editProductForm.imageUrl || selectedProduct.imageUrl
    })
    toast.success("Product updated successfully")
    setIsEditOpen(false)
  }

  const handleDeleteCategoryWithValidation = (id: string) => {
    const category = categories.find(c => c.id === id)
    if (!category) return
    const isUsed = products.some(p => p.category === category.name)
    if (isUsed) {
      toast.error(`Cannot delete category "${category.name}": It is linked to existing products.`)
      return
    }
    deleteCategory(id)
  }

  const handleDeleteFabricWithValidation = (id: string) => {
    const fabric = fabrics.find(f => f.id === id)
    if (!fabric) return
    const isUsed = products.some(p => p.material === fabric.name)
    if (isUsed) {
      toast.error(`Cannot delete fabric "${fabric.name}": It is linked to existing products.`)
      return
    }
    deleteFabric(id)
  }

  const handleDeleteProduct = () => {
    if (!selectedProduct) return
    
    const isUsedInBills = bills.some(bill => bill.items.some(item => item.productId === selectedProduct.id))
    if (isUsedInBills) {
      toast.error("Cannot delete product: It is linked to existing sales bills.")
      setIsDeleteOpen(false)
      return
    }

    deleteProduct(selectedProduct.id)
    toast.success("Product deleted successfully")
    setIsDeleteOpen(false)
  }

  const openEdit = (product: Product) => {
    setSelectedProduct(product)
    setEditProductForm({
      brand: product.brand,
      barcode: product.barcode,
      category: product.category,
      material: product.material,
      price: product.price.toString(),
      imageUrl: product.imageUrl || ""
    })
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
          <p className="text-muted-foreground mt-1">Manage your products and pricing.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline"><Download className="w-4 h-4 mr-2"/> Export</Button>
          <Button onClick={() => { setNewProductForm(initialFormState); setIsCreateOpen(true); }}><Plus className="w-4 h-4 mr-2" /> Add Product</Button>
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
                placeholder="Search products, brand, fabric..." 
                className="pl-9 h-10 bg-white"
              />
            </div>
            <div className="flex w-full sm:w-[200px]">
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  {filterCategories.map(cat => (
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
                  <TableHead className="w-[250px]">Brand Name</TableHead>
                  <TableHead className="w-[150px]">Category</TableHead>
                  <TableHead className="w-[150px]">Fabric</TableHead>
                  <TableHead className="w-[150px]">Price</TableHead>
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
                      <div className="w-10 h-10 rounded bg-light flex items-center justify-center overflow-hidden">
                        {product.imageUrl ? (
                           <img src={product.imageUrl} alt={product.brand} className="w-full h-full object-cover" />
                        ) : (
                           <span className="text-primary font-bold text-xs">{product.brand.charAt(0)}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">{product.brand}</div>
                      <div className="text-xs text-muted-foreground">{product.barcode}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal bg-primary/10 text-primary hover:bg-primary/20">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {product.material}
                    </TableCell>
                    <TableCell className="font-medium">₹{product.price}</TableCell>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Brand Name</Label>
                <Input 
                  value={newProductForm.brand} 
                  onChange={e => setNewProductForm({...newProductForm, brand: e.target.value})} 
                  placeholder="e.g. Zara" required 
                />
              </div>
              <div className="space-y-2">
                <Label>Barcode</Label>
                <Input 
                  value={newProductForm.barcode} 
                  onChange={e => setNewProductForm({...newProductForm, barcode: e.target.value})} 
                  placeholder="Barcode" required 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 flex flex-col justify-end">
                <Label>Category</Label>
                <ManageableDropdown 
                  items={categories}
                  value={newProductForm.category}
                  onChange={(val) => setNewProductForm({...newProductForm, category: val})}
                  onAdd={addCategory}
                  onUpdate={updateCategory}
                  onDelete={handleDeleteCategoryWithValidation}
                  placeholder="Select Category"
                />
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <Label>Fabric</Label>
                <ManageableDropdown 
                  items={fabrics}
                  value={newProductForm.material}
                  onChange={(val) => setNewProductForm({...newProductForm, material: val})}
                  onAdd={addFabric}
                  onUpdate={updateFabric}
                  onDelete={handleDeleteFabricWithValidation}
                  placeholder="Select Fabric"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Price (₹)</Label>
              <Input 
                type="number" 
                value={newProductForm.price} 
                onChange={e => setNewProductForm({...newProductForm, price: e.target.value})} 
                placeholder="Price" required 
              />
            </div>
            <div className="space-y-2">
              <Label>Product Image (Optional)</Label>
              <div className="flex items-center gap-4">
                <Input 
                  type="file"
                  accept="image/*"
                  onChange={e => handleImageUpload(e, false)} 
                  className="cursor-pointer"
                />
                {newProductForm.imageUrl && (
                  <div className="w-10 h-10 shrink-0 rounded overflow-hidden border">
                    <img src={newProductForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!newProductForm.category || !newProductForm.material}>Create Product</Button>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Brand Name</Label>
                <Input 
                  value={editProductForm.brand} 
                  onChange={e => setEditProductForm({...editProductForm, brand: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Barcode</Label>
                <Input 
                  value={editProductForm.barcode} 
                  onChange={e => setEditProductForm({...editProductForm, barcode: e.target.value})} 
                  required 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 flex flex-col justify-end">
                <Label>Category</Label>
                <ManageableDropdown 
                  items={categories}
                  value={editProductForm.category}
                  onChange={(val) => setEditProductForm({...editProductForm, category: val})}
                  onAdd={addCategory}
                  onUpdate={updateCategory}
                  onDelete={handleDeleteCategoryWithValidation}
                  placeholder="Select Category"
                />
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <Label>Fabric</Label>
                <ManageableDropdown 
                  items={fabrics}
                  value={editProductForm.material}
                  onChange={(val) => setEditProductForm({...editProductForm, material: val})}
                  onAdd={addFabric}
                  onUpdate={updateFabric}
                  onDelete={handleDeleteFabricWithValidation}
                  placeholder="Select Fabric"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Price (₹)</Label>
              <Input 
                type="number" 
                value={editProductForm.price} 
                onChange={e => setEditProductForm({...editProductForm, price: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Product Image (Optional)</Label>
              <div className="flex items-center gap-4">
                <Input 
                  type="file"
                  accept="image/*"
                  onChange={e => handleImageUpload(e, true)} 
                  className="cursor-pointer"
                />
                {editProductForm.imageUrl && (
                  <div className="w-10 h-10 shrink-0 rounded overflow-hidden border">
                    <img src={editProductForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!editProductForm.category || !editProductForm.material}>Save Changes</Button>
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
            Are you sure you want to delete <strong>{selectedProduct?.brand} {selectedProduct?.category}</strong>? This action cannot be undone.
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
