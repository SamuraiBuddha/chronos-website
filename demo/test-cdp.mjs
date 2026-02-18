import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://localhost:9222');
console.log('Connected:', browser.isConnected());

const contexts = browser.contexts();
console.log('Contexts:', contexts.length);

for (const ctx of contexts) {
  for (const page of ctx.pages()) {
    console.log('Title:', await page.title());
    console.log('URL:', page.url());

    // Get a snapshot of what's visible
    const snapshot = await page.evaluate(() => {
      const root = document.querySelector('#root');
      if (!root) return 'No #root element';
      // Get text content of major UI sections
      const texts = [];
      root.querySelectorAll('h1, h2, h3, button, [class*="nav"], [class*="sidebar"], [class*="tab"]').forEach(el => {
        texts.push(`${el.tagName}[${el.className}]: ${el.textContent.trim().substring(0, 80)}`);
      });
      return texts.join('\n');
    });
    console.log('UI Elements:\n' + snapshot);
  }
}

// Don't close - leave connection alive
browser.disconnect();
console.log('Disconnected (Chronos still running)');
