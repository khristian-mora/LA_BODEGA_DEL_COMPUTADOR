export const safeParse = (val, fallback = []) => {
    if (!val) return fallback;
    if (typeof val === 'object') return val;
    try { 
        const parsed = JSON.parse(val); 
        return parsed === null ? fallback : parsed;
    } catch { 
        // If it's a string but NOT valid JSON, return it as a single-item array
        // to maintain backward compatibility with old text-based fields.
        return typeof val === 'string' && val.trim() !== '' ? [val] : fallback; 
    }
};

export const safeStringify = (val) => {
    if (!val) return '';
    if (typeof val === 'string') {
        try {
            JSON.parse(val);
            return val;
        } catch {
            return val;
        }
    }
    return JSON.stringify(val);
};
