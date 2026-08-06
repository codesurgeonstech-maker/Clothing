import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product, Customer, Bill, BillItem } from '../data/mockData'

export interface CartItem extends Product {
  cartQuantity: number
  discount: number
}

export interface DropdownItem {
  id: string;
  name: string;
}

export interface StoreSettings {
  storeName: string;
  phone: string;
  address: string;
  taxEnabled: boolean;
  cgstPercentage: number;
  sgstPercentage: number;
}

interface AppState {
  products: Product[]
  customers: Customer[]
  bills: Bill[]
  categories: DropdownItem[]
  fabrics: DropdownItem[]
  
  // POS State
  cart: CartItem[]
  selectedCustomer: Customer | null
  
  // Settings State
  storeSettings: StoreSettings
  updateStoreSettings: (settings: Partial<StoreSettings>) => void
  
  // Product Actions
  addProduct: (product: Omit<Product, 'id'>) => void
  updateProduct: (id: string, product: Partial<Product>) => void
  deleteProduct: (id: string) => void
  
  // Customer Actions
  addCustomer: (customer: Omit<Customer, 'id' | 'loyaltyPoints' | 'totalSpent' | 'repeatCustomer'>) => void
  updateCustomer: (id: string, customer: Partial<Customer>) => void
  deleteCustomer: (id: string) => void

  // Category Actions
  addCategory: (name: string) => void
  updateCategory: (id: string, name: string) => void
  deleteCategory: (id: string) => void

  // Fabric Actions
  addFabric: (name: string) => void
  updateFabric: (id: string, name: string) => void
  deleteFabric: (id: string) => void

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
      categories: ["Shirts", "T-Shirts", "Sarees", "Jeans", "Kids Wear", "Women's Wear", "Accessories", "Footwear"].map(name => ({ id: generateId('CAT'), name })),
      fabrics: ["Cotton", "Polyester", "Silk", "Denim", "Linen", "Wool"].map(name => ({ id: generateId('FAB'), name })),
      
      cart: [],
      selectedCustomer: null,
      
      storeSettings: {
        storeName: "CodeSurgeons POS",
        phone: "+91 9876543210",
        address: "123 Fashion Street, Tech Park, Bangalore",
        taxEnabled: true,
        cgstPercentage: 9,
        sgstPercentage: 9
      },
      
      updateStoreSettings: (settings) => set((state) => ({
        storeSettings: { ...state.storeSettings, ...settings }
      })),

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

      // --- Category Actions ---
      addCategory: (name) => set((state) => ({
        categories: [...state.categories, { id: generateId('CAT'), name }]
      })),
      
      updateCategory: (id, name) => set((state) => ({
        categories: state.categories.map(c => c.id === id ? { ...c, name } : c)
      })),

      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter(c => c.id !== id)
      })),

      // --- Fabric Actions ---
      addFabric: (name) => set((state) => ({
        fabrics: [...state.fabrics, { id: generateId('FAB'), name }]
      })),
      
      updateFabric: (id, name) => set((state) => ({
        fabrics: state.fabrics.map(f => f.id === id ? { ...f, name } : f)
      })),

      deleteFabric: (id) => set((state) => ({
        fabrics: state.fabrics.filter(f => f.id !== id)
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

        // Tax calculation based on settings
        const subtotalAfterDiscount = subtotal - totalDiscount;
        let gst = 0;
        let finalTotal = subtotalAfterDiscount;
        
        if (state.storeSettings.taxEnabled) {
          const totalTaxPercent = state.storeSettings.cgstPercentage + state.storeSettings.sgstPercentage;
          gst = (subtotalAfterDiscount * totalTaxPercent) / 100;
          finalTotal = subtotalAfterDiscount + gst;
        }

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

        // Update customer loyalty/spending
        let updatedCustomers = state.customers;
        if (state.selectedCustomer) {
          // Determine the most bought color in this sale
          const colorCounts: Record<string, number> = {};
          let maxCount = 0;
          let mostFrequentColor = state.selectedCustomer.favoriteColor;

          state.cart.forEach(item => {
            if (item.color) {
              colorCounts[item.color] = (colorCounts[item.color] || 0) + item.cartQuantity;
              if (colorCounts[item.color] > maxCount) {
                maxCount = colorCounts[item.color];
                mostFrequentColor = item.color;
              }
            }
          });

          updatedCustomers = state.customers.map(c => {
            if (c.id === state.selectedCustomer!.id) {
              const newTotal = c.totalSpent + finalTotal;
              return {
                ...c,
                totalSpent: newTotal,
                loyaltyPoints: c.loyaltyPoints + Math.floor(finalTotal / 100),
                repeatCustomer: true, // They have transacted at least twice now or we just mark as true on any checkout for simplicity
                favoriteColor: maxCount > 0 ? mostFrequentColor : c.favoriteColor // Update color preference
              };
            }
            return c;
          });
        }

        return { 
          cart: [], 
          selectedCustomer: null, 
          bills: [...state.bills, newBill],
          customers: updatedCustomers
        };
      })
    }),
    {
      name: 'clothing-store-storage',
    }
  )
)
