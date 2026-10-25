import test from 'node:test';
import assert from 'node:assert/strict';
import {csvCell,csvDocument} from '../csv-export.mjs';

test('spreadsheet exports neutralize formula-like text while preserving numeric cells and CSV quoting',()=>{
 for(const value of ['=1+1','+SUM(A1:A2)','-cmd','@HYPERLINK("x")','\t=1+1','  +1'])assert.equal(csvCell(value).startsWith('"\''),true,value);
 assert.equal(csvCell('safe, "quoted"'), '"safe, ""quoted"""');
 assert.equal(csvCell('-12.50',{untrustedText:false}), '"-12.50"');
 const text=csvDocument([['Title','Amount'],['=2+2','-12.50']],{numericColumns:[1]});
 assert.match(text,/\r\n"'=2\+2","-12\.50"/);
});
