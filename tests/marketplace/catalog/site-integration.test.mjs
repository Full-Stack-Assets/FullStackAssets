import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('homepage exposes exactly one primary Library navigation link without reintroducing purchase CTA',()=>{
  const home=readFileSync('index.html','utf8');
  const links=[...home.matchAll(/href="\/library\/"/g)];
  assert.equal(links.length,1);
  assert.doesNotMatch(home,/href="\/purchase\//);
  assert.equal([...home.matchAll(/class="asset featured-project/g)].length,3);
});

test('sitemap exposes the Library root',()=>{
  const sitemap=readFileSync('sitemap.xml','utf8');
  assert.match(sitemap,/https:\/\/fullstackassets\.com\/library\//);
});

test('Pages workflow verifies and builds Library before Jekyll',()=>{
  const workflow=readFileSync('.github/workflows/jekyll-gh-pages.yml','utf8');
  const nodeAt=workflow.indexOf('actions/setup-node@v4');
  const testAt=workflow.indexOf('node --test');
  const libraryAt=workflow.indexOf('marketplace/bin/build-library.mjs');
  const jekyllAt=workflow.indexOf('actions/jekyll-build-pages@v1');
  assert.ok(nodeAt>=0 && testAt>nodeAt && libraryAt>testAt && jekyllAt>libraryAt);
});
