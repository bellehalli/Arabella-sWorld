import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {sanitizeRichHtml,plainTextFromRichHtml,richHtmlFromPlainText} from '../rich-text.mjs';

test('rich text keeps allowed formatting while stripping scripts, event attributes, and unsafe links',()=>{
 const original=globalThis.DOMParser;globalThis.DOMParser=class{parseFromString(input){return parseHTML(`<!doctype html><html><body>${input}</body></html>`).document;}};
 try{
  const clean=sanitizeRichHtml('<p onclick="steal()">hello <strong>friend</strong><script>steal()</script><a href="javascript:steal()">bad link</a><a href="https://example.com" onmouseover="steal()">safe link</a></p>');
  assert.match(clean,/<strong>friend<\/strong>/);assert.match(clean,/href="https:\/\/example.com"/);
  assert.doesNotMatch(clean,/<script|onclick|onmouseover|javascript:/i);assert.equal(plainTextFromRichHtml(clean).includes('hello'),true);
 }finally{if(original===undefined)delete globalThis.DOMParser;else globalThis.DOMParser=original;}
});

test('plain writing converts to escaped paragraphs before entering the rich editor',()=>{
 const html=richHtmlFromPlainText('<img src=x onerror=bad()>\n\nSecond paragraph');
 assert.doesNotMatch(html,/<img/);assert.match(html,/&lt;img/);assert.equal(html.match(/<p>/g).length,2);
});


test('sanitizer fallback escapes all markup when DOMParser is unavailable',()=>{
 const original=globalThis.DOMParser;delete globalThis.DOMParser;
 try{
  const clean=sanitizeRichHtml('hello <<script>steal()</script><img src=x onerror=steal()> & goodbye');
  assert.equal(clean,'hello &lt;&lt;script&gt;steal()&lt;/script&gt;&lt;img src=x onerror=steal()&gt; &amp; goodbye');
  assert.doesNotMatch(clean,/<(?:script|img)\b/i);
 }finally{if(original!==undefined)globalThis.DOMParser=original;}
});
