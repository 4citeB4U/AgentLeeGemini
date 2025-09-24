/* LEEWAY HEADER — DO NOT REMOVE
TAG: LEEWAY_SECURITY_UTILS
COLOR_ONION_HEX: NEON=#EF4444 FLUO=#F59E0B PASTEL=#FEF3C7
ICON_FAMILY: lucide
ICON_GLYPH: shield-check
ICON_SIG: LSU001
5WH: WHAT=Security utilities for input validation and sanitization; WHY=Protect against injection attacks and data leaks; WHO=Agent Lee Development Team; WHERE=D:\Agent-Lee_System\utils\security.tsx; WHEN=2025-09-22; HOW=TypeScript validation functions with DOMPurify
SPDX-License-Identifier: MIT
AGENTS: GEMINI, CLAUDE, GPT4, LLAMA, QWEN
*/

//#region Metadata
//#endregion

//#region Init  
import { logDiagnostic } from '../src/config';

export interface ValidationResult {
  isValid: boolean;
  sanitized: string;
  errors: string[];
  warnings: string[];
}

export interface SecurityConfig {
  maxLength: number;
  allowHtml: boolean;
  allowScripts: boolean;
  allowUrls: boolean;
  requireAuth: boolean;
}
//#endregion

//#region Public API
/**
 * Sanitizes user input to prevent XSS and injection attacks
 */
export const sanitizeInput = (input: string, config: Partial<SecurityConfig> = {}): ValidationResult => {
  const defaultConfig: SecurityConfig = {
    maxLength: 10000,
    allowHtml: false,
    allowScripts: false,
    allowUrls: true,
    requireAuth: false
  };

  const finalConfig = { ...defaultConfig, ...config };
  const errors: string[] = [];
  const warnings: string[] = [];
  let sanitized = input;

  // Log security operation
  logDiagnostic({
    level: 'INFO',
    module: 'Security',
    operation: 'sanitizeInput',
    message: 'Processing input sanitization',
    data: { inputLength: input.length, config: finalConfig },
    file_path: 'utils/security.tsx',
    line: 41
  });

  // Length validation
  if (input.length > finalConfig.maxLength) {
    errors.push(`Input exceeds maximum length of ${finalConfig.maxLength} characters`);
    sanitized = input.substring(0, finalConfig.maxLength);
    
    logDiagnostic({
      level: 'WARN',
      module: 'Security',
      operation: 'sanitizeInput',
      message: 'Input truncated due to length limit',
      data: { originalLength: input.length, maxLength: finalConfig.maxLength },
      file_path: 'utils/security.tsx',
      line: 51
    });
  }

  // HTML/Script detection and removal
  const htmlPattern = /<[^>]*>/g;
  const scriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  const onEventPattern = /\bon\w+\s*=/gi;

  if (scriptPattern.test(sanitized)) {
    errors.push('Script tags detected and removed');
    sanitized = sanitized.replace(scriptPattern, '');
    
    logDiagnostic({
      level: 'ERROR',
      module: 'Security',
      operation: 'sanitizeInput',
      message: 'Script injection attempt detected',
      data: { originalInput: input.substring(0, 100) + '...' },
      file_path: 'utils/security.tsx',
      line: 67
    });
  }

  if (onEventPattern.test(sanitized)) {
    warnings.push('Event handlers detected and removed');
    sanitized = sanitized.replace(onEventPattern, 'data-blocked-event=');
  }

  if (!finalConfig.allowHtml && htmlPattern.test(sanitized)) {
    warnings.push('HTML tags detected and escaped');
    sanitized = sanitized.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // URL validation if URLs are not allowed
  if (!finalConfig.allowUrls) {
    const urlPattern = /(https?:\/\/[^\s]+)/gi;
    if (urlPattern.test(sanitized)) {
      warnings.push('URLs detected and sanitized');
      sanitized = sanitized.replace(urlPattern, '[URL_REMOVED]');
    }
  }

  // SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(UNION\s+SELECT)/gi,
    /('|(\\')|('')|(%27)|(%3D))/gi
  ];

  sqlPatterns.forEach(pattern => {
    if (pattern.test(sanitized)) {
      errors.push('Potential SQL injection pattern detected');
      logDiagnostic({
        level: 'ERROR',
        module: 'Security',
        operation: 'sanitizeInput',
        message: 'SQL injection attempt detected',
        data: { pattern: pattern.toString() },
        file_path: 'utils/security.tsx',
        line: 96
      });
    }
  });

  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
    warnings
  };
};
//#endregion

//#region Internals
/**
 * Validates prompt boundaries to separate system rules from user data
 */
export const validatePromptBoundaries = (systemPrompt: string, userInput: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for prompt injection attempts
  const injectionPatterns = [
    /ignore\s+(all\s+)?previous\s+(instructions|prompts?)/gi,
    /forget\s+(everything|all\s+instructions)/gi,
    /new\s+(instructions?|prompt)/gi,
    /system\s*:\s*/gi,
    /assistant\s*:\s*/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi
  ];

  injectionPatterns.forEach(pattern => {
    if (pattern.test(userInput)) {
      errors.push('Prompt injection attempt detected');
      logDiagnostic({
        level: 'ERROR',
        module: 'Security',
        operation: 'validatePromptBoundaries',
        message: 'Prompt injection detected in user input',
        data: { pattern: pattern.toString() },
        file_path: 'utils/security.tsx',
        line: 127
      });
    }
  });

  // Ensure proper quoting of user content
  const quotedUserInput = `"""${userInput.replace(/"""/g, '\\"""')}"""`;

  return {
    isValid: errors.length === 0,
    sanitized: quotedUserInput,
    errors,
    warnings
  };
};

/**
 * Scans model output for potential data leaks
 */
export const scanModelOutput = (output: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Common patterns that might indicate data leaks
  const leakPatterns = [
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, type: 'email' },
    { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, type: 'SSN' },
    { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, type: 'credit card' },
    { pattern: /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/g, type: 'phone number' },
    { pattern: /\bAPI[_\s]?KEY[_\s]?[:=]\s*['""]?[\w\-]{20,}['""]?/gi, type: 'API key' }
  ];

  leakPatterns.forEach(({ pattern, type }) => {
    const matches = output.match(pattern);
    if (matches) {
      warnings.push(`Potential ${type} detected in output`);
      logDiagnostic({
        level: 'WARN',
        module: 'Security',
        operation: 'scanModelOutput',
        message: `Potential data leak: ${type}`,
        data: { matchCount: matches.length, type },
        file_path: 'utils/security.tsx',
        line: 157
      });
    }
  });

  return {
    isValid: true, // Output scanning doesn't invalidate, just warns
    sanitized: output,
    errors,
    warnings
  };
};
//#endregion

//#region I/O Operations
/**
 * Rate limiting utility
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  isAllowed(identifier: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const userRequests = this.requests.get(identifier)!;
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    this.requests.set(identifier, validRequests);
    
    if (validRequests.length >= maxRequests) {
      logDiagnostic({
        level: 'WARN',
        module: 'Security',
        operation: 'RateLimiter.isAllowed',
        message: 'Rate limit exceeded',
        data: { identifier, requestCount: validRequests.length, maxRequests },
        file_path: 'utils/security.tsx',
        line: 194
      });
      return false;
    }
    
    validRequests.push(now);
    return true;
  }
}

export const rateLimiter = new RateLimiter();
//#endregion

export default {
  sanitizeInput,
  validatePromptBoundaries,
  scanModelOutput,
  rateLimiter
};