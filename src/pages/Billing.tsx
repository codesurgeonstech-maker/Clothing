import { useState, useRef, useEffect } from "react"
import { useStore } from "@/store/useStore"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Search, Plus, Minus, Trash2, Banknote, Printer, Download, Share2, ShoppingBag, User } from "lucide-react"
import type { Product, Bill } from "@/data/mockData"
import toast from "react-hot-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

import { Label } from "@/components/ui/label"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { format } from "date-fns"

export default function Billing() {
  const { products, cart, addToCart, updateCartQuantity, clearCart, checkout, customers, selectedCustomer, setSelectedCustomer, addCustomer, storeSettings } = useStore()
  
  const [billingStep, setBillingStep] = useState<"customer" | "products">("customer")
  const [customerSearchInput, setCustomerSearchInput] = useState("")
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false)
  const [newCustomerSameWhatsapp, setNewCustomerSameWhatsapp] = useState(true)

  const [searchTerm, setSearchTerm] = useState("")
  const [discountValue, setDiscountValue] = useState(0)
  const [discountType, setDiscountType] = useState<"value" | "percentage">("value")
  const [paymentMode, setPaymentMode] = useState("Cash")
  const [isBillSaved, setIsBillSaved] = useState(false)

  // Receipt Modal State
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [lastBill, setLastBill] = useState<Bill | null>(null)
  const receiptRef = useRef<HTMLDivElement>(null)

  // If a customer was already selected globally, start at products step
  useEffect(() => {
    if (selectedCustomer) {
      setBillingStep("products")
    }
  }, [selectedCustomer])

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode.includes(searchTerm) ||
    p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.material.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 12)

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1)
    toast.success(`Added ${product.name} to cart`)
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0)
  
  // Calculate discount
  const discount = discountType === "percentage" ? (subtotal * discountValue) / 100 : (discountValue || 0)
  
  const subtotalAfterDiscount = subtotal - discount
  let cgstVal = 0;
  let sgstVal = 0;
  let gst = 0;
  
  if (storeSettings.taxEnabled) {
    cgstVal = (subtotalAfterDiscount * storeSettings.cgstPercentage) / 100;
    sgstVal = (subtotalAfterDiscount * storeSettings.sgstPercentage) / 100;
    gst = cgstVal + sgstVal;
  }
  
  const total = subtotalAfterDiscount + gst

  const handleSaveBill = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty")
      return
    }
    
    const oldBillsLength = useStore.getState().bills.length
    checkout(paymentMode)
    const newBills = useStore.getState().bills
    
    if (newBills.length > oldBillsLength) {
      setLastBill(newBills[newBills.length - 1])
      setIsBillSaved(true)
    }
    
    setDiscountValue(0)
    toast.success(`Bill saved successfully`)
  }

  const handleNewBill = () => {
    setIsBillSaved(false)
    setBillingStep("customer")
    setSelectedCustomer(null)
    setCustomerSearchInput("")
    clearCart()
  }

  const handleSaveCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const phone = formData.get("phone") as string
    const whatsapp = newCustomerSameWhatsapp ? phone : formData.get("whatsapp") as string
    
    addCustomer({
      name: formData.get("name") as string,
      phone,
      whatsapp,
      email: "",
      birthday: formData.get("birthday") as string || new Date().toISOString(),
      favoriteCategory: "Shirts",
      favoriteColor: "Blue",
    })
    
    const updatedCustomers = useStore.getState().customers
    const newCust = updatedCustomers.find(c => c.phone === phone)
    if (newCust) {
      setSelectedCustomer(newCust)
      setBillingStep("products")
    }
    
    toast.success("Customer added successfully")
    setIsAddCustomerOpen(false)
  }

  const handleDownloadPDF = async () => {
    if (!receiptRef.current || !lastBill) return
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2 })
      const imgData = canvas.toDataURL("image/png")
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 200]
      })
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      pdf.save(`receipt-${lastBill.id}.pdf`)
      toast.success("PDF Downloaded successfully")
    } catch {
      toast.error("Failed to generate PDF")
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleWhatsApp = async () => {
    if (!lastBill) return
    await handleDownloadPDF()
    
    const customer = customers.find(c => c.id === lastBill.customerId)
    const phone = customer?.whatsapp || customer?.phone || ""
    
    const message = `Hello ${lastBill.customerName},\n\nThank you for shopping at ${storeSettings.storeName}!\nYour bill total is ₹${lastBill.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.\n\nI have downloaded your PDF receipt, please find it attached (drag and drop here).`
    
    if (phone) {
      const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
      window.open(url, '_blank')
    } else {
      const url = `https://wa.me/?text=${encodeURIComponent(message)}`
      window.open(url, '_blank')
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col lg:h-[calc(100vh-8rem)] lg:flex-row gap-6">
      
      {/* Left Panel: Customer Search OR Products Selection */}
      <div className="flex-1 flex flex-col gap-4 min-h-0 bg-white/40 rounded-2xl p-4 md:p-6 border shadow-sm">
        {billingStep === "customer" ? (
          <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto space-y-8 animate-in fade-in zoom-in duration-500 w-full">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Start New Bill</h2>
              <p className="text-muted-foreground">Search customer by mobile number to begin.</p>
            </div>
            
            <div className="w-full relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={customerSearchInput}
                onChange={(e) => setCustomerSearchInput(e.target.value)}
                placeholder="Enter 10-digit mobile number..."
                className="pl-12 h-14 text-lg rounded-xl glass shadow-md border-primary/20 focus-visible:ring-primary/30"
                autoFocus
              />
            </div>
            
            {customerSearchInput.length > 2 && (
              <div className="w-full space-y-3">
                {customers.filter(c => c.phone.includes(customerSearchInput)).map(c => (
                  <Card 
                    key={c.id} 
                    className="cursor-pointer hover:border-primary hover:shadow-md transition-all active:scale-[0.98]" 
                    onClick={() => {
                      setSelectedCustomer(c)
                      setBillingStep("products")
                    }}
                  >
                    <CardContent className="p-4 flex justify-between items-center bg-white/50">
                      <div>
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-sm text-muted-foreground font-medium">{c.phone}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Loyalty</div>
                          <div className="font-bold text-amber-600 text-sm">{c.loyaltyPoints} pts</div>
                        </div>
                        <Button size="sm" className="rounded-full px-6">Select</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {customers.filter(c => c.phone.includes(customerSearchInput)).length === 0 && (
                  <div className="text-center py-6 space-y-4 bg-white/40 rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-500">No customer found with this number.</p>
                    <Button onClick={() => setIsAddCustomerOpen(true)} className="rounded-full shadow-sm">
                      <Plus className="w-4 h-4 mr-2"/> Add New Customer
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            <div className="w-full flex items-center justify-center pt-4">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSelectedCustomer(null)
                  setBillingStep("products")
                }} 
                className="text-muted-foreground hover:text-slate-900 hover:bg-slate-100/50"
              >
                Skip & Continue as Walk-in Customer
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-500 min-h-0">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products</h1>
                <p className="text-sm text-muted-foreground">Scan barcode or search by brand/fabric</p>
              </div>
              
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                  {selectedCustomer ? selectedCustomer.name.charAt(0) : "W"}
                </div>
                <div className="text-sm">
                  <div className="font-bold leading-tight">{selectedCustomer ? selectedCustomer.name : "Walk-in"}</div>
                  <div className="text-xs text-muted-foreground">{selectedCustomer ? selectedCustomer.phone : "No record"}</div>
                </div>
                {selectedCustomer && (
                  <div className="ml-1 px-2 py-0.5 bg-amber-50 rounded-md border border-amber-200/60 hidden sm:block">
                    <div className="text-[10px] text-amber-600/80 leading-none uppercase font-bold mb-0.5">Loyalty</div>
                    <div className="text-xs font-bold text-amber-600 leading-none">{selectedCustomer.loyaltyPoints} pts</div>
                  </div>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs ml-2 text-primary hover:text-primary hover:bg-primary/10"
                  onClick={() => setBillingStep("customer")}
                >
                  Change
                </Button>
              </div>
            </div>

            <div className="relative mb-4 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by barcode, brand, category or fabric..."
                className="pl-10 h-12 text-lg rounded-xl glass shadow-sm"
                autoFocus
              />
            </div>

            <div className="flex-1 -mx-2 px-2 overflow-y-auto min-h-[300px]">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                {filteredProducts.map(product => (
                  <Card 
                    key={product.id} 
                    className="cursor-pointer hover:border-primary/50 hover:shadow-xl transition-all active:scale-95 bg-white overflow-hidden border border-slate-200/60 flex flex-col group relative rounded-2xl"
                    onClick={() => handleAddToCart(product)}
                  >
                    <div className="aspect-[4/3] w-full bg-slate-50 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.brand} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <span className="text-5xl font-black text-slate-200 group-hover:scale-110 transition-transform duration-500">{product.brand.charAt(0)}</span>
                      )}
                      
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 backdrop-blur-[2px]">
                         <Button size="sm" variant="secondary" className="font-bold rounded-full pointer-events-none shadow-lg">
                           <Plus className="w-4 h-4 mr-2" /> Add
                         </Button>
                      </div>
                      
                      <div className="absolute top-2 left-2 z-10">
                        <span className="bg-white/90 backdrop-blur-sm text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm text-slate-700 border border-slate-200/50 uppercase tracking-wider">
                          {product.category}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-800 line-clamp-1 text-base leading-tight" title={product.name}>{product.brand}</div>
                        <div className="text-xs text-slate-500 mt-1 font-medium">{product.material}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-1 opacity-70">{product.barcode}</div>
                      </div>
                      <div className="flex justify-between items-end mt-auto pt-2 border-t border-slate-100">
                        <span className="font-black text-lg text-primary tracking-tight">₹{product.price}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="col-span-full py-12 text-center text-muted-foreground">
                    No products found matching your search.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cart & Checkout */}
      <Card className="w-full lg:w-[400px] flex flex-col min-h-0 border-none shadow-xl bg-white/80 backdrop-blur-xl">
        <CardHeader className="pb-4 border-b border-border/40">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Current Order</CardTitle>
            <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={clearCart}>
              <Trash2 className="w-4 h-4 mr-2" /> Clear
            </Button>
          </div>
        </CardHeader>
        
        <div className="flex-1 w-full overflow-y-auto min-h-[250px]">
          <CardContent className="p-0 h-full">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
                <ShoppingBag className="w-12 h-12 mb-2 opacity-20" />
                <p>Cart is empty</p>
                <p className="text-sm">Scan or add products to begin</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-3 animate-in fade-in slide-in-from-right-4">
                    <div className="w-16 h-16 bg-light rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.brand} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary font-bold">{item.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.barcode}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" size="icon" className="h-6 w-6 rounded-full"
                            onClick={() => updateCartQuantity(item.id, item.cartQuantity - 1)}
                            disabled={item.cartQuantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm w-4 text-center font-medium">{item.cartQuantity}</span>
                          <Button 
                            variant="outline" size="icon" className="h-6 w-6 rounded-full"
                            onClick={() => updateCartQuantity(item.id, item.cartQuantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <span className="font-semibold text-sm">₹{item.price * item.cartQuantity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </div>

        <CardFooter className="flex-col pt-4 pb-6 px-4 bg-slate-50/50 border-t border-border/40 flex-shrink-0">
          <div className="w-full space-y-4 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Discount</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white rounded-md p-0.5 border shadow-sm h-8">
                  <label className={`cursor-pointer px-2.5 py-1 rounded text-xs font-medium transition-colors ${discountType === 'value' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-slate-100'}`}>
                    <input type="radio" name="discountType" className="hidden" checked={discountType === 'value'} onChange={() => setDiscountType('value')} />
                    ₹
                  </label>
                  <label className={`cursor-pointer px-2.5 py-1 rounded text-xs font-medium transition-colors ${discountType === 'percentage' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-slate-100'}`}>
                    <input type="radio" name="discountType" className="hidden" checked={discountType === 'percentage'} onChange={() => setDiscountType('percentage')} />
                    %
                  </label>
                </div>
                <Input 
                  type="number" 
                  className="w-20 h-8 text-right text-sm" 
                  value={discountValue || ""}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>

            {storeSettings.taxEnabled && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">CGST ({storeSettings.cgstPercentage}%)</span>
                  <span className="font-medium">₹{cgstVal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">SGST ({storeSettings.sgstPercentage}%)</span>
                  <span className="font-medium">₹{sgstVal.toFixed(2)}</span>
                </div>
              </>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-2xl text-slate-900">
              <span>Total</span>
              <span className="text-primary">₹{total.toFixed(2)}</span>
            </div>
          </div>
          
          {isBillSaved ? (
            <div className="flex flex-col gap-3 w-full animate-in fade-in zoom-in duration-300">
              <Button size="lg" className="w-full font-semibold shadow-md shadow-primary/20" onClick={handlePrint}>
                <Printer className="w-5 h-5 mr-2" /> Print Receipt
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" className="font-semibold" onClick={() => setIsReceiptOpen(true)}>
                  <Search className="w-4 h-4 mr-2" /> View
                </Button>
                <Button className="bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold" onClick={handleWhatsApp}>
                  <Share2 className="w-4 h-4 mr-2" /> Share
                </Button>
              </div>
              <Button variant="outline" onClick={handleNewBill} className="w-full mt-2 font-semibold">
                Start New Bill
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 w-full">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Payment Mode</span>
                <select 
                  className="bg-white border rounded-md px-3 py-1.5 outline-none text-sm shadow-sm font-medium"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
              <Button 
                size="lg" 
                className="w-full font-semibold shadow-md shadow-primary/20 text-md h-12" 
                onClick={handleSaveBill}
                disabled={cart.length === 0}
              >
                <Banknote className="w-5 h-5 mr-2" /> Complete Checkout
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* CREATE CUSTOMER DIALOG IN BILLING */}
      <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCustomer} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input name="name" placeholder="Enter customer name" required autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <Input name="phone" defaultValue={customerSearchInput} placeholder="10-digit number" required />
                <div className="flex items-center space-x-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="sameWhatsappBill" 
                    checked={newCustomerSameWhatsapp} 
                    onChange={(e) => setNewCustomerSameWhatsapp(e.target.checked)} 
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
                  />
                  <label htmlFor="sameWhatsappBill" className="text-sm font-medium leading-none">
                    Same WhatsApp number
                  </label>
                </div>
              </div>
              {!newCustomerSameWhatsapp && (
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input name="whatsapp" placeholder="WhatsApp number" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input name="birthday" type="date" />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddCustomerOpen(false)}>Cancel</Button>
              <Button type="submit">Save & Select Customer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* RECEIPT DIALOG */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-md print-dialog">
          <DialogHeader className="hide-print">
            <DialogTitle>Bill Generated</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div ref={receiptRef} id="printable-receipt" className="p-6 bg-white text-black font-mono text-sm max-w-[300px] mx-auto border shadow-sm">
              {/* Receipt Header */}
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold">{storeSettings.storeName}</h2>
                <p className="text-xs text-gray-600">{storeSettings.address}</p>
                <p className="text-xs text-gray-600">Ph: {storeSettings.phone}</p>
                <Separator className="my-2 border-dashed border-gray-400" />
              </div>

              {/* Bill Info */}
              <div className="text-xs mb-4">
                <div className="flex justify-between"><span className="text-gray-500">Bill No:</span> <span>{lastBill?.id}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Date:</span> <span>{lastBill ? format(new Date(lastBill.date), 'dd/MM/yyyy HH:mm') : ''}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Mode:</span> <span>{lastBill?.paymentMode}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Customer:</span> <span className="truncate max-w-[150px]">{lastBill?.customerName}</span></div>
              </div>
              
              <Separator className="my-2 border-dashed border-gray-400" />

              {/* Items */}
              <div className="mb-4 text-xs">
                <div className="grid grid-cols-12 font-bold mb-1 border-b border-gray-400 pb-1">
                  <div className="col-span-6">Item</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-4 text-right">Amt</div>
                </div>
                {lastBill?.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 py-1">
                    <div className="col-span-6 truncate pr-2">{item.productName}</div>
                    <div className="col-span-2 text-center">{item.quantity}</div>
                    <div className="col-span-4 text-right">{(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <Separator className="my-2 border-dashed border-gray-400" />

              {/* Totals */}
              <div className="text-xs space-y-1 mb-4">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span> <span>{lastBill?.subtotal.toFixed(2)}</span></div>
                {lastBill && lastBill.discount > 0 && (
                   <div className="flex justify-between"><span className="text-gray-500">Discount</span> <span>-{lastBill.discount.toFixed(2)}</span></div>
                )}
                {storeSettings.taxEnabled && lastBill && (
                   <div className="flex justify-between"><span className="text-gray-500">Taxes ({storeSettings.cgstPercentage + storeSettings.sgstPercentage}%)</span> <span>{lastBill.gst.toFixed(2)}</span></div>
                )}
                <Separator className="my-1 border-gray-400" />
                <div className="flex justify-between font-bold text-sm"><span>TOTAL</span> <span>₹{lastBill?.total.toFixed(2)}</span></div>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-gray-500 mt-6">
                <p>Thank you for shopping!</p>
                <p>Visit us again.</p>
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter className="hide-print mt-4 flex sm:justify-between flex-wrap gap-2">
            <Button variant="outline" onClick={() => setIsReceiptOpen(false)}>Close</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" /> Print
              </Button>
              <Button variant="outline" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" /> PDF
              </Button>
              <Button className="bg-[#25D366] hover:bg-[#128C7E] text-white" onClick={handleWhatsApp}>
                <Share2 className="w-4 h-4 mr-2" /> WhatsApp
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
