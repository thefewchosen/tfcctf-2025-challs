const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

// Setup DOMPurify
const window = (new JSDOM('')).window;
const DOMPurify = createDOMPurify(window);

function sanitizeContent(content) {
    // Sanitize the note with DOMPurify
    content = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'div', 'span'],
        ALLOWED_ATTR: ['id', 'class', 'name', 'href', 'title']
    });

    // Make sure that no empty strings are left in the attributes values
    content = content.replace(/""/g, 'invalid-value');

    return content
}

module.exports = {
    sanitizeContent
  };