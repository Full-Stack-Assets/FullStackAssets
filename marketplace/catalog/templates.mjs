export function escapeHtml(value='') {
  return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
}

export function pageShell({title,description='',canonicalPath,body}) {
  const canonical = `https://fullstackassets.com${canonicalPath}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} | Full Stack Assets</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<link rel="stylesheet" href="/assets/style.css">
<link rel="stylesheet" href="/assets/library.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,500;12..96,700;12..96,800&family=Public+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<nav><div class="nav-inner"><a href="/" class="logo">FULL STACK <span>ASSETS</span></a><button class="nav-toggle" aria-label="Toggle navigation" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button><div class="nav-links"><a href="/library/">Library</a><a href="/services/">Services</a><a href="/resume/">Résumé</a><a href="/#contact" class="nav-cta">Contact</a></div></div></nav>
<main id="main">${body}</main>
<footer><div class="foot-inner"><div class="foot-bottom"><span>© 2026 Full Stack Assets</span><a href="/library/">Agent &amp; Skill Library</a></div></div></footer>
<script src="/assets/site.js"></script>
<script src="/assets/library.js"></script>
</body>
</html>`;
}
