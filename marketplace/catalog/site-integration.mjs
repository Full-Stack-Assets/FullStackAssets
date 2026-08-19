export function injectLibraryDiscovery(source){
  if(typeof source!=='string') throw new TypeError('homepage source must be text');
  if(/href=["']\/library\//.test(source)) return source;
  const needle='<a href="/#work">Work</a>';
  if(!source.includes(needle)) throw new Error('HOMEPAGE_NAV_ANCHOR_NOT_FOUND');
  return source.replace(needle,`${needle}\n      <a href="/library/">Library</a>`);
}

export function injectLibrarySitemap(source){
  if(typeof source!=='string') throw new TypeError('sitemap source must be text');
  if(source.includes('https://fullstackassets.com/library/')) return source;
  const close='</urlset>';
  if(!source.includes(close)) throw new Error('SITEMAP_ROOT_NOT_FOUND');
  const entry=`  <url>\n    <loc>https://fullstackassets.com/library/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
  return source.replace(close,`${entry}${close}`);
}
