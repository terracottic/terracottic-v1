import React from 'react';
import DOMPurify from 'dompurify';

// Configure DOMPurify with safe defaults
DOMPurify.setConfig({
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: [
        'p', 'br', 'b', 'i', 'em', 'strong', 'u', 's', 'ul', 'ol', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'blockquote', 'pre'
    ],
    ALLOWED_ATTR: [
        'href', 'target', 'rel', 'class', 'style', 'title', 'alt'
    ],
    ALLOW_UNKNOWN_PROTOCOLS: false,
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['on*', 'style']
});

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} dirty Html content to sanitize
 * @returns {string} Sanitized HTML
 */
export const sanitizeHtml = (dirty) => {
    if (!dirty) return '';
    return DOMPurify.sanitize(dirty);
};

/**
 * Wrapper component for safely rendering HTML content
 * @param {{html: string, [key: string]: any}} props
 * @returns {JSX.Element}
 */
export const SafeHtml = ({ html, ...props }) => {
    const clean = sanitizeHtml(html);
    return <div {...props} dangerouslySetInnerHTML={{ __html: clean }} />;
};

export default {
    sanitizeHtml,
    SafeHtml
};
