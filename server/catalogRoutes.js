// WhatsApp Catalog Routes
import { db } from './db.js';

export const getWhatsAppCatalog = (req, res) => {
    // Get host for absolute image URLs (set via X-Forwarded-Host if behind proxy)
    const host = req.get('host');
    const protocol = req.protocol;
    const baseUrl = `${protocol}://${host}`;

    const sql = `
        SELECT id, name, price, category, image, stock, description 
        FROM products 
        WHERE stock > 0
        ORDER BY featured DESC, id DESC
        LIMIT 20
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        // Format for WhatsApp: Absolute URLs and simplified structure
        const catalog = rows.map(p => ({
            id: p.id,
            title: p.name,
            description: p.description?.substring(0, 100) || '',
            price: p.price,
            currency: 'COP',
            image_url: p.image?.startsWith('http') ? p.image : `${baseUrl}${p.image}`,
            category: p.category,
            stock: p.stock,
            link: `${baseUrl}/shop/product/${p.id}`
        }));

        res.json({
            count: catalog.length,
            products: catalog
        });
    });
};
