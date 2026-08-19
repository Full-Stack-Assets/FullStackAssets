import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { injectLibraryDiscovery, injectLibrarySitemap } from '../../../marketplace/catalog/site-integration.mjs';

test('homepage build injects exactly one Library navigation link without changing portfolio invariants',()=>{
  const source=readFileSync('index.html','utf8');
  const home=injectLibraryDiscovery(source);
  assert.equal([...home.matchAll(/href="\/library\/"/g)].length,1);
  assert.equal(injectLibraryDiscovery(home),home);
  assert.doesNotMatch(home,/href="\/purchase\//);
  assert.equal([...home.matchAll(/class="asset featured-project/g)].length,3);
});

test('sitemap build injects the Library root exactly once',()=>{
  const source=readFileSync('sitemap.xml','utf8');
  const sitemap=injectLibrarySitemap(source);
  assert.equal((sitemap.match(/https:\/\/fullstackassets\.com\/library\//g)??[]).length,1);
  assert.equal(injectLibrarySitemap(sitemap),sitemap);
});

test('Pages workflow verifies, materializes, integrates, and builds Library before Jekyll',()=>{
  const workflow=readFileSync('.github/workflows/jekyll-gh-pages.yml','utf8');
  const nodeAt=workflow.indexOf('actions/setup-node@v4');
  const testAt=workflow.indexOf('node --test');
  const materializeAt=workflow.indexOf('materialize-catalog.mjs');
  const discoveryAt=workflow.indexOf('inject-library-discovery.mjs');
  const sitemapAt=workflow.indexOf('inject-library-sitemap.mjs');
  const libraryAt=workflow.indexOf('marketplace/bin/build-library.mjs');
  const jekyllAt=workflow.indexOf('actions/jekyll-build-pages@v1');
  assert.ok(nodeAt>=0 && testAt>nodeAt && materializeAt>testAt && discoveryAt>materializeAt && sitemapAt>discoveryAt && libraryAt>sitemapAt && jekyllAt>libraryAt);
});
