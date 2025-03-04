Content:

- Make example articles for 1) a condition 2) macro 3) research landmark article
  - Chronic rhinosinusitis, landmark trials (ie. omalizumab and CSU, SYGMA, peanut immunotherapy, Xolair/Dupi for CSU, LEAP)
  - done: medication example
- Topics to add:
  - Pediatric medicine crash course
  - add non-ige mediated mast cell degranulation section (with specific sections with things like IV iron, NAC, alcohol, opioids, etc)
- guideline compilation section (not sure if there's a way to automate this unfortunately)
- sections for pdfs for not only patient handouts but how to use inhalers, etc.

Lower priority content:

- port original pen-fast questions over with extra options; need to see if .PDF js packages are possible.
- creation of video resources if time permits
- Billing tips (would have to be province specific -- VERY fellow focused)

Site:

- Figure out how to make website more visible to web crawlers -- while it is indexed the homepage is not showing up on search?
- Optimize .PNGS used (see https://github.com/shssoichiro/oxipng and https://abridge.pages.dev/overview-abridge/#optimize-png-ico-files
- ? lighthouse manfiest says that for PWA no web app manifest was fetchable? See following for CSP edits:

```
Refused to load manifest from 'https://allergyguide.ca/manifest.min.json' because it violates the following Content Security Policy directive: "manifest-src 'self'".

Refused to load the image 'https://allergyguide.ca/apple-touch-icon.png' because it violates the following Content Security Policy directive: "img-src 'self' data: talk.hyvor.com cdn.cloudflare.com".

Refused to load the script 'https://allergyguide.ca/js/abridge.min.js?h=e0f9a881a665c86cce9c' because it violates the following Content Security Policy directive: "script-src 'self' talk.hyvor.com https://cdn.jsdelivr.net 'unsafe-inline'". Note that 'script-src-elem' was not explicitly set, so 'script-src' is used as a fallback.  

Refused to load the script 'https://allergyguide.ca/js/theme.min.js' because it violates the following Content Security Policy directive: "script-src 'self' talk.hyvor.com https://cdn.jsdelivr.net 'unsafe-inline'". Note that 'script-src-elem' was not explicitly set, so 'script-src' is used as a fallback.

Refused to load the stylesheet 'https://allergyguide.ca/abridge.css?h=56799d7f1b8c161bdcb6' because it violates the following Content Security Policy directive: "style-src 'self' talk.hyvor.com cdn.cloudflare.com cdn.jsdelivr.net fonts.googleapis.com 'unsafe-inline'". Note that 'style-src-elem' was not explicitly set, so 'style-src' is used as a fallback.

Refused to load the stylesheet 'https://allergyguide.ca/abridge.css?h=56799d7f1b8c161bdcb6' because it violates the following Content Security Policy directive: "style-src 'self' talk.hyvor.com cdn.cloudflare.com cdn.jsdelivr.net fonts.googleapis.com 'unsafe-inline'". Note that 'style-src-elem' was not explicitly set, so 'style-src' is used as a fallback.
```

Organizational:

- fully flesh out contribution process
- set up example google drive
- Reach out to staff re: supporting the project / funding?
- team structure?
  - main editor: josh
  - main staff: ?TBD
  - other editors: ? other fellows interested -- ~3-4? to coordinate the editing process and reaching out to staff
  - editors who also can code / contribute: 1-2 but if needed Josh can do all of this (less sustainable however)

Shortcodes:

- consolidate and make light/dark themes for original admonitions
- a better question and answer dropdown section

Other stylistic:

- fix / make custom banner.png for the site
- Decide on design of home page -- ? macros, spt generator, topics?
- Add author pictures to about
