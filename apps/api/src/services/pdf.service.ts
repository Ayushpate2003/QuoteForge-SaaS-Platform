import puppeteer from 'puppeteer';
import { existsSync } from 'fs';
import { buildQuoteHTML } from './quote-html.service';

async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch asset: ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const mime = response.headers.get('content-type') || 'image/png';
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

export async function generateQuotePDF(html: string): Promise<Buffer> {
  const launchArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
  ];

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: launchArgs,
    });
  } catch (error) {
    // Fallbacks for environments where bundled Chromium is missing.
    const fallbackPaths = [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
    ].filter(Boolean) as string[];

    let launched = false;

    try {
      browser = await puppeteer.launch({
        headless: true,
        channel: 'chrome',
        args: launchArgs,
      });
      launched = true;
    } catch {
      // no-op, try explicit executable paths next
    }

    if (!launched) {
      for (const executablePath of fallbackPaths) {
        if (!existsSync(executablePath)) continue;
        try {
          browser = await puppeteer.launch({
            headless: true,
            executablePath,
            args: launchArgs,
          });
          launched = true;
          break;
        } catch {
          // keep trying other paths
        }
      }
    }

    if (!launched || !browser) {
      throw new Error(
        `Unable to launch Chrome for PDF generation. ${String(
          (error as Error)?.message || error
        )}. Install a browser with "npx puppeteer browsers install chrome" or set PUPPETEER_EXECUTABLE_PATH.`
      );
    }
  }

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');
  await new Promise((resolve) => setTimeout(resolve, 500));

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '8mm',
      right: '8mm',
      bottom: '8mm',
      left: '8mm',
    },
    preferCSSPageSize: false,
    scale: 1,
  });

  await browser.close();
  return Buffer.from(pdf);
}

export class PdfService {
  static async generateQuotePdf(quoteData: any): Promise<Buffer> {
    const quote = { ...quoteData };
    const firm = { ...(quote.firms || {}) };

    if (typeof firm.logo_url === 'string' && firm.logo_url.startsWith('http')) {
      firm.logo_url = await urlToBase64(firm.logo_url);
    }
    if (typeof firm.signature_url === 'string' && firm.signature_url.startsWith('http')) {
      firm.signature_url = await urlToBase64(firm.signature_url);
    }

    const html = buildQuoteHTML(quote, firm, quote.templates?.config || {});
    return generateQuotePDF(html);
  }
}
