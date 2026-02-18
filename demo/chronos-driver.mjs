/**
 * Chronos Demo Driver - Playwright CDP controller for Chronos Timekeeping
 *
 * Usage: node demo/chronos-driver.mjs <command> [args...]
 *
 * Commands:
 *   snapshot          - Get current UI state
 *   screenshot <path> - Take a screenshot
 *   click <selector>  - Click a CSS selector
 *   nav <tab>         - Navigate to sidebar tab (dashboard|projects|reports|settings)
 *   start-tracking    - Click the Start Tracking button
 *   stop-tracking     - Click the Stop Tracking button
 *   report <type>     - Switch report view (daily|weekly|monthly)
 *   settings <tab>    - Switch settings tab (general|tracking|privacy|advanced)
 *   eval <js>         - Evaluate JavaScript in the Chronos renderer
 */

import { chromium } from 'playwright';

const CDP_URL = process.env.CHRONOS_CDP_URL || 'http://localhost:9222';

async function getPage() {
  const browser = await chromium.connectOverCDP(CDP_URL);
  const contexts = browser.contexts();
  if (contexts.length === 0) throw new Error('No browser contexts found');
  const pages = contexts[0].pages();
  const page = pages.find(p => p.url().includes('index.html'));
  if (!page) throw new Error('Chronos main window not found');
  return { browser, page };
}

async function main() {
  const [,, command, ...args] = process.argv;
  if (!command) {
    console.log('Usage: node chronos-driver.mjs <command> [args...]');
    process.exit(1);
  }

  const { browser, page } = await getPage();

  try {
    switch (command) {
      case 'snapshot': {
        const elements = await page.evaluate(() => {
          const result = [];
          document.querySelectorAll('h1, h2, h3, button, nav, aside, [class*="tab"], [class*="active"]').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              result.push({
                tag: el.tagName,
                class: el.className,
                text: el.textContent.trim().substring(0, 60),
                visible: true
              });
            }
          });
          return result;
        });
        console.log(JSON.stringify(elements, null, 2));
        break;
      }

      case 'screenshot': {
        const path = args[0] || 'chronos-screenshot.png';
        await page.screenshot({ path, fullPage: false });
        console.log('Screenshot saved to: ' + path);
        break;
      }

      case 'click': {
        const selector = args[0];
        if (!selector) throw new Error('click requires a selector argument');
        await page.click(selector);
        console.log('Clicked: ' + selector);
        break;
      }

      case 'nav': {
        const tab = (args[0] || '').toLowerCase();
        const navMap = {
          dashboard: 'Dashboard',
          projects: 'Projects',
          reports: 'Reports',
          settings: 'Settings'
        };
        const label = navMap[tab];
        if (!label) throw new Error('nav requires: dashboard, projects, reports, or settings');
        await page.click(`button.nav-item:has-text("${label}")`);
        await page.waitForTimeout(500);
        console.log('Navigated to: ' + label);
        break;
      }

      case 'start-tracking': {
        await page.click('button:has-text("Start Tracking")');
        console.log('Started tracking');
        break;
      }

      case 'stop-tracking': {
        await page.click('button:has-text("Stop Tracking")');
        console.log('Stopped tracking');
        break;
      }

      case 'report': {
        const type = (args[0] || '').charAt(0).toUpperCase() + (args[0] || '').slice(1).toLowerCase();
        await page.click(`button:has-text("${type}")`);
        await page.waitForTimeout(300);
        console.log('Switched to report: ' + type);
        break;
      }

      case 'settings': {
        // First navigate to settings
        await page.click('button.nav-item:has-text("Settings")');
        await page.waitForTimeout(300);
        const tab = (args[0] || '').charAt(0).toUpperCase() + (args[0] || '').slice(1).toLowerCase();
        if (tab) {
          await page.click(`.settings-tabs button:has-text("${tab}")`);
          await page.waitForTimeout(300);
        }
        console.log('Settings tab: ' + tab);
        break;
      }

      case 'eval': {
        const js = args.join(' ');
        const result = await page.evaluate(js);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      default:
        console.error('Unknown command: ' + command);
        process.exit(1);
    }
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
