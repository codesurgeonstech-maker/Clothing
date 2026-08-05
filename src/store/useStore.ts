import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product, Customer, Bill, BillItem } from '../data/mockData'

export interface CartItem extends Product {
  cartQuantity: number
  discount: number
}

interface AppState {
  products: Product[]
  customers: Customer[]
  bills: Bill[]
  
  // POS State
  cart: CartItem[]
  selectedCustomer: Customer | null
  
  // Product Actions
  addProduct: (product: Omit<Product, 'id'>) => void
  updateProduct: (id: string, product: Omit<Product, 'id'>) => void
  deleteProduct: (id: string) => void
  
  // Customer Actions
  addCustomer: (customer: Omit<Customer, 'id' | 'loyaltyPoints' | 'totalSpent' | 'repeatCustomer'>) => void
  updateCustomer: (id: string, customer: Partial<Customer>) => void
  deleteCustomer: (id: string) => void

  // POS Actions
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateCartQuantity: (productId: string, quantity: number) => void
  setDiscount: (productId: string, discount: number) => void
  clearCart: () => void
  setSelectedCustomer: (customer: Customer | null) => void
  checkout: (paymentMode: string) => void
}

const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      products: [],
      customers: [],
      bills: [],
      
      cart: [],
      selectedCustomer: null,

      // --- Product Actions ---
      addProduct: (productData) => set((state) => ({
        products: [...state.products, { ...productData, id: generateId('PROD') }]
      })),
      
      updateProduct: (id, productData) => set((state) => ({
        products: state.products.map(p => p.id === id ? { ...p, ...productData } : p)
      })),

      deleteProduct: (id) => set((state) => ({
        products: state.products.filter(p => p.id !== id)
      })),

      // --- Customer Actions ---
      addCustomer: (customerData) => set((state) => ({
        customers: [...state.customers, {
          ...customerData,
          id: generateId('CUST'),
          loyaltyPoints: 0,
          totalSpent: 0,
          repeatCustomer: false
        }]
      })),
      
      updateCustomer: (id, customerData) => set((state) => ({
        customers: state.customers.map(c => c.id === id ? { ...c, ...customerData } : c)
      })),

      deleteCustomer: (id) => set((state) => ({
        customers: state.customers.filter(c => c.id !== id)
      })),

      // --- POS Actions ---
      addToCart: (product, quantity = 1) => set((state) => {
        const existing = state.cart.find((item) => item.id === product.id)
        if (existing) {
          return {
            cart: state.cart.map((item) =>
              item.id === product.id
                ? { ...item, cartQuantity: item.cartQuantity + quantity }
                : item
            )
          }
        }
        return { cart: [...state.cart, { ...product, cartQuantity: quantity, discount: 0 }] }
      }),

      removeFromCart: (productId) => set((state) => ({
        cart: state.cart.filter((item) => item.id !== productId)
      })),

      updateCartQuantity: (productId, quantity) => set((state) => ({
        cart: state.cart.map((item) =>
          item.id === productId ? { ...item, cartQuantity: Math.max(1, quantity) } : item
        )
      })),

      setDiscount: (productId, discount) => set((state) => ({
        cart: state.cart.map((item) =>
          item.id === productId ? { ...item, discount } : item
        )
      })),

      clearCart: () => set({ cart: [], selectedCustomer: null }),

      setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),

      checkout: (paymentMode: string) => set((state) => {
        if (state.cart.length === 0) return state;

        let subtotal = 0;
        let totalDiscount = 0;
        
        const items: BillItem[] = state.cart.map(item => {
          const itemTotalBeforeDiscount = item.price * item.cartQuantity;
          const itemDiscountValue = (itemTotalBeforeDiscount * item.discount) / 100;
          const itemTotal = itemTotalBeforeDiscount - itemDiscountValue;
          
          subtotal += itemTotalBeforeDiscount;
          totalDiscount += itemDiscountValue;

          return {
            productId: item.id,
            productName: item.name,
            quantity: item.cartQuantity,
            price: item.price,
            discount: itemDiscountValue,
            total: itemTotal
          };
        });

        // Add 18% GST on the discounted subtotal
        const subtotalAfterDiscount = subtotal - totalDiscount;
        const gst = subtotalAfterDiscount * 0.18;
        const finalTotal = subtotalAfterDiscount + gst;

        const newBill: Bill = {
          id: generateId('INV'),
          customerId: state.selectedCustomer?.id || 'Walk-in',
          customerName: state.selectedCustomer?.name || 'Walk-in Customer',
          items,
          subtotal,
          discount: totalDiscount,
          gst,
          total: finalTotal,
          paymentMode: paymentMode as any,
          date: new Date().toISOString(),
          status: 'Completed'
        };

        // Update product stock and customer loyalty/spending
        const updatedProducts = state.products.map(p => {
          const cartItem = state.cart.find(c => c.id === p.id);
          if (cartItem) {
            return { ...p, stock: Math.max(0, p.stock - cartItem.cartQuantity) };
          }
          return p;
        });

        let updatedCustomers = state.customers;
        if (state.selectedCustomer) {
          updatedCustomers = state.customers.map(c => {
            if (c.id === state.selectedCustomer!.id) {
              const newTotal = c.totalSpent + finalTotal;
              return {
                ...c,
                totalSpent: newTotal,
                loyaltyPoints: c.loyaltyPoints + Math.floor(finalTotal / 100),
                repeatCustomer: true // They have transacted at least twice now or we just mark as true on any checkout for simplicity
              };
            }
            return c;
          });
        }

        return { 
          cart: [], 
          selectedCustomer: null, 
          bills: [...state.bills, newBill],
          products: updatedProducts,
          customers: updatedCustomers
        };
      })
    }),
    {
      name: 'clothing-store-storage',
    }
  )
)
