-- Seed Data for Supabase
-- Based on prisma/seed.ts

-- 1. Create Super Admin
-- Password is 'admin123' (hash of 'admin123' using bcrypt with 10 rounds)
INSERT INTO "User" ("id", "name", "email", "password", "role", "isActive", "updatedAt")
VALUES ('clv1234567890', 'Store Admin', 'admin@skyishearthly.com', '$2b$10$L7T8yG9x4Y3P6R1Z5q7m8uH9Vz9S2K5L3M1N4O1P2Q3R4S5T6U7V8', 'SUPER_ADMIN', true, NOW())
ON CONFLICT ("email") DO NOTHING;

-- 2. Create Categories
INSERT INTO "Category" ("id", "name", "slug", "image", "isPopular", "updatedAt")
VALUES 
('cat-menswear', 'Menswear', 'menswear', 'https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?q=80&w=600&h=600&auto=format&fit=crop', true, NOW()),
('cat-womenswear', 'Womenswear', 'womenswear', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=600&h=600&auto=format&fit=crop', true, NOW()),
('cat-kids', 'Kids Fashion', 'kids', 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=600&h=600&auto=format&fit=crop', true, NOW()),
('cat-accessories', 'Accessories', 'accessories', 'https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=600&h=600&auto=format&fit=crop', true, NOW()),
('cat-shoes', 'Footwear', 'shoes', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&h=600&auto=format&fit=crop', true, NOW());

-- 3. Create Occasions
INSERT INTO "Occasion" ("id", "name", "slug", "image", "isPopular", "updatedAt")
VALUES 
('occ-casual', 'Casual Wear', 'casual', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=600&fit=crop', true, NOW()),
('occ-office', 'Office & Work', 'office', 'https://images.unsplash.com/photo-1548126032-079a0fb9a486?w=600&h=600&fit=crop', true, NOW()),
('occ-party', 'Evening & Party', 'party', 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&h=600&fit=crop', true, NOW()),
('occ-vacation', 'Vacation Mode', 'vacation', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=600&fit=crop', true, NOW());

-- 4. Create Moods
INSERT INTO "Mood" ("id", "name", "slug", "icon", "isActive", "updatedAt")
VALUES 
('mood-minimalist', 'Minimalist', 'minimalist', '✨', true, NOW()),
('mood-elegant', 'Elegant', 'elegant', '💎', true, NOW()),
('mood-romantic', 'Romantic', 'romantic', '🌹', true, NOW()),
('mood-joyful', 'Joyful', 'joyful', '🎈', true, NOW()),
('mood-sophisticated', 'Sophisticated', 'sophisticated', '👗', true, NOW());

-- 5. Create Recipients
INSERT INTO "Recipient" ("id", "name", "slug", "isActive", "updatedAt")
VALUES 
('rec-her', 'For Her', 'for-her', true, NOW()),
('rec-him', 'For Him', 'for-him', true, NOW()),
('rec-couple', 'For Couples', 'for-couples', true, NOW()),
('rec-corporate', 'Corporate Gifts', 'corporate', true, NOW());

-- 6. Create Products
INSERT INTO "Product" ("id", "name", "description", "price", "stock", "categoryId", "productImages", "productVariants", "isNewArrival", "isTrending", "isTopRated", "isBestSeller", "isPremiumGiftBox", "updatedAt")
VALUES 
('p-1', 'Classic White Linen Shirt', 'Breathable and stylish, perfect for tropical weather. Made from 100% pure linen.', 3500, 50, 'cat-menswear', '[{"url": "https://images.unsplash.com/photo-1593030143066-0a2d42c7aa0c?q=80&w=800&h=1000&auto=format&fit=crop"}]'::jsonb, '[{"size": "S", "color": "White"}, {"size": "M", "color": "White"}, {"size": "L", "color": "White"}]'::jsonb, true, true, false, false, false, NOW()),
('p-2', 'Floral Summer Dress', 'Elegant floral print dress with a flare. Ideal for brunch dates or beach strolls.', 5500, 30, 'cat-womenswear', '[{"url": "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=800&h=1000&auto=format&fit=crop"}]'::jsonb, '[{"size": "S", "color": "Floral"}, {"size": "M", "color": "Floral"}]'::jsonb, false, true, false, false, false, NOW()),
('p-3', 'Handcrafted Leather Belt', 'Genuine leather belt with a brushed silver buckle. A timeless accessory.', 2200, 100, 'cat-accessories', '[{"url": "https://images.unsplash.com/photo-1441441247730-d09b6af4b66b?w=800&h=1000&fit=crop"}]'::jsonb, '[{"size": "32"}, {"size": "34"}, {"size": "36"}]'::jsonb, false, false, true, false, false, NOW()),
('p-4', 'Urban Canvas Sneakers', 'Comfortable casual sneakers for everyday urban adventures.', 4800, 40, 'cat-shoes', '[{"url": "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&h=1000&fit=crop"}]'::jsonb, '[{"size": "8"}, {"size": "9"}, {"size": "10"}]'::jsonb, false, true, false, false, false, NOW()),
('p-5', 'Little Gentleman Outfit', 'Cute waistcoat and pant set for the little ones. Perfect for ceremonies.', 3200, 20, 'cat-kids', '[{"url": "https://images.unsplash.com/photo-1519234110483-e5df9a528a00?q=80&w=800&h=1000&auto=format&fit=crop"}]'::jsonb, '[{"size": "2-3Y"}, {"size": "4-5Y"}]'::jsonb, true, false, false, false, false, NOW()),
('p-6', 'Premium Silk Saree', 'Hand-woven luxury silk saree with traditional motifs. A masterpiece of craftsmanship.', 15500, 10, 'cat-womenswear', '[{"url": "https://images.unsplash.com/photo-1610030469668-935142764ee0?q=80&w=800&h=1000&auto=format&fit=crop"}]'::jsonb, '[{"color": "Royal Blue"}]'::jsonb, false, false, false, true, true, NOW());

-- 7. Promo Banners
INSERT INTO "PromoBanner" ("id", "key", "imageUrl", "isActive", "updatedAt")
VALUES 
('promo-1', 'promo_1', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=400&fit=crop', true, NOW()),
('promo-2', 'promo_2', 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&h=400&fit=crop', true, NOW());
