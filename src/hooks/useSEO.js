import { useEffect } from 'react';

/**
 * useSEO — Actualiza dinámicamente el <title>, metas y JSON-LD en cada página.
 *
 * @param {Object} options
 * @param {string} options.title        — Título de la página (sin sufijo)
 * @param {string} options.description  — Meta description
 * @param {string} [options.canonical]  — URL canónica completa
 * @param {string} [options.image]      — URL de imagen OG
 * @param {string} [options.type]       — og:type (default: "website")
 * @param {Object} [options.jsonLd]     — Objeto JSON-LD adicional para inyectar
 */
const SITE_NAME = 'La Bodega del Computador';
const BASE_URL = 'https://labodegadelcomputador.com';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;

const useSEO = ({
    title,
    description,
    canonical,
    image = DEFAULT_IMAGE,
    type = 'website',
    jsonLd = null,
}) => {
    useEffect(() => {
        const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

        // ── <title> ──────────────────────────────────────────────────────
        document.title = fullTitle;

        // ── Helper: set or create a <meta> ──────────────────────────────
        const setMeta = (selector, attrName, content) => {
            let el = document.querySelector(selector);
            if (!el) {
                el = document.createElement('meta');
                const parts = selector.match(/\[([^\]]+)\]/);
                if (parts) {
                    const [attr, value] = parts[1].split('=').map(s => s.replace(/"/g, ''));
                    el.setAttribute(attr, value);
                }
                document.head.appendChild(el);
            }
            el.setAttribute(attrName, content);
        };

        // ── Helper: set or create a <link> ───────────────────────────────
        const setLink = (rel, href) => {
            let el = document.querySelector(`link[rel="${rel}"]`);
            if (!el) {
                el = document.createElement('link');
                el.setAttribute('rel', rel);
                document.head.appendChild(el);
            }
            el.setAttribute('href', href);
        };

        // ── Standard metas ───────────────────────────────────────────────
        setMeta('meta[name="description"]', 'content', description);

        // ── Canonical ────────────────────────────────────────────────────
        if (canonical) setLink('canonical', canonical);

        // ── Open Graph ───────────────────────────────────────────────────
        setMeta('meta[property="og:title"]', 'content', fullTitle);
        setMeta('meta[property="og:description"]', 'content', description);
        setMeta('meta[property="og:type"]', 'content', type);
        setMeta('meta[property="og:image"]', 'content', image);
        if (canonical) setMeta('meta[property="og:url"]', 'content', canonical);

        // ── Twitter Card ─────────────────────────────────────────────────
        setMeta('meta[name="twitter:title"]', 'content', fullTitle);
        setMeta('meta[name="twitter:description"]', 'content', description);
        setMeta('meta[name="twitter:image"]', 'content', image);

        // ── JSON-LD ──────────────────────────────────────────────────────
        const SCRIPT_ID = 'seo-json-ld-dynamic';
        let scriptEl = document.getElementById(SCRIPT_ID);
        if (jsonLd) {
            const newContent = JSON.stringify(jsonLd);
            if (!scriptEl) {
                scriptEl = document.createElement('script');
                scriptEl.id = SCRIPT_ID;
                scriptEl.type = 'application/ld+json';
                scriptEl.textContent = newContent;
                document.head.appendChild(scriptEl);
            } else if (scriptEl.textContent !== newContent) {
                // Solo actualizar si el contenido es realmente diferente
                scriptEl.textContent = newContent;
            }
        } else if (scriptEl) {
            scriptEl.remove();
        }
    }, [title, description, canonical, image, type, jsonLd]);
};

export default useSEO;
