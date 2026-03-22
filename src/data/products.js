export const products = [
    // Portátiles
    {
        id: 1,
        name: "MacBook Pro 16 M3 Max",
        category: "Laptops",
        price: 16999000,
        oldPrice: 18500000,
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1000&auto=format&fit=crop",
        specs: { processor: "M3 Max", ram: "36GB", storage: "1TB SSD", screen: "16.2 Liquid Retina XDR" },
        description: "La laptop más potente para profesionales creativos. Rendimiento extremo y batería para todo el día.",
        featured: true,
        gaming: false
    },
    {
        id: 2,
        name: "ASUS ROG Zephyrus G14",
        category: "Laptops",
        price: 8499000,
        oldPrice: 9200000,
        image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=1000&auto=format&fit=crop",
        specs: { processor: "Ryzen 9 7940HS", ram: "16GB", storage: "1TB SSD", screen: "14 OLED 120Hz" },
        description: "Gaming ultra-portátil con pantalla OLED y diseño premium.",
        featured: true,
        gaming: true
    },
    {
        id: 3,
        name: "Dell XPS 15 9530",
        category: "Laptops",
        price: 11200000,
        oldPrice: null,
        image: "https://images.unsplash.com/photo-1593642632823-8f78536788c6?q=80&w=1000&auto=format&fit=crop",
        specs: { processor: "Core i7-13700H", ram: "32GB", storage: "1TB SSD", screen: "15.6 FHD+" },
        description: "El equilibrio perfecto entre potencia y elegancia para negocios.",
        featured: false,
        gaming: false
    },
    {
        id: 4,
        name: "Lenovo Legion Pro 5i",
        category: "Laptops",
        price: 7800000,
        oldPrice: 8500000,
        image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=1000&auto=format&fit=crop", // Placeholder image similar to gaming laptop
        specs: { processor: "Core i7-13700HX", ram: "16GB", storage: "1TB SSD", graphics: "RTX 4060" },
        description: "Diseñada para dominar en eSports con refrigeración avanzada.",
        featured: true,
        gaming: true
    },
    {
        id: 5,
        name: "HP Spectre x360 14",
        category: "Laptops",
        price: 6500000,
        oldPrice: 7200000,
        image: "https://images.unsplash.com/photo-1544731612-de7f96afe55f?q=80&w=1000&auto=format&fit=crop",
        specs: { processor: "Core ultra 7", ram: "16GB", storage: "1TB SSD", screen: "14 OLED Touch" },
        description: "Versatilidad 2 en 1 con dieño de joya y lápiz incluido.",
        featured: false,
        gaming: false
    },

    // PCs Gamer / Desktop
    {
        id: 6,
        name: "PC Gamer Extreme Build",
        category: "Desktops",
        price: 12500000,
        oldPrice: null,
        image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=1000&auto=format&fit=crop",
        specs: { processor: "Core i9-14900K", ram: "64GB DDR5", storage: "2TB NVMe", graphics: "RTX 4080" },
        description: "Nuestra construcción personalizada más potente. Corre todo en 4K Ultra.",
        featured: true,
        gaming: true
    },
    {
        id: 7,
        name: "NZXT Starter Pro",
        category: "Desktops",
        price: 4900000,
        oldPrice: 5300000,
        image: "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?q=80&w=1000&auto=format&fit=crop",
        specs: { processor: "Core i5-13400F", ram: "16GB", storage: "1TB SSD", graphics: "RTX 4060" },
        description: "El punto de entrada perfecto al PC Gaming de alto nivel.",
        featured: false,
        gaming: true
    },
    {
        id: 8,
        name: "Workstation Creator Studio",
        category: "Desktops",
        price: 18900000,
        oldPrice: null,
        image: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=1000&auto=format&fit=crop",
        specs: { processor: "Threadripper 7000", ram: "128GB", storage: "4TB RAID", graphics: "RTX 6000 Ada" },
        description: "Para renderizado 3D, edición 8K y simulación científica.",
        featured: false,
        gaming: false
    },

    // Periféricos / Accesorios
    {
        id: 9,
        name: "Monitor LG UltraGear 27",
        category: "Monitors",
        price: 1800000,
        oldPrice: 2100000,
        image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=1000&auto=format&fit=crop",
        specs: { size: "27 inch", resolution: "1440p", refresh: "165Hz", panel: "IPS" },
        description: "Velocidad y color increíbles para la ventaja competitiva.",
        featured: true
    },
    {
        id: 10,
        name: "Logitech G Pro X Superlight 2",
        category: "Peripherals",
        price: 650000,
        oldPrice: null,
        image: "https://images.unsplash.com/photo-1615663245857-acda57799885?q=80&w=1000&auto=format&fit=crop",
        specs: { type: "Wireless Mouse", weight: "60g", sensor: "Hero 2" },
        description: "El ratón de elección para los profesionales de eSports. Ultraligero.",
        featured: true
    },
    {
        id: 11,
        name: "Teclado Keychron Q1 Pro",
        category: "Peripherals",
        price: 950000,
        oldPrice: 1100000,
        image: "https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=1000&auto=format&fit=crop",
        specs: { switch: "Gateron Brown", layout: "75%", connection: "Bluetooth/Wired" },
        description: "Cuerpo de aluminio, juntas flexibles y sonido premium.",
        featured: false,
        gaming: true
    },
    {
        id: 12,
        name: "Auriculares Sony WH-1000XM5",
        category: "Audio",
        price: 1499000,
        oldPrice: 1699000,
        image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=1000&auto=format&fit=crop",
        specs: { type: "Noise Cancelling", battery: "30h", driver: "30mm" },
        description: "La mejor cancelación de ruido del mercado con sonido cristalino.",
        featured: true
    },
    {
        id: 13,
        name: "Samsung Odyssey G9 OLED",
        category: "Monitors",
        price: 6500000,
        oldPrice: 7900000,
        image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=1000&auto=format&fit=crop", // Generic monitor placeholder
        specs: { size: "49 inch", resolution: "DQHD", refresh: "240Hz", panel: "OLED" },
        description: "Inmersión total con el monitor curvo definitivo.",
        featured: true,
        gaming: true
    },
    {
        id: 14,
        name: "NVIDIA RTX 4070 Ti Super",
        category: "Components",
        price: 4200000,
        oldPrice: null,
        image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=1000&auto=format&fit=crop",
        specs: { vram: "16GB GDDR6X", cuda: "8448", clock: "2.6GHz" },
        description: "Potencia bruta para 1440p gaming y creación de contenido.",
        featured: false,
        gaming: true
    },
    {
        id: 15,
        name: "Intel Core i7-14700K",
        category: "Components",
        price: 1950000,
        oldPrice: 2100000,
        image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?q=80&w=1000&auto=format&fit=crop",
        specs: { cores: "20 (8P + 12E)", threads: "28", boost: "5.6GHz" },
        description: "El rey del rendimiento multi-hilo para productividad y juegos.",
        featured: false,
        gaming: true
    },
    // Impresoras
    {
        id: 16,
        name: "Epson EcoTank L3250",
        category: "Printers",
        price: 890000,
        oldPrice: 1050000,
        image: "https://images.unsplash.com/photo-1612815154858-60aa4c4603e1?q=80&w=1000&auto=format&fit=crop",
        specs: { type: "Multifuncional", system: "Tinta Continua", connection: "Wi-Fi" },
        description: "Imprime, copia y escanea con gran economía y libertad inalámbrica.",
        featured: true,
        gaming: false
    },
    {
        id: 17,
        name: "HP Laser 107w",
        category: "Printers",
        price: 650000,
        oldPrice: null,
        image: "https://images.unsplash.com/photo-1588611910606-25e255eb7984?q=80&w=1000&auto=format&fit=crop", // Generic laser printer
        specs: { type: "Láser Monocromática", speed: "20 ppm", connection: "Wi-Fi" },
        description: "Calidad láser legendaria a un precio asequible. Ideal para oficina en casa.",
        featured: false,
        gaming: false
    },
    {
        id: 18,
        name: "Canon PIXMA G3110",
        category: "Printers",
        price: 780000,
        oldPrice: 850000,
        image: "https://images.unsplash.com/photo-1612815154858-60aa4c4603e1?q=80&w=1000&auto=format&fit=crop", // Generic tank printer
        specs: { type: "Multifuncional", system: "Tanque de Tinta", connection: "Wi-Fi" },
        description: "Maximiza la productividad y reduce costos de impresión.",
        featured: false,
        gaming: false
    },
    // Mobiliario
    {
        id: 19,
        name: "Silla Gamer Corsair T3 Rush",
        category: "Furniture",
        price: 1450000,
        oldPrice: 1600000,
        image: "https://images.unsplash.com/photo-1598550476439-6847785fcea6?q=80&w=1000&auto=format&fit=crop",
        specs: { material: "Tela Suave", type: "Ergonómica", weight: "Max 120kg" },
        description: "Comodidad transpirable para largas sesiones de juego. Diseño inspirado en competición.",
        featured: true,
        gaming: true
    },
    {
        id: 20,
        name: "Escritorio Elevable Automático",
        category: "Furniture",
        price: 2100000,
        oldPrice: null,
        image: "https://images.unsplash.com/photo-1595515106968-40ea463f6994?q=80&w=1000&auto=format&fit=crop",
        specs: { motors: "Dual Motor", size: "140x70cm", memory: "4 Presets" },
        description: "Trabaja sentado o de pie. Salud y productividad para tu oficina en casa.",
        featured: false,
        gaming: false
    },
    {
        id: 21,
        name: "Silla Ejecutiva Herman Miller Style",
        category: "Furniture",
        price: 980000,
        oldPrice: 1200000,
        image: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?q=80&w=1000&auto=format&fit=crop",
        specs: { mesh: "Premium", support: "Lumbar Ajustable", base: "Cromo" },
        description: "Elegancia y soporte total para profesionales exigentes.",
        featured: false,
        gaming: false
    },
    {
        id: 22,
        name: "Escritorio Gamer RGB Z-Frame",
        category: "Furniture",
        price: 750000,
        oldPrice: 890000,
        image: "https://images.unsplash.com/photo-1628104383637-bebca4316a7e?q=80&w=1000&auto=format&fit=crop",
        specs: { width: "120cm", lighting: "LED RGB", accessories: "Portavasos" },
        description: "La base perfecta para tu setup gaming con iluminación inmersiva.",
        featured: false,
        gaming: true
    },
    // Componentes Extra para Builder
    {
        id: 23,
        name: "ASUS ROG Strix Z790-E Gaming WiFi",
        category: "Motherboards",
        price: 2450000,
        oldPrice: null,
        image: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=1000&auto=format&fit=crop", // Motherboard placeholder
        specs: { socket: "LGA1700", chipset: "Z790", wifi: "6E" },
        description: "Base sólida para overclocking y gaming de alto rendimiento.",
        featured: false,
        gaming: true
    },
    {
        id: 24,
        name: "Corsair Vengeance RGB 32GB (2x16GB) DDR5",
        category: "RAM",
        price: 780000,
        oldPrice: 850000,
        image: "https://images.unsplash.com/photo-1562976540-1502c2145186?q=80&w=1000&auto=format&fit=crop", // RAM placeholder
        specs: { speed: "6000MHz", latency: "CL30", capacity: "32GB" },
        description: "Velocidad extrema y RGB sincronizable.",
        featured: false,
        gaming: true
    },
    {
        id: 25,
        name: "Samsung 990 PRO 2TB NVMe",
        category: "Storage",
        price: 950000,
        oldPrice: 1100000,
        image: "https://images.unsplash.com/photo-1628557044797-f21a177c37ec?q=80&w=1000&auto=format&fit=crop", // SSD placeholder
        specs: { speed: "7450 MB/s", type: "M.2 Gen4", capacity: "2TB" },
        description: "El almacenamiento más rápido para tiempos de carga inexistentes.",
        featured: false,
        gaming: true
    },
    {
        id: 26,
        name: "Corsair RM850x 80+ Gold",
        category: "PSU",
        price: 680000,
        oldPrice: null,
        image: "https://images.unsplash.com/photo-1587202372616-b4345a271442?q=80&w=1000&auto=format&fit=crop", // PSU placeholder
        specs: { power: "850W", efficiency: "Gold", modular: "Full" },
        description: "Energía confiable y silenciosa para tu sistema.",
        featured: false,
        gaming: true
    },
    {
        id: 27,
        name: "NZXT H9 Flow",
        category: "Cases",
        price: 890000,
        oldPrice: 950000,
        image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=1000&auto=format&fit=crop", // Case placeholder
        specs: { format: "ATX Mid", glass: "Dual Chamber", fans: "4 included" },
        description: "Exhibe tu obra maestra con flujo de aire superior.",
        featured: false,
        gaming: true
    }
];

// Add gaming: true/false property to existing items for simpler filtering
// (Note: In a real DB this would be a column/tag. Here we simulated it in the objects effectively)
export const allCategories = [
    { id: 'laptops', name: 'Portátiles', count: 5 },
    { id: 'desktops', name: 'PCs de Escritorio', count: 3 },
    { id: 'monitors', name: 'Monitores', count: 2 },
    { id: 'components', name: 'Componentes', count: 2 },
    { id: 'peripherals', name: 'Periféricos', count: 2 },
    { id: 'printers', name: 'Impresoras', count: 3 },
    { id: 'furniture', name: 'Mobiliario', count: 4 },
    { id: 'audio', name: 'Audio', count: 1 },
];
