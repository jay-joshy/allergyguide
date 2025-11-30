// PACKAGES
// ============================================================================
import { marked } from "marked";

// TYPES & INTERFACES
// ============================================================================

interface JwtPayload {
  exp: number;
  [key: string]: any;
}

interface ContentResponse {
  content: string;
  fileType: "html" | "md" | "txt";
  path: string;
  contentType?: string; // For images
}

interface CacheData<T> {
  data: T; // actual content or dataUrl
  timestamp: number;
  // Specific for content cache
  fileType?: string;
  path?: string;
}

interface ImageProcessingMatch {
  fullMatch: string;
  beforeSrc: string;
  srcPath: string;
  afterSrc: string;
  dataUrl?: string;
}

// CLASS
// ============================================================================

/**
 * Handle authentication and loading of protected content from private repo
 * Content is fetched via Netlify serverless functions and requires JWT authentication.
 */
class ProtectedContentLoader {
  // CONSTANTS
  // ============================================================================
  static readonly TOKEN_EXPIRY_BUFFER_MS = 30000; // 30 seconds for clock skew
  static readonly MILLISECONDS_PER_SECOND = 1000;
  static readonly CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

  // PROPERTIES
  // ============================================================================
  private baseUrl: string;
  private imageUrl: string;
  private loginUrl: string;
  private storageKey: string;
  private contentCachePrefix: string;
  private imageCachePrefix: string;
  private imageCache: Map<string, string>;
  private debug: boolean;

  // LIFECYCLE & INITIALIZATION
  // ============================================================================
  constructor() {
    this.baseUrl = "/.netlify/functions/protected-content";
    this.imageUrl = "/.netlify/functions/protected-image";
    this.loginUrl = "/.netlify/functions/login";
    this.storageKey = "jwt-token";
    this.contentCachePrefix = "content-cache-";
    this.imageCachePrefix = "image-cache-";
    this.imageCache = new Map<string, string>();
    this.debug = true;
  }

  /**
   * Main entry point - loads protected content for a given container.
   */
  async loadProtectedContent(containerId: string, path: string): Promise<void> {
    const container = document.getElementById(containerId);
    const loadingText =
      container?.getAttribute("data-loading-text") ||
      "Loading protected content...";

    this.log("Starting to load protected content", { containerId, path });
    this.showLoading(containerId, loadingText);

    const token = this.getStoredToken();

    if (this.isTokenValid(token)) {
      this.log("Using stored JWT");
      await this.loadContentWithToken(containerId, path, token!);
    } else {
      this.log("No valid JWT found, showing login form");
      this.clearToken();
      this.showLoginForm(containerId);
    }
  }

  // TOKEN MANAGEMENT
  // ============================================================================

  /**
   * Retrieves the stored JWT token from localStorage.
   * @returns {string|null} The JWT token if it exists, null otherwise.
   */
  getStoredToken(): string | null {
    return localStorage.getItem(this.storageKey);
  }

  /**
   * Stores JWT token in localStorage.
   * @param {string} token - The JWT token to store.
   * @returns {void}
   */
  storeToken(token: string): void {
    localStorage.setItem(this.storageKey, token);
  }

  /**
   * Validates a JWT token and checks if it's still valid.
   * Adds a 30-second buffer for clock skew to account for time differences
   * between client and server.
   * @param {string|null} token - The JWT token to validate.
   * @returns {boolean} True if the token is valid and not expired, false otherwise.
   */
  isTokenValid(token: string | null): boolean {
    if (!token) return false;
    try {
      const payload: JwtPayload = JSON.parse(atob(token.split(".")[1]));
      const expiryTimeMs =
        payload.exp * ProtectedContentLoader.MILLISECONDS_PER_SECOND;
      const bufferTimeMs =
        Date.now() + ProtectedContentLoader.TOKEN_EXPIRY_BUFFER_MS;
      return expiryTimeMs > bufferTimeMs;
    } catch (e) {
      console.error("Failed to parse JWT:", e);
      return false;
    }
  }

  /**
   * Clears the stored token, image cache, and all cached content.
   * Called on logout or when token becomes invalid.
   * @returns {void}
   */
  clearToken(): void {
    localStorage.removeItem(this.storageKey);
    this.imageCache.clear();
    this.clearAllCaches();
  }

  /**
   * Clears all cached content and images from localStorage.
   * @returns {void}
   */
  clearAllCaches(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith(this.contentCachePrefix) ||
          key.startsWith(this.imageCachePrefix))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    this.log(`Cleared ${keysToRemove.length} cached items`);
  }

  /**
   * Checks if a cached item is still valid based on timestamp.
   * @param {number} timestamp - The timestamp when the item was cached.
   * @returns {boolean} True if the cache is still valid, false otherwise.
   */
  isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < ProtectedContentLoader.CACHE_EXPIRY_MS;
  }

  // AUTHENTICATION FLOW
  // ============================================================================

  /**
   * Displays the login form in the specified container.
   * Creates a form with username and password fields, and attaches a submit handler.
   * @param {string} containerId - The ID of the container element to render the form into.
   * @returns {void}
   */
  showLoginForm(containerId: string): void {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="protected-login-form">
          <h4>Protected Content - Login Required</h4>
          <form class="login-form">
            <div class="form-group">
              <label for="${containerId}-username">Username:</label>
              <input type="text" id="${containerId}-username" name="username" required>
            </div>
            <div class="form-group">
              <label for="${containerId}-password">Password:</label>
              <input type="password" id="${containerId}-password" name="password" required>
            </div>
            <button type="submit" class="login-button">Access Content</button>
            <div id="${containerId}-error" class="login-error" style="display: none;"></div>
          </form>
        </div>
      `;
      container
        .querySelector(".login-form")
        ?.addEventListener("submit", (event) => {
          event.preventDefault();
          this.submitLogin(containerId);
        });
    }
  }

  /**
   * Handles login form submission.
   * Sends credentials to the login endpoint and stores the returned JWT.
   * On success, automatically loads the protected content.
   * @param {string} containerId - The ID of the container element with the login form.
   * @returns {Promise<void>}
   */
  async submitLogin(containerId: string): Promise<void> {
    const usernameInput = document.getElementById(
      `${containerId}-username`,
    ) as HTMLInputElement;
    const passwordInput = document.getElementById(
      `${containerId}-password`,
    ) as HTMLInputElement;
    const errorDiv = document.getElementById(`${containerId}-error`);
    const button = document.querySelector(
      `#${containerId} .login-button`,
    ) as HTMLButtonElement;

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      this.showLoginError(
        containerId,
        "Please enter both username and password",
      );
      return;
    }

    if (button) {
      button.textContent = "Authenticating...";
      button.disabled = true;
    }
    if (errorDiv) errorDiv.style.display = "none";

    try {
      this.log("Fetching login URL:", this.loginUrl);
      const response = await fetch(this.loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      this.log("Response URL:", response.url);
      this.log("Response status:", response.status.toString());

      if (!response.ok) {
        let errorData: { error?: string };
        try {
          // We expect a JSON error body from our function, but Netlify might override it.
          errorData = await response.json();
        } catch (e) {
          // If JSON parsing fails, the body is likely HTML from Netlify's gateway.
          // Use a generic, user-friendly message based on status code
          if (response.status === 429) {
            throw new Error("Too many login attempts. Please try again later.");
          } else if (response.status === 404) {
            throw new Error("Login service unavailable.");
          } else {
            throw new Error("Unable to authenticate. Please try again.");
          }
        }
        throw new Error(
          errorData.error || "Authentication failed. Please try again.",
        );
      }

      const data = await response.json();
      this.storeToken(data.token);

      const container = document.getElementById(containerId);
      const path = container?.getAttribute("data-protected-path");

      if (path) {
        await this.loadContentWithToken(containerId, path, data.token);
      }
    } catch (error) {
      this.log("Login failed:", error);
      if (button) {
        button.textContent = "Access Content";
        button.disabled = false;
      }
      this.showLoginError(
        containerId,
        error instanceof Error ? error.message : "Authentication failed.",
      );
    }
  }

  /**
   * Displays an error message in the login form.
   * @param {string} containerId - The ID of the container element with the login form.
   * @param {string} message - The error message to display to the user.
   * @returns {void}
   */
  showLoginError(containerId: string, message: string): void {
    const errorDiv = document.getElementById(`${containerId}-error`);
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = "block";
    }
  }

  // CONTENT LOADING
  // ============================================================================

  /**
   * Loads and renders protected content using a valid JWT token.
   * If loading fails, clears the token and shows the login form.
   * @param {string} containerId - The ID of the container element to render content into.
   * @param {string} path - The path to the protected content file.
   * @param {string} token - The valid JWT token for authentication.
   * @returns {Promise<void>}
   */
  async loadContentWithToken(
    containerId: string,
    path: string,
    token: string,
  ): Promise<void> {
    try {
      const contentData = await this.fetchContent(path, token);
      await this.renderContent(
        contentData.content,
        contentData.fileType,
        containerId,
        token,
      );
      this.log("Content rendered successfully with token");
    } catch (error) {
      this.log("Failed to load content with token:", error);
      this.clearToken();
      this.showLoginForm(containerId);
      const userMessage =
        error instanceof Error
          ? error.message
          : "Your session has expired. Please log in again.";
      this.showLoginError(containerId, userMessage);
    }
  }

  /**
   * Gets cached content from localStorage.
   * @param {string} path - The path to the content file.
   * @returns {ContentResponse|null} The cached content object or null if not found/expired.
   */
  getCachedContent(path: string): ContentResponse | null {
    const cacheKey = this.contentCachePrefix + path;
    const cached = localStorage.getItem(cacheKey);
    if (!cached) {
      return null;
    }

    try {
      // We expect the stored string to match the ContentResponse + timestamp
      const data = JSON.parse(cached) as CacheData<string> & ContentResponse;
      if (this.isCacheValid(data.timestamp)) {
        this.log(`Using cached content for: ${path}`);
        return data;
      } else {
        this.log(`Cache expired for: ${path}`);
        localStorage.removeItem(cacheKey);
        return null;
      }
    } catch (e) {
      this.log(`Failed to parse cached content for: ${path}`, e);
      localStorage.removeItem(cacheKey);
      return null;
    }
  }

  /**
   * Stores content in localStorage cache.
   * @param {string} path - The path to the content file.
   * @param {ContentResponse} contentData - The content data object to cache.
   * @returns {void}
   */
  setCachedContent(path: string, contentData: ContentResponse): void {
    const cacheKey = this.contentCachePrefix + path;
    const cacheData = {
      ...contentData,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      this.log(`Cached content for: ${path}`);
    } catch (e) {
      this.log(`Failed to cache content for: ${path}`, e);
      // If localStorage is full, clear old caches and try again
      if (e instanceof DOMException && e.name === "QuotaExceededError") {
        this.log("localStorage quota exceeded, clearing old caches");
        this.clearAllCaches();
        try {
          localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (retryError) {
          this.log("Still failed to cache after clearing", retryError);
        }
      }
    }
  }

  /**
   * Fetches protected content from the backend or cache.
   * @param {string} path - The path to the content file in the private repository.
   * @param {string} token - The JWT token for authentication.
   * @returns {Promise<ContentResponse>}
   * @throws {Error} If the fetch fails or returns an error response.
   */
  async fetchContent(path: string, token: string): Promise<ContentResponse> {
    // Check cache first
    const cached = this.getCachedContent(path);
    if (cached) {
      return cached;
    }

    // Fetch from server
    const url = `${this.baseUrl}?path=${encodeURIComponent(path)}`;
    this.log("Fetching content from server:", url);
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load content.");
      } catch (e) {
        if (e instanceof Error && !e.message.includes("JSON")) {
          throw e; // Re-throw if it's our error
        }
        throw new Error("Failed to load content.");
      }
    }

    const contentData: ContentResponse = await response.json();
    // Cache the fetched content
    this.setCachedContent(path, contentData);
    return contentData;
  }

  /**
   * Renders content in the specified container.
   * Processes images first, then renders based on file type (HTML/Markdown/Text).
   * @param {string} content - The raw content to render.
   * @param {string} fileType - The type of content ('html', 'md', or other).
   * @param {string} containerId - The ID of the container element to render into.
   * @param {string} token - The JWT token for fetching images.
   * @returns {Promise<void>}
   * @throws {Error} If the container is not found or marked.js is not loaded for Markdown.
   */
  async renderContent(
    content: string,
    fileType: string,
    containerId: string,
    token: string,
  ): Promise<void> {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id '${containerId}' not found`);
    }

    const processedContent = await this.processImages(content, token);

    if (fileType === "html") {
      container.innerHTML = processedContent;
    } else if (fileType === "md") {
      if (typeof marked === "undefined") {
        throw new Error("Marked library not loaded");
      }
      container.innerHTML = await marked.parse(processedContent);
    } else {
      container.textContent = processedContent;
    }
  }

  // IMAGE PROCESSING
  // ============================================================================

  /**
   * Gets cached image from localStorage.
   * @param {string} imagePath - The path to the image file.
   * @returns {string|null} The cached data URL or null if not found/expired.
   */
  getCachedImage(imagePath: string): string | null {
    const cacheKey = this.imageCachePrefix + imagePath;
    const cached = localStorage.getItem(cacheKey);
    if (!cached) {
      return null;
    }

    try {
      const data = JSON.parse(cached) as { dataUrl: string; timestamp: number };
      if (this.isCacheValid(data.timestamp)) {
        this.log(`Using cached image for: ${imagePath}`);
        return data.dataUrl;
      } else {
        this.log(`Image cache expired for: ${imagePath}`);
        localStorage.removeItem(cacheKey);
        return null;
      }
    } catch (e) {
      this.log(`Failed to parse cached image for: ${imagePath}`, e);
      localStorage.removeItem(cacheKey);
      return null;
    }
  }

  /**
   * Stores image in localStorage cache.
   * @param {string} imagePath - The path to the image file.
   * @param {string} dataUrl - The base64 data URL to cache.
   * @returns {void}
   */
  setCachedImage(imagePath: string, dataUrl: string): void {
    const cacheKey = this.imageCachePrefix + imagePath;
    const cacheData = {
      dataUrl: dataUrl,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      this.log(`Cached image for: ${imagePath}`);
    } catch (e) {
      this.log(`Failed to cache image for: ${imagePath}`, e);
      // If localStorage is full, clear old caches and try again
      if (e instanceof DOMException && e.name === "QuotaExceededError") {
        this.log("localStorage quota exceeded for image, clearing old caches");
        this.clearAllCaches();
        try {
          localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (retryError) {
          this.log("Still failed to cache image after clearing", retryError);
        }
      }
    }
  }

  /**
   * Fetches a protected image from the backend or cache.
   * Images are cached in localStorage with expiry to avoid redundant requests.
   * Cache persists across page refreshes and is cleared on logout/token expiry.
   * @param {string} imagePath - The path to the image file in the private repository.
   * @param {string} token - The JWT token for authentication.
   * @returns {Promise<string>} A data URL containing the base64-encoded image.
   * @throws {Error} If the image fetch fails.
   */
  async fetchImage(imagePath: string, token: string): Promise<string> {
    // Check localStorage cache first
    const cached = this.getCachedImage(imagePath);
    if (cached) {
      // Also populate in-memory cache for faster subsequent access during same session
      this.imageCache.set(imagePath, cached);
      return cached;
    }

    // Check in-memory cache (faster than localStorage)
    if (this.imageCache.has(imagePath)) {
      return this.imageCache.get(imagePath)!;
    }

    // Fetch from server
    const url = `${this.imageUrl}?path=${encodeURIComponent(imagePath)}`;
    this.log(`Fetching image from server: ${url}`);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      this.log(`Failed to load image: ${imagePath} (${response.status})`);
      throw new Error("Failed to load image");
    }

    const data: { contentType: string; content: string } =
      await response.json();
    const dataUrl = `data:${data.contentType};base64,${data.content}`;

    // Cache in both localStorage and memory
    this.setCachedImage(imagePath, dataUrl);
    this.imageCache.set(imagePath, dataUrl);

    return dataUrl;
  }

  /**
   * Processes all images in the content HTML.
   * Finds img tags with relative paths and replaces them with base64 data URLs.
   * External URLs and data URIs are left unchanged.
   * @param {string} content - The HTML content containing img tags.
   * @param {string} token - The JWT token for fetching images.
   * @returns {Promise<string>} The processed content with images replaced by data URLs.
   */
  async processImages(content: string, token: string): Promise<string> {
    if (!token) return content;

    const imgRegex = /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi;
    const images: Omit<ImageProcessingMatch, "dataUrl">[] = [];
    let match: RegExpExecArray | null;

    while ((match = imgRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const beforeSrc = match[1];
      let srcPath = match[2];
      const afterSrc = match[3];

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = srcPath;
      srcPath = tempDiv.textContent || tempDiv.innerText || srcPath;

      if (!srcPath.startsWith("http") && !srcPath.startsWith("data:")) {
        const finalSrcPath = srcPath.startsWith("/")
          ? `static${srcPath}`
          : `static/${srcPath}`;
        images.push({ fullMatch, beforeSrc, srcPath: finalSrcPath, afterSrc });
      }
    }

    const imagePromises = images.map(async (img) => {
      try {
        const dataUrl = await this.fetchImage(img.srcPath, token);
        return { ...img, dataUrl };
      } catch (error) {
        console.warn(`Failed to process image ${img.srcPath}:`, error);
        return { ...img, dataUrl: null };
      }
    });

    const imageResults = await Promise.all(imagePromises);

    let processedContent = content;
    imageResults.forEach(
      ({ fullMatch, beforeSrc, afterSrc, dataUrl, srcPath }) => {
        const newImg = dataUrl
          ? `<img${beforeSrc}src="${dataUrl}"${afterSrc}>`
          : `<img${beforeSrc}src="#" alt="Failed to load: ${srcPath}" class="protected-image-error"${afterSrc}>`;
        processedContent = processedContent.replace(fullMatch, newImg);
      },
    );

    return processedContent;
  }

  // UI HELPERS
  // ============================================================================

  /**
   * Shows a loading message in the container.
   * @param {string} containerId - The ID of the container element.
   * @param {string} [loadingText="Loading protected content..."] - The loading message to display.
   * @returns {void}
   */
  showLoading(
    containerId: string,
    loadingText: string = "Loading protected content...",
  ): void {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `<div class="protected-loading">${loadingText}</div>`;
    }
  }

  /**
   * Logs a debug message if debug mode is enabled.
   * Prefixes all messages with [ProtectedLoader] for easy identification.
   * @param {string} message - The message to log.
   * @param {*} [data=null] - Optional data to log alongside the message.
   * @returns {void}
   */
  log(message: string, data: any = null): void {
    if (this.debug) {
      console.log(`[ProtectedLoader] ${message}`, data || "");
    }
  }
}

// GLOBAL INITIALIZATION & WINDOW DECLARATION
// ============================================================================

// Extend the Window interface to include our custom properties
declare global {
  interface Window {
    protectedLoader: ProtectedContentLoader;
    logoutProtectedContent: () => void;
  }
}

/**
 * Global instance of ProtectedContentLoader.
 * Accessible via window.protectedLoader for manual interactions.
 */
window.protectedLoader = new ProtectedContentLoader();

/**
 * Automatically loads protected content for all elements with data-protected-path attribute
 * when the DOM is ready.
 */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-protected-path]").forEach((element) => {
    const path = element.getAttribute("data-protected-path");
    if (path) {
      window.protectedLoader.loadProtectedContent(element.id, path);
    }
  });
});

/**
 * Global logout function.
 */
window.logoutProtectedContent = function (): void {
  window.protectedLoader.log("Logging out.");
  window.protectedLoader.clearToken();
  document.querySelectorAll("[data-protected-path]").forEach((element) => {
    window.protectedLoader.showLoginForm(element.id);
  });
};

export {}; // Ensures this is treated as a module
