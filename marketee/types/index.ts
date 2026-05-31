export interface Business {
  id: string
  name: string
  category: string
  subcategory: string
  description: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  email: string
  website?: string
  hours: Record<string, string>
  images: string[]
  coverImage: string
  logo?: string
  rating: number
  reviewCount: number
  priceRange: '$' | '$$' | '$$$'
  tags: string[]
  country: string
  lat: number
  lng: number
  verified: boolean
  premium: boolean
  featured: boolean
  products?: Product[]
  ownerId?: string
}

export interface Product {
  id: string
  name: string
  price: number
  description: string
  image: string
  available: boolean
}

export interface Review {
  id: string
  businessId: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  title: string
  body: string
  date: string
  helpful: number
  verified: boolean
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'customer' | 'owner' | 'admin'
  businessId?: string
  joinedDate: string
  reviewCount: number
}

export interface Category {
  id: string
  name: string
  icon: string
  count: number
  color: string
}