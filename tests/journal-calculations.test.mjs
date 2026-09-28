import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const defaultAppPath = fileURLToPath(new URL('../journal-app.js', import.meta.url));
const appPath = process.argv[2] || defaultAppPath;
const source = fs.readFileSync(appPath, 'utf8');

const constants = source.match(/const PIP=0\.1;[\s\S]*?function xauusdLotForRisk\([^\n]+/)?.[0];
const calcTradeSource = source.match(/function calcTrade\(t\)\{[\s\S]*?\n\}/)?.[0];
assert.ok(constants, 'XAUUSD calculation helpers were not found');
assert.ok(calcTradeSource, 'calcTrade was not found');

const context = { state: { startingBalance: 10_000 } };
vm.createContext(context);
vm.runInContext(`${constants}
const r1=n=>Math.round(n*10)/10;
const r2=n=>Math.round(n*100)/100;
const r3=n=>Math.round(n*1000)/1000;
function num(v){return(v===null||v===undefined||v==='')?null:parseFloat(v);}
${calcTradeSource}`, context);

let trade = context.calcTrade({
  side: 'SELL',
  pair: 'XAUUSD',
  entry: 4166.574,
  exit: 4164.914,
  lot: 0.01
});
assert.equal(trade.pips, 16.6);
assert.equal(trade.grossPnl, 1.66);
assert.equal(trade.pnl, 1.66);
assert.equal(trade.result, 'WIN');

trade = context.calcTrade({
  side: 'BUY',
  pair: 'XAUUSD',
  entry: 4164.914,
  exit: 4166.574,
  lot: 0.01,
  charges: 0.16
});
assert.equal(trade.grossPnl, 1.66);
assert.equal(trade.pnl, 1.5);

trade = context.calcTrade({
  side: 'BUY',
  pair: 'XAUUSD',
  entry: 4166.574,
  exit: 4164.914,
  lot: 0.01
});
assert.equal(trade.pnl, -1.66);
assert.equal(trade.result, 'LOSS');

trade = context.calcTrade({
  side: 'BUY',
  pair: 'XAUUSD',
  entry: 4166,
  sl: 4165,
  tp: 4168,
  lot: 0.01
});
assert.equal(trade.riskDollar, 1);
assert.equal(trade.riskPercent, 0.01);
assert.equal(trade.posSize, 1);
assert.equal(trade.rr, 2);

context.state.startingBalance = 0;
trade = context.calcTrade({
  side: 'BUY',
  pair: 'XAUUSD',
  entry: 4166,
  sl: 4165,
  lot: 0.01
});
assert.equal(trade.riskPercent, null);
assert.equal(trade.posSize, 0);

assert.doesNotMatch(source, /pips\s*\*\s*lot\s*\*\s*100/);
assert.doesNotMatch(source, /slPips\s*\*\s*lot\s*\*\s*100/);

console.log('Journal calculation regression tests passed.');

