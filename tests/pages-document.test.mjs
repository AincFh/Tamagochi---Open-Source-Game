import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('published HTML resolves all core icons under the Pages project path',()=>{
 const h=readFileSync('dist/index.html','utf8'),b='/Tamagochi---Open-Source-Game/';
 assert.ok(h.includes('href="'+b+'icon.svg"'), 'favicon should point to fork Pages path');
 assert.ok(h.includes('href="'+b+'icon-180.png"'), 'Apple touch icon should point to fork Pages path');
 assert.ok(!h.includes('href="/icon.svg"'), 'must not load icon from account root');
});
test('fork canonical and social metadata point to the actual fork site',()=>{
 const h=readFileSync('dist/index.html','utf8');
 assert.match(h,/https:\/\/aincfh\.github\.io\/Tamagochi---Open-Source-Game\//);
 assert.doesNotMatch(h,/tamagochi-game\.vercel\.app/);
});
