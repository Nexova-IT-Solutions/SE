import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const superAdminPassword = await bcrypt.hash('admin123', 10)
  
  // Create Super Admin
  await prisma.user.upsert({
    where: { email: 'admin@skyishearthly.com' },
    update: {},
    create: {
      email: 'admin@skyishearthly.com',
      name: 'Store Admin',
      password: superAdminPassword,
      role: 'SUPER_ADMIN',
    },
  })

  // Clear existing data (optional but good for rebranding)
  await prisma.productMood.deleteMany({})
  await prisma.giftBoxItem.deleteMany({})
  await prisma.orderItem.deleteMany({})
  await prisma.order.deleteMany({})
  await prisma.product.deleteMany({})
  await prisma.category.deleteMany({})
  await prisma.occasion.deleteMany({})
  await prisma.mood.deleteMany({})
  await prisma.recipient.deleteMany({})

  // 1. Create Categories
  const categories = [
    { id: 'cat-menswear', name: 'Menswear', slug: 'menswear', image: 'https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?q=80&w=600&h=600&auto=format&fit=crop', isPopular: true },
    { id: 'cat-womenswear', name: 'Womenswear', slug: 'womenswear', image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&h=600&auto=format&fit=crop', isPopular: true },
    { id: 'cat-kids', name: 'Kids Fashion', slug: 'kids', image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=600&h=600&auto=format&fit=crop', isPopular: true },
    { id: 'cat-accessories', name: 'Accessories', slug: 'accessories', image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=600&h=600&auto=format&fit=crop', isPopular: true },
    { id: 'cat-shoes', name: 'Footwear', slug: 'shoes', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&h=600&auto=format&fit=crop', isPopular: true },
  ]

  for (const cat of categories) {
    await prisma.category.create({ data: cat })
  }

  // 2. Create Occasions
  const occasions = [
    { id: 'occ-casual', name: 'Casual Wear', slug: 'casual', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=600&fit=crop', isPopular: true },
    { id: 'occ-office', name: 'Office & Work', slug: 'office', image: 'https://images.unsplash.com/photo-1548126032-079a0fb9a486?w=600&h=600&fit=crop', isPopular: true },
    { id: 'occ-party', name: 'Evening & Party', slug: 'party', image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&h=600&fit=crop', isPopular: true },
    { id: 'occ-vacation', name: 'Vacation Mode', slug: 'vacation', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=600&fit=crop', isPopular: true },
  ]

  for (const occ of occasions) {
    await prisma.occasion.create({ data: occ })
  }

  // 3. Create Products
  const products = [
    {
      name: 'Classic White Linen Shirt',
      price: 3500,
      description: 'Breathable and stylish, perfect for tropical weather. Made from 100% pure linen.',
      stock: 50,
      categoryId: 'cat-menswear',
      productImages: [{ url: 'https://images.unsplash.com/photo-1593030143066-0a2d42c7aa0c?q=80&w=800&h=1000&auto=format&fit=crop' }],
      productVariants: [{ size: 'S', color: 'White' }, { size: 'M', color: 'White' }, { size: 'L', color: 'White' }],
      isNewArrival: true,
      isTrending: true,
    },
    {
      name: 'Floral Summer Dress',
      price: 5500,
      description: 'Elegant floral print dress with a flare. Ideal for brunch dates or beach strolls.',
      stock: 30,
      categoryId: 'cat-womenswear',
      productImages: [{ url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=800&h=1000&auto=format&fit=crop' }],
      productVariants: [{ size: 'S', color: 'Floral' }, { size: 'M', color: 'Floral' }],
      isTrending: true,
    },
    {
      name: 'Handcrafted Leather Belt',
      price: 2200,
      description: 'Genuine leather belt with a brushed silver buckle. A timeless accessory.',
      stock: 100,
      categoryId: 'cat-accessories',
      productImages: [{ url: 'https://images.unsplash.com/photo-1441441247730-d09b6af4b66b?w=800&h=1000&fit=crop' }],
      productVariants: [{ size: '32' }, { size: '34' }, { size: '36' }],
      isTopRated: true,
    },
    {
      name: 'Urban Canvas Sneakers',
      price: 4800,
      description: 'Comfortable casual sneakers for everyday urban adventures.',
      stock: 40,
      categoryId: 'cat-shoes',
      productImages: [{ url: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&h=1000&fit=crop' }],
      productVariants: [{ size: '8' }, { size: '9' }, { size: '10' }],
      isTrending: true,
    },
    {
      name: 'Little Gentleman Outfit',
      price: 3200,
      description: 'Cute waistcoat and pant set for the little ones. Perfect for ceremonies.',
      stock: 20,
      categoryId: 'cat-kids',
      productImages: [{ url: 'https://images.unsplash.com/photo-1519234110483-e5df9a528a00?q=80&w=800&h=1000&auto=format&fit=crop' }],
      productVariants: [{ size: '2-3Y' }, { size: '4-5Y' }],
      isNewArrival: true,
    },
    {
      name: 'Premium Silk Saree',
      price: 15500,
      description: 'Hand-woven luxury silk saree with traditional motifs. A masterpiece of craftsmanship.',
      stock: 10,
      categoryId: 'cat-womenswear',
      productImages: [{ url: 'https://images.unsplash.com/photo-1610030469668-935142764ee0?q=80&w=800&h=1000&auto=format&fit=crop' }],
      productVariants: [{ color: 'Royal Blue' }],
      isPremiumGiftBox: true, // Reuse this flag for "Premium Collection"
      isBestSeller: true,
    }
  ]

  for (const p of products) {
    await prisma.product.create({
      data: {
        ...p,
        productImages: p.productImages as any,
        productVariants: p.productVariants as any,
      }
    })
  }

  // Create Promo Banners
  await prisma.promoBanner.upsert({
    where: { key: 'promo_1' },
    update: {},
    create: {
      key: 'promo_1',
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=400&fit=crop',
      isActive: true,
    }
  })

  await prisma.promoBanner.upsert({
    where: { key: 'promo_2' },
    update: {},
    create: {
      key: 'promo_2',
      imageUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&h=400&fit=crop',
      isActive: true,
    }
  })

  // 4. Create Moods
  const moods = [
    { id: 'mood-minimalist', name: 'Minimalist', icon: '✨', isActive: true },
    { id: 'mood-elegant', name: 'Elegant', icon: '💎', isActive: true },
    { id: 'mood-romantic', name: 'Romantic', icon: '🌹', isActive: true },
    { id: 'mood-joyful', name: 'Joyful', icon: '🎈', isActive: true },
    { id: 'mood-sophisticated', name: 'Sophisticated', icon: '👗', isActive: true },
  ]

  for (const m of moods) {
    await prisma.mood.create({ data: m })
  }

  // 5. Create Recipients
  const recipients = [
    { id: 'rec-her', name: 'For Her', slug: 'for-her', isActive: true },
    { id: 'rec-him', name: 'For Him', slug: 'for-him', isActive: true },
    { id: 'rec-couple', name: 'For Couples', slug: 'for-couples', isActive: true },
    { id: 'rec-corporate', name: 'Corporate Gifts', slug: 'corporate', isActive: true },
  ]

  for (const r of recipients) {
    await prisma.recipient.create({ data: r })
  }

  console.log('Seed completed successfully')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
