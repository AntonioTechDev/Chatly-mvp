/**
 * Security Utilities
 *
 * Collection of security-related helper functions
 */

/**
 * Escapes special regex characters to prevent ReDoS attacks
 *
 * @param string - User input string
 * @returns Escaped string safe to use in RegExp
 *
 * @example
 * ```typescript
 * const userInput = "(a+)+"  // Potential ReDoS
 * const safeInput = escapeRegex(userInput)  // "\\(a\\+\\)\\+"
 * const regex = new RegExp(safeInput, 'gi')  // Safe to use
 * ```
 */
export function escapeRegex(string: string): string {
  // Escape special regex characters: . * + ? ^ $ { } ( ) | [ ] \
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Sanitizes user input for safe HTML display
 * Note: React already escapes by default, this is an extra layer
 *
 * @param input - User input string
 * @returns Sanitized string
 */
export function sanitizeHtml(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  return input.replace(/[&<>"'/]/g, (char) => map[char] || char)
}

/**
 * Validates email format
 *
 * @param email - Email string to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
  // Simple but effective email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates phone number (international format)
 *
 * @param phone - Phone number string
 * @returns true if valid phone format
 */
export function isValidPhone(phone: string): boolean {
  // Accepts formats: +391234567890, 1234567890, etc.
  const phoneRegex = /^\+?[0-9]{7,15}$/
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''))
}

/**
 * Truncates string to max length with ellipsis
 * Prevents UI overflow attacks
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
export function truncateString(str: string, maxLength: number = 1000): string {
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength) + '...'
}

/**
 * Rate limiter using closure
 * Prevents excessive function calls
 *
 * @param fn - Function to rate limit
 * @param delayMs - Delay in milliseconds
 * @returns Rate limited function
 */
export function rateLimit<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number = 1000
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delayMs)
  }
}

/**
 * Debounce function (executes after user stops typing)
 *
 * @param fn - Function to debounce
 * @param delayMs - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number = 300
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
    }, delayMs)
  }
}

/**
 * Generic input sanitizer
 * Removes potentially dangerous characters
 *
 * @param input - User input
 * @param maxLength - Maximum allowed length
 * @returns Sanitized input
 */
export function sanitizeInput(input: string, maxLength: number = 5000): string {
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '')

  // Truncate to max length
  sanitized = truncateString(sanitized, maxLength)

  // Trim whitespace
  sanitized = sanitized.trim()

  return sanitized
}

/**
 * Checks if string contains only safe characters
 * Useful for usernames, IDs, etc.
 *
 * @param input - String to check
 * @returns true if safe
 */
export function isSafeString(input: string): boolean {
  // Only alphanumeric, spaces, hyphens, underscores
  const safeRegex = /^[a-zA-Z0-9\s\-_]+$/
  return safeRegex.test(input)
}
