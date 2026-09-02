# Library host

The Agentic Capability Library is a separate product from the fullstackassets.com résumé site.

- Intended public host: `https://library.fullstackassets.com/`
- Catalog: `/library/`
- Customer library: `/my-library/`
- Publisher studio: `/publisher/`
- Enterprise registry: `/enterprise/`
- Authority: Canon. This repo is the marketplace projection only.
- DNS required before production: CNAME `library` → `full-stack-assets.github.io` is wrong. Point `library.fullstackassets.com` at this repository's GitHub Pages site (usually `<user>.github.io` project pages or the Pages URL GitHub shows after the CNAME is assigned).

Do not merge this onto main until the DNS record exists and GitHub Pages on FullStackAssets is switched to the library-pages workflow. The résumé Jekyll Pages workflow must not keep publishing the blender site.
