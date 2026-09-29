const seedProducts = [
  {
    id: 'prod_01',
    name: 'Aether Studio Pro Noise-Canceling Headphones',
    slug: 'aether-studio-pro-headphones',
    description: 'Precision spatial audio with dual planar magnetic drivers, active hybrid ANC, and 45-hour battery performance.',
    price: 349.99,
    originalPrice: 399.99,
    category: 'Audio',
    badge: 'Best Seller',
    stock: 45,
    rating: 4.9,
    numReviews: 128,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    tags: ['wireless', 'anc', 'audio', 'premium'],
    specs: {
      driver: '40mm Planar Magnetic',
      battery: '45 Hours',
      connectivity: 'Bluetooth 5.3 / USB-C',
      weight: '260g'
    },
    isFeatured: true,
    createdAt: new Date('2026-01-10').toISOString()
  },
  {
    id: 'prod_02',
    name: 'CyberPulse 4K OLED Curved Monitor',
    slug: 'cyberpulse-4k-oled-monitor',
    description: '32-inch quantum dot OLED display featuring 240Hz refresh rate, 0.03ms response time, and HDR1000 peak brightness.',
    price: 1199.00,
    originalPrice: 1299.00,
    category: 'Displays',
    badge: 'Flagship',
    stock: 18,
    rating: 4.95,
    numReviews: 84,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
    tags: ['oled', '4k', 'gaming', '240hz'],
    specs: {
      screenSize: '32 Inch',
      resolution: '3840 x 2160',
      refreshRate: '240Hz',
      panel: 'QD-OLED'
    },
    isFeatured: true,
    createdAt: new Date('2026-02-01').toISOString()
  },
  {
    id: 'prod_03',
    name: 'NeuralKey Pro Custom Mechanical Keyboard',
    slug: 'neuralkey-pro-mechanical-keyboard',
    description: 'Gasket-mounted CNC aluminum keyboard with hot-swappable tactile switches, RGB per-key illumination, and custom keycaps.',
    price: 189.50,
    originalPrice: 219.00,
    category: 'Peripherals',
    badge: 'Popular',
    stock: 62,
    rating: 4.8,
    numReviews: 95,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    tags: ['keyboard', 'mechanical', 'custom', 'rgb'],
    specs: {
      layout: '75% Compact',
      switchType: 'Neural Tactile Purple',
      connectivity: 'Tri-Mode Wireless & USB-C',
      body: 'Anodized Aluminum'
    },
    isFeatured: true,
    createdAt: new Date('2026-01-15').toISOString()
  },
  {
    id: 'prod_04',
    name: 'Horizon Ultra Smartwatch Gen 4',
    slug: 'horizon-ultra-smartwatch-gen-4',
    description: 'Sapphire glass smartwatch with titanium body, continuous health telemetry, dual-frequency GPS, and 14-day battery life.',
    price: 429.00,
    originalPrice: 479.00,
    category: 'Wearables',
    badge: 'New Arrival',
    stock: 30,
    rating: 4.75,
    numReviews: 67,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    tags: ['smartwatch', 'titanium', 'fitness', 'gps'],
    specs: {
      display: 'AMOLED Always-On',
      waterResistance: '100m / 10 ATM',
      sensors: 'ECG, SpO2, Temperature, Heart Rate',
      casing: 'Grade 5 Titanium'
    },
    isFeatured: true,
    createdAt: new Date('2026-03-01').toISOString()
  },
  {
    id: 'prod_05',
    name: 'Titanium Flux MagSafe Power Bank 20000mAh',
    slug: 'titanium-flux-magsafe-power-bank',
    description: 'Ultra-fast 100W PD bi-directional charging hub with integrated magnetic wireless charger and real-time OLED status display.',
    price: 89.99,
    originalPrice: 109.99,
    category: 'Accessories',
    badge: 'Essential',
    stock: 110,
    rating: 4.88,
    numReviews: 210,
    image: 'https://images.unsplash.com/photo-1609592424074-b52b57b9c3f1?auto=format&fit=crop&w=800&q=80',
    tags: ['powerbank', 'magsafe', '100w', 'charging'],
    specs: {
      capacity: '20,000 mAh',
      outputPower: '100W Max USB-C PD',
      display: 'Realtime Wattage OLED',
      weight: '380g'
    },
    isFeatured: false,
    createdAt: new Date('2026-02-12').toISOString()
  },
  {
    id: 'prod_06',
    name: 'Glassmorphic Ambience LED Desk Lamp',
    slug: 'glassmorphic-ambience-led-desk-lamp',
    description: 'Smart lighting element featuring addressable RGBW LEDs, capacitive touch sliders, and matter/Apple HomeKit integration.',
    price: 129.00,
    originalPrice: 149.00,
    category: 'Smart Home',
    badge: 'Design Award',
    stock: 40,
    rating: 4.7,
    numReviews: 44,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
    tags: ['lamp', 'smarthome', 'rgbw', 'lighting'],
    specs: {
      lumens: '1200 Lumens',
      colorTemp: '2700K - 6500K Tunable',
      protocol: 'Matter / Thread / Wi-Fi',
      material: 'Frosted Glass & Anodized Steel'
    },
    isFeatured: false,
    createdAt: new Date('2026-02-20').toISOString()
  }
];

const seedCategories = [
  { id: 'cat_01', name: 'Audio', slug: 'audio', count: 12, icon: 'headphones' },
  { id: 'cat_02', name: 'Displays', slug: 'displays', count: 6, icon: 'monitor' },
  { id: 'cat_03', name: 'Peripherals', slug: 'peripherals', count: 18, icon: 'keyboard' },
  { id: 'cat_04', name: 'Wearables', slug: 'wearables', count: 9, icon: 'watch' },
  { id: 'cat_05', name: 'Accessories', slug: 'accessories', count: 24, icon: 'zap' },
  { id: 'cat_06', name: 'Smart Home', slug: 'smart-home', count: 15, icon: 'home' }
];

module.exports = { seedProducts, seedCategories };
