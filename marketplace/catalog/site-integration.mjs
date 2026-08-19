export function injectLibraryDiscovery(source){
  if(typeof source!=='string') throw new TypeError('homepage source must be text');
  if(/href=["']\/library\//.test(source)) return source;
  const needle='<a href="/#work">Work</a>';
  if(!source.includes(needle)) throw new Error('HOMEPAGE_NAV_ANCHOR_NOT_FOUND');
  return source.replace(needle,`${needle}\n      <a href="/library/">Library</a>`);
}
