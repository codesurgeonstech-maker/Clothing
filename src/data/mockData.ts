import { addDays, subDays } from "date-fns"

export type Category = "Shirts" | "T-Shirts" | "Sarees" | "Jeans" | "Kids Wear" | "Women's Wear" | "Accessories" | "Footwear"
export type PaymentMode = "Cash" | "Card" | "UPI" | "Split"

export interface Product {
  id: string
  barcode: string
  name: string
  category: Category
  brand: string
  material: string
  size: string
  color: string
  price: number
  costPrice: number
  stock: number
  imageUrl?: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  whatsapp: string
  email: string
  loyaltyPoints: number
  totalSpent: number
  repeatCustomer: boolean
  birthday: string
  favoriteCategory: Category
  favoriteColor: string
}

export interface BillItem {
  productId: string
  productName: string
  quantity: number
  price: number
  discount: number
  total: number
}

export interface Bill {
  id: string
  customerId: string
  customerName: string
  items: BillItem[]
  subtotal: number
  discount: number
  gst: number
  total: number
  paymentMode: PaymentMode
  date: string
  status: "Completed" | "Pending" | "Refunded"
}

// Generate 100 Products
const categories: Category[] = ["Shirts", "T-Shirts", "Sarees", "Jeans", "Kids Wear", "Women's Wear", "Accessories", "Footwear"]
const brands = ["Zara", "H&M", "Levis", "Biba", "W", "Allen Solly", "Peter England", "Puma"]
const sizes = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"]
const colors = ["Red", "Blue", "Black", "White", "Green", "Yellow", "Pink", "Navy"]
const materials = ["Cotton", "Polyester", "Silk", "Denim", "Linen", "Wool"]

export const mockProducts: Product[] = Array.from({ length: 100 }).map((_, i) => {
  const category = categories[i % categories.length]
  const price = Math.floor(Math.random() * 3000) + 500
  return {
    id: `PROD-${1000 + i}`,
    barcode: `890100${1000 + i}`,
    name: `${brands[i % brands.length]} Premium ${category}`,
    category,
    brand: brands[i % brands.length],
    material: materials[i % materials.length],
    size: sizes[i % sizes.length],
    color: colors[Math.floor(Math.random() * colors.length)],
    price,
    costPrice: price * 0.6,
    stock: Math.floor(Math.random() * 100) + 10,
    imageUrl: `https://ui-avatars.com/api/?name=${category.charAt(0)}&background=random`,
  }
})

// Generate 50 Customers
const firstNames = ["Rahul", "Priya", "Amit", "Neha", "Rohit", "Sneha", "Vikram", "Anjali", "Karan", "Pooja"]
const lastNames = ["Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Reddy", "Nair", "Iyer", "Joshi"]

export const mockCustomers: Customer[] = Array.from({ length: 50 }).map((_, i) => {
  const totalSpent = Math.floor(Math.random() * 50000) + 1000
  return {
    id: `CUST-${1000 + i}`,
    name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
    phone: `98765${40000 + i}`,
    whatsapp: `98765${40000 + i}`,
    email: `customer${i}@example.com`,
    loyaltyPoints: Math.floor(totalSpent / 100),
    totalSpent,
    repeatCustomer: Math.random() > 0.3,
    birthday: addDays(new Date(), Math.floor(Math.random() * 365)).toISOString(),
    favoriteCategory: categories[Math.floor(Math.random() * categories.length)],
    favoriteColor: colors[Math.floor(Math.random() * colors.length)],
  }
})

// Generate 500 Bills
const paymentModes: PaymentMode[] = ["Cash", "Card", "UPI", "Split"]
export const mockBills: Bill[] = Array.from({ length: 500 }).map((_, i) => {
  const customer = mockCustomers[Math.floor(Math.random() * mockCustomers.length)]
  const numItems = Math.floor(Math.random() * 5) + 1
  const items: BillItem[] = []
  let subtotal = 0

  for (let j = 0; j < numItems; j++) {
    const product = mockProducts[Math.floor(Math.random() * mockProducts.length)]
    const quantity = Math.floor(Math.random() * 3) + 1
    const price = product.price
    const discount = Math.random() > 0.8 ? price * 0.1 : 0
    const total = (price - discount) * quantity
    subtotal += total
    items.push({
      productId: product.id,
      productName: product.name,
      quantity,
      price,
      discount,
      total,
    })
  }

  const discount = Math.random() > 0.5 ? subtotal * 0.05 : 0
  const gst = (subtotal - discount) * 0.18
  const total = subtotal - discount + gst

  return {
    id: `INV-${10000 + i}`,
    customerId: customer.id,
    customerName: customer.name,
    items,
    subtotal,
    discount,
    gst,
    total,
    paymentMode: paymentModes[Math.floor(Math.random() * paymentModes.length)],
    // Generate dates over the last 1 year
    date: subDays(new Date(), Math.floor(Math.random() * 365)).toISOString(),
    status: Math.random() > 0.05 ? "Completed" : "Pending",
  }
})
