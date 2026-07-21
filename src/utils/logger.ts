/**
 * Praxis Wealth Logger
 * Automatically redacts sensitive information from logs.
 * Use: import { log } from "@/src/utils/logger";
 *      log("User email: user@example.com", "amount: ₹5000");
 */

// Patterns to redact
const REDACT_PATTERNS = [
  // Email addresses
  { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL]' },
  // Phone numbers (Indian)
  { regex: /\b[6-9]\d{9}\b/g, replacement: '[PHONE]' },
  // Aadhaar (XXXX XXXX XXXX)
  { regex: /\b\d{4}\s?\d{4}\s?\d{4}\b/g, replacement: '[AADHAAR]' },
  // PAN (ABCDE1234F)
  { regex: /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g, replacement: '[PAN]' },
  // Amounts (₹ followed by numbers) - but we want to keep them? Actually we should redact large amounts? We'll keep amounts for debugging but can redact if needed.
  // For safety, redact any number that looks like a transaction amount? But we need amounts for debugging. We'll keep them.
  // Password-like strings (e.g., "password": "secret")
  { regex: /"password"\s*:\s*"[^"]*"/g, replacement: '"password":"[REDACTED]"' },
  { regex: /'password'\s*:\s*'[^']*'/g, replacement: "'password':'[REDACTED]'" },
  // Also any key containing "token", "secret", "key"
  { regex: /"(token|secret|api_key|auth)"\s*:\s*"[^"]*"/gi, replacement: '"$1":"[REDACTED]"' },
];

/**
 * Redact sensitive information from a string
 */
function redactString(str: string): string {
  let result = str;
  for (const pattern of REDACT_PATTERNS) {
    result = result.replace(pattern.regex, pattern.replacement);
  }
  return result;
}

/**
 * Redact an array of arguments (strings and objects)
 */
function redactArgs(args: any[]): any[] {
  return args.map(arg => {
    if (typeof arg === 'string') {
      return redactString(arg);
    }
    if (typeof arg === 'object' && arg !== null) {
      try {
        const json = JSON.stringify(arg);
        const redacted = redactString(json);
        return JSON.parse(redacted);
      } catch {
        return arg;
      }
    }
    return arg;
  });
}

// Store original console methods
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

// Override console methods with redaction
console.log = (...args: any[]) => {
  const redacted = redactArgs(args);
  originalLog(...redacted);
};

console.warn = (...args: any[]) => {
  const redacted = redactArgs(args);
  originalWarn(...redacted);
};

console.error = (...args: any[]) => {
  const redacted = redactArgs(args);
  originalError(...redacted);
};

// Export a helper for custom logging
export const log = {
  info: (...args: any[]) => console.log(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
};

// Prevent redaction for specific messages (if needed)
export const logRaw = {
  info: (...args: any[]) => originalLog(...args),
  warn: (...args: any[]) => originalWarn(...args),
  error: (...args: any[]) => originalError(...args),
};
