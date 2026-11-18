# redesignflowers
redesignflowers.com - Sam and Banks portfolio and florist demos

Plain static site served by GitHub Pages (branch `main`, root). No build step.

## Layout
- `/` hub page (`index.html`, `hub.css`, `hub.js`, `assets/`)
- `/work/ossia/`, `/work/fieldday/`, `/work/casa-azahar/` concept sites
- `/<shop>/` one folder per shop demo. **Don't rename these folders**: the links in outreach emails point at them.
- `/blumedesignsfloralartistry/` Blume demo (root = current, `v3/` = v3), copied from sbanksha/blumedesignsfloralartistry
- `CNAME` custom domain for Pages. Leave it.
- `.nojekyll` tells Pages to serve files as-is.

## Not indexed by search engines
- Every HTML page has `<meta name="robots" content="noindex, nofollow">`. Keep it on new demos.
- `robots.txt` at the root disallows everything.
- (Netlify also sent an `X-Robots-Tag` header. GitHub Pages can't set headers, so the meta tags do that job now.)

## Adding a demo
Make a new folder `/<shop-name>/` with an `index.html`, use relative paths for assets, include the noindex meta tag, push to `main`.

## Known differences from Netlify
- Contact forms that used Netlify Forms (`data-netlify="true"`: bloom-and-sol, sparrow-and-lily, hudson-florist, bloom-florist-orleans, rose-lane-floral, laughing-petal) won't submit on GitHub Pages. They're demos, so the layout still shows; swap in Formspree or similar if a client needs a working form.
- Old Netlify-only URLs (`flips-demos-pi12c.netlify.app/<long-slug>/`) stay on Netlify; this repo uses the short `redesignflowers.com/<shop>/` paths.
