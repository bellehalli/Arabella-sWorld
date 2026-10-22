import test from 'node:test';import assert from 'node:assert/strict';import {homeForDay,outfitSuggestion,eligibleForOutfit} from '../home-closet.mjs';
const garment=(id,category,laundry='Clean')=>({id,type:'wardrobe',deletedAt:null,data:{category,laundry}});
test('weekly cleaning schedule maps Monday correctly',()=>{assert.equal(homeForDay('2026-11-02').day,'Monday');assert.equal(homeForDay('2026-11-08').day,'Sunday')});
test('dirty items never appear in generated outfits',()=>{const items=[garment('dress','Dress'),garment('shoes','Shoes'),garment('dirty','Top','Laundry')];const outfit=outfitSuggestion(items);assert.equal(outfit.complete,true);assert.equal(outfit.pieces.some(x=>x.id==='dirty'),false);assert.equal(eligibleForOutfit(items[2]),false)});
test('empty closet yields incomplete outfit',()=>{assert.equal(outfitSuggestion([]).complete,false)});
