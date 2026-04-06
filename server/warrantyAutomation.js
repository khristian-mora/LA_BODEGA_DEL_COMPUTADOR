import { db } from './db.js';
import { safeParse } from './utils.js';

const LABOR_WARRANTY_DAYS = 30;
const PARTS_WARRANTY_DAYS = 90;

export const createAutomatedRepairWarranty = async (ticketId) => {
    return new Promise((resolve, reject) => {
        const ticketSql = `
            SELECT id, customerId, deviceType, brand, model, serial, issueDescription, 
                   quoteItems, laborItems, repairNotes
            FROM tickets
            WHERE id = ?
        `;

        db.get(ticketSql, [ticketId], (err, ticket) => {
            if (err) return reject(err);
            if (!ticket) return reject(new Error('Ticket not found for automatic warranty creation'));

            const quoteItems = safeParse(ticket.quoteItems) || [];
            const laborItems = safeParse(ticket.laborItems) || [];
            
            const hasLabor = laborItems.length > 0;
            const hasParts = quoteItems.length > 0;

            if (!hasLabor && !hasParts) {
                console.log(`[WARRANTY-AUTO] No items found for warranty. Ticket: ${ticketId}`);
                return resolve(null);
            }

            const startDate = new Date();
            const createdAt = new Date().toISOString();
            const warrantiesCreated = [];

            const createWarranty = (days, type, terms) => {
                return new Promise((res, rej) => {
                    const endDate = new Date();
                    endDate.setDate(startDate.getDate() + days);
                    const startDateStr = startDate.toISOString().split('T')[0];
                    const endDateStr = endDate.toISOString().split('T')[0];

                    const insertSql = `
                        INSERT INTO warranties (
                            ticketId, customerId, startDate, endDate, terms, 
                            status, warrantyType, createdAt, notes, warrantyCategory
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;

                    const params = [
                        ticket.id,
                        ticket.customerId,
                        startDateStr,
                        endDateStr,
                        terms,
                        'Active',
                        'repair',
                        createdAt,
                        `Garantía generada automáticamente por entrega del ticket #${ticket.id}`,
                        type
                    ];

                    db.run(insertSql, params, function(err) {
                        if (err) return rej(err);
                        console.log(`[WARRANTY-AUTO] Created ${type} warranty ID: ${this.lastID} for Ticket: ${ticketId}`);
                        res(this.lastID);
                    });
                });
            };

            const promises = [];

            if (hasLabor) {
                const laborTerms = `Garantía de ${LABOR_WARRANTY_DAYS} días por reparación y servicio técnico (mano de obra) de ${ticket.deviceType} ${ticket.brand} ${ticket.model}. 
Cubre únicamente el trabajo de reparación realizado. No cubre daños por humedad, golpes o manipulación por terceros.`;
                promises.push(
                    createWarranty(LABOR_WARRANTY_DAYS, 'labor', laborTerms)
                        .then(id => warrantiesCreated.push({ id, type: 'labor', days: LABOR_WARRANTY_DAYS }))
                );
            }

            if (hasParts) {
                const partsTerms = `Garantía de ${PARTS_WARRANTY_DAYS} días por accesorios y partes reemplazadas en ${ticket.deviceType} ${ticket.brand} ${ticket.model}. 
Cubre únicamente los repuestos y accesorios instalados durante este servicio. No cubre daños por humedad, golpes o manipulación por terceros.`;
                promises.push(
                    createWarranty(PARTS_WARRANTY_DAYS, 'parts', partsTerms)
                        .then(id => warrantiesCreated.push({ id, type: 'parts', days: PARTS_WARRANTY_DAYS }))
                );
            }

            Promise.all(promises)
                .then(() => resolve(warrantiesCreated))
                .catch(err => reject(err));
        });
    });
};

export const getWarrantyPreview = (ticketId) => {
    return new Promise((resolve, reject) => {
        const ticketSql = `
            SELECT id, deviceType, brand, model, quoteItems, laborItems
            FROM tickets
            WHERE id = ?
        `;

        db.get(ticketSql, [ticketId], (err, ticket) => {
            if (err) return reject(err);
            if (!ticket) return reject(new Error('Ticket not found'));

            const quoteItems = safeParse(ticket.quoteItems) || [];
            const laborItems = safeParse(ticket.laborItems) || [];
            
            const preview = {
                hasLabor: laborItems.length > 0,
                hasParts: quoteItems.length > 0,
                laborWarrantyDays: LABOR_WARRANTY_DAYS,
                partsWarrantyDays: PARTS_WARRANTY_DAYS,
                laborTerms: laborItems.length > 0 ? `Garantía de ${LABOR_WARRANTY_DAYS} días por reparación y servicio técnico (mano de obra)` : null,
                partsTerms: quoteItems.length > 0 ? `Garantía de ${PARTS_WARRANTY_DAYS} días por accesorios y partes reemplazadas` : null,
                autoDetected: true
            };

            resolve(preview);
        });
    });
};

export const createCustomWarranty = async (ticketId, laborDays, partsDays) => {
    return new Promise((resolve, reject) => {
        const ticketSql = `
            SELECT id, customerId, deviceType, brand, model, serial, quoteItems, laborItems
            FROM tickets
            WHERE id = ?
        `;

        db.get(ticketSql, [ticketId], (err, ticket) => {
            if (err) return reject(err);
            if (!ticket) return reject(new Error('Ticket not found'));

            const quoteItems = safeParse(ticket.quoteItems) || [];
            const laborItems = safeParse(ticket.laborItems) || [];
            
            const startDate = new Date();
            const createdAt = new Date().toISOString();
            const warrantiesCreated = [];

            const createWarranty = (days, type, terms) => {
                return new Promise((res, rej) => {
                    const endDate = new Date();
                    endDate.setDate(startDate.getDate() + days);
                    const startDateStr = startDate.toISOString().split('T')[0];
                    const endDateStr = endDate.toISOString().split('T')[0];

                    const insertSql = `
                        INSERT INTO warranties (
                            ticketId, customerId, startDate, endDate, terms, 
                            status, warrantyType, createdAt, notes, warrantyCategory
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;

                    const params = [
                        ticket.id,
                        ticket.customerId,
                        startDateStr,
                        endDateStr,
                        terms,
                        'Active',
                        'repair',
                        createdAt,
                        `Garantía por entrega del ticket #${ticket.id}`,
                        type
                    ];

                    db.run(insertSql, params, function(err) {
                        if (err) return rej(err);
                        warrantiesCreated.push({ id: this.lastID, type, days });
                        res();
                    });
                });
            };

            const promises = [];

            if (laborDays > 0 && laborItems.length > 0) {
                const terms = `Garantía de ${laborDays} días por reparación y servicio técnico (mano de obra) de ${ticket.deviceType} ${ticket.brand} ${ticket.model}. 
Cubre únicamente el trabajo de reparación realizado.`;
                promises.push(createWarranty(laborDays, 'labor', terms));
            }

            if (partsDays > 0 && quoteItems.length > 0) {
                const terms = `Garantía de ${partsDays} días por accesorios y partes reemplazadas en ${ticket.deviceType} ${ticket.brand} ${ticket.model}. 
Cubre únicamente los repuestos y accesorios instalados.`;
                promises.push(createWarranty(partsDays, 'parts', terms));
            }

            Promise.all(promises)
                .then(() => resolve(warrantiesCreated))
                .catch(err => reject(err));
        });
    });
};
