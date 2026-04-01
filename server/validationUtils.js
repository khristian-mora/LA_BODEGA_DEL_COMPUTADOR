// Validación centralizada para todas las rutas
import { db } from './db.js';

// Validadores de tipos
export const validators = {
    // Validar email
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // Validar teléfono (formato colombiano básico)
    isValidPhone: (phone) => {
        if (!phone) return true; // Opcional
        const phoneRegex = /^(\+57|57)?[3][0-9]{9}$/;
        return phoneRegex.test(phone.replace(/\s|-/g, ''));
    },
    
    // Validar que no esté vacío
    isNotEmpty: (value, fieldName) => {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            return { valid: false, message: `${fieldName} es requerido` };
        }
        return { valid: true };
    },
    
    // Validar longitud mínima
    minLength: (value, min, fieldName) => {
        if (!value || value.length < min) {
            return { valid: false, message: `${fieldName} debe tener al menos ${min} caracteres` };
        }
        return { valid: true };
    },
    
    // Validar longitud máxima
    maxLength: (value, max, fieldName) => {
        if (value && value.length > max) {
            return { valid: false, message: `${fieldName} no puede exceder ${max} caracteres` };
        }
        return { valid: true };
    },
    
    // Validar número positivo
    isPositiveNumber: (value, fieldName) => {
        if (value === undefined || value === null) return { valid: true };
        if (isNaN(value) || parseFloat(value) < 0) {
            return { valid: false, message: `${fieldName} debe ser un número positivo` };
        }
        return { valid: true };
    },
    
    // Validar fecha ISO
    isValidDate: (dateString, fieldName) => {
        if (!dateString) return { valid: true };
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return { valid: false, message: `${fieldName} debe ser una fecha válida (ISO format)` };
        }
        return { valid: true };
    },
    
    // Validar ID único (para updates)
    existsInTable: async (table, id, fieldName = 'ID') => {
        return new Promise((resolve) => {
            db.get(`SELECT id FROM ${table} WHERE id = ?`, [id], (err, row) => {
                if (err || !row) {
                    resolve({ valid: false, message: `${fieldName} no encontrado` });
                } else {
                    resolve({ valid: true });
                }
            });
        });
    },
    
    // Validar email único
    isEmailUnique: async (email, excludeId = null) => {
        return new Promise((resolve) => {
            let sql = 'SELECT id FROM customers WHERE email = ?';
            let params = [email];
            
            if (excludeId) {
                sql += ' AND id != ?';
                params.push(excludeId);
            }
            
            db.get(sql, params, (err, row) => {
                if (row) {
                    resolve({ valid: false, message: 'El email ya está registrado' });
                } else {
                    resolve({ valid: true });
                }
            });
        });
    },
    
    // Validar teléfono único
    isPhoneUnique: async (phone, excludeId = null) => {
        return new Promise((resolve) => {
            if (!phone) return resolve({ valid: true });
            
            let sql = 'SELECT id FROM customers WHERE phone = ?';
            let params = [phone];
            
            if (excludeId) {
                sql += ' AND id != ?';
                params.push(excludeId);
            }
            
            db.get(sql, params, (err, row) => {
                if (row) {
                    resolve({ valid: false, message: 'El teléfono ya está registrado' });
                } else {
                    resolve({ valid: true });
                }
            });
        });
    }
};

// Middleware de validación genérico
export const validate = (validations) => {
    return async (req, res, next) => {
        const errors = [];
        
        for (const validation of validations) {
            const { field, checks } = validation;
            const value = req.body[field];
            
            for (const check of checks) {
                let result;
                
                if (typeof check.validator === 'function') {
                    result = check.validator(value, check.param);
                } else if (check.validator === 'async') {
                    result = await check.asyncValidator(value, req.body, req.params);
                }
                
                if (result && !result.valid) {
                    errors.push(result.message);
                    break; // Solo primer error por campo
                }
            }
        }
        
        if (errors.length > 0) {
            return res.status(400).json({ 
                error: 'Validación fallida', 
                details: errors 
            });
        }
        
        next();
    };
};

// Validaciones predefinidas para entidades comunes
export const customerValidations = [
    { 
        field: 'name', 
        checks: [
            { validator: (val) => validators.isNotEmpty(val, 'Nombre') },
            { validator: (val) => validators.minLength(val, 2, 'Nombre') },
            { validator: (val) => validators.maxLength(val, 100, 'Nombre') }
        ]
    },
    { 
        field: 'email', 
        checks: [
            { validator: (val) => !val || validators.isValidEmail(val) ? { valid: true } : { valid: false, message: 'Email inválido' } },
            { validator: 'async', asyncValidator: async (val, body, params) => {
                if (!val) return { valid: true };
                return await validators.isEmailUnique(val, params.id);
            }}
        ]
    },
    { 
        field: 'phone', 
        checks: [
            { validator: (val) => !val || validators.isValidPhone(val) ? { valid: true } : { valid: false, message: 'Teléfono inválido (formato: +573XXXXXXXXX)' } },
            { validator: 'async', asyncValidator: async (val, body, params) => {
                if (!val) return { valid: true };
                return await validators.isPhoneUnique(val, params.id);
            }}
        ]
    },
    {
        field: 'customerType',
        checks: [
            { validator: (val) => {
                const validTypes = ['Regular', 'VIP', 'Mayorista', 'Nuevo'];
                return !val || validTypes.includes(val) ? { valid: true } : { valid: false, message: `Tipo debe ser: ${validTypes.join(', ')}` };
            }}
        ]
    }
];

export const orderValidations = [
    { 
        field: 'customerName', 
        checks: [
            { validator: (val) => validators.isNotEmpty(val, 'Nombre del cliente') }
        ]
    },
    { 
        field: 'customerEmail', 
        checks: [
            { validator: (val) => !val || validators.isValidEmail(val) ? { valid: true } : { valid: false, message: 'Email inválido' } }
        ]
    },
    { 
        field: 'customerPhone', 
        checks: [
            { validator: (val) => validators.isNotEmpty(val, 'Teléfono') },
            { validator: (val) => validators.isValidPhone(val) ? { valid: true } : { valid: false, message: 'Teléfono inválido' } }
        ]
    },
    { 
        field: 'items', 
        checks: [
            { validator: (val) => {
                if (!val || !Array.isArray(val) || val.length === 0) {
                    return { valid: false, message: 'El pedido debe tener al menos un producto' };
                }
                return { valid: true };
            }}
        ]
    },
    { 
        field: 'total', 
        checks: [
            { validator: (val) => validators.isPositiveNumber(val, 'Total') },
            { validator: (val) => {
                if (val <= 0) return { valid: false, message: 'El total debe ser mayor a 0' };
                return { valid: true };
            }}
        ]
    }
];

export const expenseValidations = [
    { 
        field: 'description', 
        checks: [
            { validator: (val) => validators.isNotEmpty(val, 'Descripción') },
            { validator: (val) => validators.maxLength(val, 255, 'Descripción') }
        ]
    },
    { 
        field: 'amount', 
        checks: [
            { validator: (val) => validators.isNotEmpty(val, 'Monto') },
            { validator: (val) => validators.isPositiveNumber(val, 'Monto') },
            { validator: (val) => {
                if (val <= 0) return { valid: false, message: 'El monto debe ser mayor a 0' };
                return { valid: true };
            }}
        ]
    },
    { 
        field: 'date', 
        checks: [
            { validator: (val) => validators.isValidDate(val, 'Fecha') }
        ]
    }
];

export const employeeValidations = [
    { 
        field: 'name', 
        checks: [
            { validator: (val) => validators.isNotEmpty(val, 'Nombre') },
            { validator: (val) => validators.minLength(val, 2, 'Nombre') },
            { validator: (val) => validators.maxLength(val, 100, 'Nombre') }
        ]
    },
    { 
        field: 'role', 
        checks: [
            { validator: (val) => validators.isNotEmpty(val, 'Cargo') }
        ]
    },
    { 
        field: 'salary', 
        checks: [
            { validator: (val) => validators.isPositiveNumber(val, 'Salario') }
        ]
    },
    { 
        field: 'email', 
        checks: [
            { validator: (val) => !val || validators.isValidEmail(val) ? { valid: true } : { valid: false, message: 'Email inválido' } }
        ]
    }
];
