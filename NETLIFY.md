# Local development with Netlify CLI

See https://docs.netlify.com/api-and-cli-guides/cli-guides/local-development/

Download cli and link to project

To develop with it:

cd to root dir (important NOT to run netlify dev in other dir)

1. Run `netlify build`
2. Run `netlify dev`

# Packages only used in netlify functions

See separate package.json and lock file in `netlify/functions/package.json` and `netlify/functions/package-lock.json`

# Logging

In Netlify functions `console.log()` are shown in Netlify function logs, not the browser console.

# Netlify functions

## Protected shortcode

Assumes following netlify ENV:

```bash
JWT_SECRET="your-secret-256-bit-key"
AUTH_USERS='{"alice":"$2b$10$...","bob":"$2b$10$..."}'
TOKEN_EXPIRY_HOURS="24"
GITHUB_TOKEN="ghp_..." # GITHUB_TOKEN has minimal permissions (read-only)
GITHUB_OWNER="your-username"
GITHUB_REPO="your-private-repo"
```

### Security

### User passwords

- authentication system supports bcrypt password hashing, but also the old way with less secure passwords. To generate hashes do either: `node hash-password.js "user-password"` or just `node hash-password.js` for an interactive session
- Ultimately it will give a hash like; `$2b$10$rX...etc` which should be used in AUTH_USERS as above

### Staying logged in with tokens

- uses JWT
- `TOKEN_EXPIRY_HOURS` (default: 24 hours)
- Storage is client-side in `localStorage`
- 30-second clock skew buffer
- Do note: Tokens cannot be revoked (until expiry) without changing `JWT_SECRET`

### Rate limiting

- Also very naive rate limiting impl, 5 failed attempts per IP, 5 min lockout after hitting limit; TODO! look into more Netlify Blob store

### Troubleshooting

- check logs in browser and netlify function logs
- check env vars for validity
-
