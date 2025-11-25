// protected.js
class ProtectedContentLoader {
  constructor() {
    this.baseUrl = '/.netlify/functions/protected-content';
    this.imageUrl = '/.netlify/functions/protected-image';
    this.loginUrl = '/.netlify/functions/login';
    this.storageKey = 'jwt-token';
    this.imageCache = new Map();
    this.debug = true;
  }

  log(message, data = null) {
    if (this.debug) {
      console.log(`[ProtectedLoader] ${message}`, data || '');
    }
  }

  isTokenValid(token) {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Add a 30-second buffer for clock skew
      return payload.exp * 1000 > Date.now() - 30000;
    } catch (e) {
      console.error('Failed to parse JWT:', e);
      return false;
    }
  }

  getStoredToken() {
    return localStorage.getItem(this.storageKey);
  }

  storeToken(token) {
    localStorage.setItem(this.storageKey, token);
  }

  clearToken() {
    localStorage.removeItem(this.storageKey);
    this.imageCache.clear();
  }

  showLoginForm(containerId) {
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
      container.querySelector('.login-form').addEventListener('submit', (event) => {
        event.preventDefault();
        this.submitLogin(containerId);
      });
    }
  }

  async submitLogin(containerId) {
    const username = document.getElementById(`${containerId}-username`).value.trim();
    const password = document.getElementById(`${containerId}-password`).value;
    const errorDiv = document.getElementById(`${containerId}-error`);
    const button = document.querySelector(`#${containerId} .login-button`);

    if (!username || !password) {
      this.showLoginError(containerId, 'Please enter both username and password');
      return;
    }

    button.textContent = 'Authenticating...';
    button.disabled = true;
    errorDiv.style.display = 'none';

    try {
      const response = await fetch(this.loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      this.storeToken(data.token);
      const path = document.getElementById(containerId).getAttribute('data-protected-path');
      await this.loadContentWithToken(containerId, path, data.token);

    } catch (error) {
      this.log('Login failed:', error);
      button.textContent = 'Access Content';
      button.disabled = false;
      this.showLoginError(containerId, error.message || 'Authentication failed.');
    }
  }

  showLoginError(containerId, message) {
    const errorDiv = document.getElementById(`${containerId}-error`);
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    }
  }

  async loadContentWithToken(containerId, path, token) {
    try {
      const contentData = await this.fetchContent(path, token);
      const basePath = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '';
      await this.renderContent(contentData.content, contentData.fileType, containerId, token, basePath);
      this.log('Content rendered successfully with token');
    } catch (error) {
      this.log('Failed to load content with token:', error);
      this.clearToken();
      this.showLoginForm(containerId);
      this.showLoginError(containerId, `Session expired or invalid. Please log in again. (${error.message})`);
    }
  }

  async fetchContent(path, token) {
    const url = `${this.baseUrl}?path=${encodeURIComponent(path)}`;
    this.log('Fetching content from:', url);
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async fetchImage(imagePath, token) {
    const cacheKey = `${imagePath}-${token}`;
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey);
    }

    const url = `${this.imageUrl}?path=${encodeURIComponent(imagePath)}`;
    this.log(`Fetching image from: ${url}`);
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`Failed to load image: ${imagePath}`);
    }

    const data = await response.json();
    const dataUrl = `data:${data.contentType};base64,${data.content}`;
    this.imageCache.set(cacheKey, dataUrl);
    return dataUrl;
  }
  
  async processImages(content, token, basePath = '') {
    if (!token) return content;

    const imgRegex = /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi;
    const images = [];
    let match;

    while ((match = imgRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const beforeSrc = match[1];
      let srcPath = match[2];
      const afterSrc = match[3];

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = srcPath;
      srcPath = tempDiv.textContent || tempDiv.innerText || srcPath;

      if (!srcPath.startsWith('http') && !srcPath.startsWith('data:')) {
        const finalSrcPath = srcPath.startsWith('/') ? `static${srcPath}` : `static/${srcPath}`;
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
    imageResults.forEach(({ fullMatch, beforeSrc, afterSrc, dataUrl, srcPath }) => {
      const newImg = dataUrl
        ? `<img${beforeSrc}src="${dataUrl}"${afterSrc}>`
        : `<img${beforeSrc}src="#" alt="Failed to load: ${srcPath}" class="protected-image-error"${afterSrc}>`;
      processedContent = processedContent.replace(fullMatch, newImg);
    });

    return processedContent;
  }

  async renderContent(content, fileType, containerId, token, basePath) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id '${containerId}' not found`);
    }

    const processedContent = await this.processImages(content, token, basePath);

    if (fileType === 'html') {
      container.innerHTML = processedContent;
    } else if (fileType === 'md') {
      if (typeof marked === 'undefined') {
        throw new Error('Marked library not loaded');
      }
      container.innerHTML = marked.parse(processedContent);
    } else {
      container.textContent = processedContent;
    }
  }

  showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `<div class="protected-error" style="color: #dc3545; padding: 1rem; border: 1px solid #dc3545; border-radius: 4px; background: #f8d7da;">
        <strong>Error:</strong> ${message}
      </div>`;
    }
  }

  showLoading(containerId, loadingText = 'Loading protected content...') {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `<div class="protected-loading">${loadingText}</div>`;
    }
  }

  async loadProtectedContent(containerId, path) {
    const container = document.getElementById(containerId);
    const loadingText = container?.getAttribute('data-loading-text') || 'Loading protected content...';

    this.log('Starting to load protected content', { containerId, path });
    this.showLoading(containerId, loadingText);

    const token = this.getStoredToken();

    if (this.isTokenValid(token)) {
      this.log('Using stored JWT');
      await this.loadContentWithToken(containerId, path, token);
    } else {
      this.log('No valid JWT found, showing login form');
      this.clearToken();
      this.showLoginForm(containerId);
    }
  }
}

window.protectedLoader = new ProtectedContentLoader();

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-protected-path]').forEach(element => {
    const path = element.getAttribute('data-protected-path');
    if (path) {
      window.protectedLoader.loadProtectedContent(element.id, path);
    }
  });
});

window.logoutProtectedContent = function() {
  window.protectedLoader.log('Logging out.');
  window.protectedLoader.clearToken();
  document.querySelectorAll('[data-protected-path]').forEach(element => {
    window.protectedLoader.showLoginForm(element.id);
  });
};
