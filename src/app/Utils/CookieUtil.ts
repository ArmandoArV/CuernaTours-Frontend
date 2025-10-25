/**
 * Cookie utility functions for managing browser cookies
 */

export interface CookieOptions {
  expires?: number; // Days from now
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Set a cookie with the specified name, value, and options
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Cookie options
 */
export const setCookie = (name: string, value: string, options: CookieOptions = {}): void => {
  if (typeof document === 'undefined') {
    // Server-side rendering protection
    return;
  }

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.expires) {
    const date = new Date();
    date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
    cookieString += `; expires=${date.toUTCString()}`;
  }

  if (options.path) {
    cookieString += `; path=${options.path}`;
  }

  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }

  if (options.secure) {
    cookieString += '; secure';
  }

  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`;
  }

  document.cookie = cookieString;
};

/**
 * Get a cookie value by name
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') {
    // Server-side rendering protection
    return null;
  }

  const nameEQ = encodeURIComponent(name) + "=";
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    let c = cookie.trim();
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length));
    }
  }

  return null;
};

/**
 * Delete a cookie by name
 * @param name - Cookie name
 * @param options - Cookie options (path and domain should match the original cookie)
 */
export const deleteCookie = (name: string, options: Omit<CookieOptions, 'expires'> = {}): void => {
  if (typeof document === 'undefined') {
    // Server-side rendering protection
    return;
  }

  setCookie(name, '', {
    ...options,
    expires: -1
  });
};

/**
 * Check if a cookie exists
 * @param name - Cookie name
 * @returns True if cookie exists, false otherwise
 */
export const hasCookie = (name: string): boolean => {
  return getCookie(name) !== null;
};

/**
 * Get all cookies as an object
 * @returns Object with cookie names as keys and values as values
 */
export const getAllCookies = (): Record<string, string> => {
  if (typeof document === 'undefined') {
    // Server-side rendering protection
    return {};
  }

  const cookies: Record<string, string> = {};
  
  if (document.cookie && document.cookie !== '') {
    const cookieArray = document.cookie.split(';');
    
    for (let cookie of cookieArray) {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[decodeURIComponent(name)] = decodeURIComponent(value);
      }
    }
  }

  return cookies;
};