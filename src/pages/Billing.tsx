import { useState, useRef } from "react"
import { useStore } from "@/store/useStore"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Search, Plus, Minus, Trash2, Banknote, Printer, Download, Share2, ShoppingBag } from "lucide-react"
import type { Product, Bill } from "@/data/mockData"
import toast from "react-hot-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { format } from "date-fns"

export default function Billing() {
  const { products, cart, addToCart, updateCartQuantity, clearCart, checkout, customers } = useStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [discountValue, setDiscountValue] = useState(0)
  const [paymentMode, setPaymentMode] = useState("Cash")
  const [isBillSaved, setIsBillSaved] = useState(false)

  // Receipt Modal State
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [lastBill, setLastBill] = useState<Bill | null>(null)
  const receiptRef = useRef<HTMLDivElement>(null)

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode.includes(searchTerm)
  ).slice(0, 12)

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1)
    toast.success(`Added ${product.name} to cart`)
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0)
  const discount = discountValue || 0
  const gst = (subtotal - discount) * 0.18
  const total = subtotal - discount + gst

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

  const handleDownloadPDF = async () => {
    if (!receiptRef.current || !lastBill) return
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2 })
      const imgData = canvas.toDataURL("image/png")
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 200] // Thermal receipt width (80mm)
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
    // Attempt download first
    await handleDownloadPDF()
    
    const customer = customers.find(c => c.id === lastBill.customerId)
    const phone = customer?.whatsapp || customer?.phone || ""
    
    const message = `Hello ${lastBill.customerName},\n\nThank you for shopping at CodeSurgeons POS!\nYour bill total is ₹${lastBill.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.\n\nI have downloaded your PDF receipt, please find it attached (drag and drop here).`
    
    if (phone) {
      const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
      window.open(url, '_blank')
    } else {
      const url = `https://wa.me/?text=${encodeURIComponent(message)}`
      window.open(url, '_blank')
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      {/* Products Selection */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Billing (POS)</h1>
            <p className="text-sm text-muted-foreground">Search products or scan barcode</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Scan barcode or search products..."
            className="pl-10 h-12 text-lg rounded-xl glass shadow-sm"
          />
        </div>

        <ScrollArea className="flex-1 -mx-2 px-2">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {filteredProducts.map(product => (
              <Card 
                key={product.id} 
                className="cursor-pointer hover:border-primary/50 transition-all active:scale-[0.98] glass group overflow-hidden border-border/50"
                onClick={() => handleAddToCart(product)}
              >
                <div className="aspect-square bg-slate-100 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Plus className="w-8 h-8 text-primary" />
                  </div>
                  <span className="text-4xl font-bold text-slate-200 group-hover:scale-110 transition-transform">
                    {product.name.charAt(0)}
                  </span>
                </div>
                <CardContent className="p-3">
                  <div className="font-medium text-sm truncate" title={product.name}>{product.name}</div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-bold text-primary">₹{product.price}</span>
                    <span className="text-[10px] text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded">{product.stock} left</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                No products found
              </div>
            )}
          </div>
        </ScrollArea>
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
        
        <ScrollArea className="flex-1 w-full min-h-0">
          <CardContent className="p-0 min-h-[200px]">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center min-h-[200px]">
                <ShoppingBag className="w-12 h-12 mb-2 opacity-20" />
                <p>Cart is empty</p>
                <p className="text-sm">Scan or add products to begin</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-3 animate-in fade-in slide-in-from-right-4">
                    <div className="w-16 h-16 bg-light rounded-md flex-shrink-0 flex items-center justify-center text-primary font-bold">
                      {item.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.color} | Size: {item.size}</p>
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
        </ScrollArea>

        <CardFooter className="flex-col pt-4 pb-6 px-4 bg-slate-50/50 border-t border-border/40">
          <div className="w-full space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Discount (₹)</span>
              <Input 
                type="number" 
                className="w-24 h-7 text-right text-sm" 
                value={discountValue || ""}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST (18%)</span>
              <span>₹{gst.toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-xl text-primary">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
          
          {isBillSaved ? (
            <div className="flex flex-col gap-3 w-full">
              <Button 
                size="lg" 
                className="w-full font-semibold shadow-md shadow-primary/20" 
                onClick={handlePrint}
              >
                <Printer className="w-5 h-5 mr-2" /> Print
              </Button>
              <Button 
                size="lg" 
                variant="secondary"
                className="w-full font-semibold border-primary/20" 
                onClick={() => setIsReceiptOpen(true)}
              >
                <Search className="w-5 h-5 mr-2" /> View
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setIsBillSaved(false)}
                className="w-full mt-2"
              >
                New Bill
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 w-full">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Payment Mode</span>
                <select 
                  className="bg-white border rounded-md px-3 py-1.5 outline-none text-sm shadow-sm"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI Payment</option>
                </select>
              </div>
              <Button 
                size="lg" 
                className="w-full font-semibold shadow-md shadow-primary/20" 
                onClick={handleSaveBill}
                disabled={cart.length === 0}
              >
                <Banknote className="w-5 h-5 mr-2" /> Save Bill
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

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
                <h2 className="text-xl font-bold">CodeSurgeons POS</h2>
                <p className="text-xs text-gray-600">123 Fashion Street, Tech Park</p>
                <p className="text-xs text-gray-600">Bangalore, IN</p>
                <p className="text-xs text-gray-600">Ph: +91 9876543210</p>
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
                <div className="flex justify-between"><span className="text-gray-500">GST (18%)</span> <span>{lastBill?.gst.toFixed(2)}</span></div>
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
