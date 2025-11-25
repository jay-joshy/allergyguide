const { createProtectedHandler, handleGithubError, jsonResponse } = require('./util/handler-helper');

/**
 * Determines the appropriate MIME type for a given image filename.
 */
const getContentType = (filename) => {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    'bmp': 'image/bmp',
    'ico': 'image/x-icon'
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

/**
 * Core logic for fetching an image file from GitHub.
 * Handles both small files (inline content) and large files (via download_url).
 */
const processImageRequest = async (path, { token, owner, repo }) => {
  const githubUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  console.log(`Fetching image metadata from: ${githubUrl}`);

  try {
    // First, fetch file metadata. The content may be included if the file is small enough.
    const metaResponse = await fetch(githubUrl, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json', // Request JSON metadata
        'User-Agent': 'Netlify-Function'
      }
    });

    if (!metaResponse.ok) {
      return handleGithubError(metaResponse, 'image');
    }

    const imageData = await metaResponse.json();

    if (imageData.type !== 'file') {
      return jsonResponse(400, { error: 'The requested path is not a file.' });
    }

    let base64Content = imageData.content;

    // If content is not in the metadata response, the file is too large.
    // We must fetch it from the download_url.
    if (!base64Content) {
      if (!imageData.download_url) {
        return jsonResponse(500, { error: 'Missing download_url for a large file.' });
      }

      const imageBinaryRes = await fetch(imageData.download_url, {
        headers: { Authorization: `token ${token}` }
      });

      if (!imageBinaryRes.ok) {
        return jsonResponse(500, { error: 'Failed to fetch image binary for a large file.' });
      }

      const arrayBuffer = await imageBinaryRes.arrayBuffer();
      base64Content = Buffer.from(arrayBuffer).toString('base64');
    }

    const contentType = getContentType(imageData.name);

    // Return the successful response with the Base64 content and cache headers.
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=3600' // Cache on the client
      },
      body: JSON.stringify({
        content: base64Content,
        contentType: contentType,
        filename: imageData.name,
        size: imageData.size
      })
    };

  } catch (fetchError) {
    console.error('GitHub fetch error:', fetchError);
    return jsonResponse(500, { error: 'Failed to connect to image source' });
  }
};

/**
 * Creates the Netlify function handler for images.
 */
exports.handler = createProtectedHandler({
  validatePath: (path) => {
    const imageExtensions = /\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)$/i;
    if (path.includes('..') || path.startsWith('/') || !imageExtensions.test(path)) {
      return 'Invalid image path format. Only common image extensions are allowed.';
    }
    return null; // Path is valid
  },
  processRequest: processImageRequest,
});
