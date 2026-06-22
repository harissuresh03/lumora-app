// frontend/src/utils/articleFormatter.js

/**
 * Format plain text content with simple markers into HTML
 * Supports: # heading, ## subheading, * bullet points, > blockquote, --- divider
 */
export function formatArticleContent(content) {
  if (!content) return '';
  
  const lines = content.split('\n');
  let html = '';
  let inList = false;
  let listItems = [];
  let inBlockquote = false;
  let blockquoteItems = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) {
      // Close any open list
      if (inList) {
        html += '<ul class="article-list">' + listItems.join('') + '</ul>';
        inList = false;
        listItems = [];
      }
      // Close any open blockquote
      if (inBlockquote) {
        html += '<blockquote class="article-blockquote">' + blockquoteItems.join('') + '</blockquote>';
        inBlockquote = false;
        blockquoteItems = [];
      }
      continue;
    }
    
    // Check for Horizontal Rule
    if (trimmedLine === '---' || trimmedLine === '***' || trimmedLine === '___') {
      if (inList) {
        html += '<ul class="article-list">' + listItems.join('') + '</ul>';
        inList = false;
        listItems = [];
      }
      if (inBlockquote) {
        html += '<blockquote class="article-blockquote">' + blockquoteItems.join('') + '</blockquote>';
        inBlockquote = false;
        blockquoteItems = [];
      }
      html += '<hr class="article-divider" />';
      continue;
    }
    
    // Check for Main Heading (# )
    if (trimmedLine.startsWith('# ')) {
      if (inList) {
        html += '<ul class="article-list">' + listItems.join('') + '</ul>';
        inList = false;
        listItems = [];
      }
      if (inBlockquote) {
        html += '<blockquote class="article-blockquote">' + blockquoteItems.join('') + '</blockquote>';
        inBlockquote = false;
        blockquoteItems = [];
      }
      const text = trimmedLine.substring(2);
      html += `<h2 class="article-heading">${formatInlineText(text)}</h2>`;
      continue;
    }
    
    // Check for Subheading (## )
    if (trimmedLine.startsWith('## ')) {
      if (inList) {
        html += '<ul class="article-list">' + listItems.join('') + '</ul>';
        inList = false;
        listItems = [];
      }
      if (inBlockquote) {
        html += '<blockquote class="article-blockquote">' + blockquoteItems.join('') + '</blockquote>';
        inBlockquote = false;
        blockquoteItems = [];
      }
      const text = trimmedLine.substring(3);
      html += `<h3 class="article-subheading">${formatInlineText(text)}</h3>`;
      continue;
    }
    
    // Check for Blockquote (> )
    if (trimmedLine.startsWith('>')) {
      // Remove the > and any following space
      let text = trimmedLine.substring(1).trim();
      if (text) {
        blockquoteItems.push(formatInlineText(text));
        inBlockquote = true;
      }
      continue;
    }
    
    // If we were in a blockquote and this line doesn't start with >, close it
    if (inBlockquote) {
      html += '<blockquote class="article-blockquote">' + blockquoteItems.join('') + '</blockquote>';
      inBlockquote = false;
      blockquoteItems = [];
    }
    
    // Check for Bullet Points (* or -)
    if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
      const item = trimmedLine.substring(2);
      listItems.push(`<li>${formatInlineText(item)}</li>`);
      inList = true;
      continue;
    }
    
    // Check for Numbered List (1. 2. 3.)
    if (/^\d+\.\s/.test(trimmedLine)) {
      if (inList) {
        html += '<ul class="article-list">' + listItems.join('') + '</ul>';
        inList = false;
        listItems = [];
      }
      const item = trimmedLine.replace(/^\d+\.\s/, '');
      html += `<div class="article-numbered-item">${formatInlineText(item)}</div>`;
      continue;
    }
    
    // Regular paragraph
    if (inList) {
      html += '<ul class="article-list">' + listItems.join('') + '</ul>';
      inList = false;
      listItems = [];
    }
    
    html += `<p class="article-paragraph">${formatInlineText(trimmedLine)}</p>`;
  }
  
  // Close any open list
  if (inList) {
    html += '<ul class="article-list">' + listItems.join('') + '</ul>';
  }
  
  // Close any open blockquote
  if (inBlockquote) {
    html += '<blockquote class="article-blockquote">' + blockquoteItems.join('') + '</blockquote>';
  }
  
  return html;
}

/**
 * Format inline text: **bold**, *italic*, `code`
 */
function formatInlineText(text) {
  if (!text) return '';
  
  // Bold: **text**
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic: *text* (not at start of line which indicates bullet)
  text = text.replace(/(?<!\*)\*(?!\*)(.*?)\*(?!\*)/g, '<em>$1</em>');
  
  // Code: `text`
  text = text.replace(/`(.*?)`/g, '<code class="article-inline-code">$1</code>');
  
  return text;
}