import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const html = readFileSync(new URL('../yz-mdm/app/src/main/assets/index.html', import.meta.url), 'utf8');
const layout = html.match(/      let layoutMode=[\s\S]*?      applyLayout\(\);/)[0];
const orientation = html.match(/      function updateOrientationMode\(\)\{[\s\S]*?\n      \}/)[0];
function setup(saved, installed=true) {
  const classes = new Set(); const data = new Map(saved ? [['yz-layout', saved]] : []);
  const tile = { hidden: false };
  const context = vm.createContext({
    localStorage: { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) },
    document: { body: { classList: { contains: key => classes.has(key), toggle: (key, on) => on ? classes.add(key) : classes.delete(key) } }, querySelector: () => tile },
    YZMDM: { isWazeInstalled: () => installed },
    orientationQuery: { matches: false }, carModeAutomatic: true, wazeEnabled: true, orientationModeInitialized: false
  });
  vm.runInContext(layout + orientation, context);
  return { context, classes, data, tile, run: code => vm.runInContext(code, context) };
}
test('existing and invalid preferences keep the current layout by default', () => {
  for (const saved of [undefined, 'standard', 'invalid']) {
    const ui = setup(saved); assert.equal(ui.classes.has('layout-compact'), false);
    ui.run('updateOrientationMode()'); assert.equal(ui.tile.hidden, true);
  }
});
test('choosing compact persists and is restored after reopening', () => {
  const ui = setup(); ui.run("applyLayout('compact', true)");
  assert.equal(ui.classes.has('layout-compact'), true);
  const reopened = setup(ui.data.get('yz-layout'));
  assert.equal(reopened.classes.has('layout-compact'), true);
  reopened.run("applyLayout('standard', true)");
  assert.equal(reopened.data.get('yz-layout'), 'standard');
  assert.equal(reopened.classes.has('layout-compact'), false);
});
test('compact shows Waze in portrait only when installed and enabled', () => {
  const ui = setup('compact'); ui.run('updateOrientationMode()'); assert.equal(ui.tile.hidden, false);
  ui.run('wazeEnabled=false; updateOrientationMode()'); assert.equal(ui.tile.hidden, true);
  const missing = setup('compact', false); missing.run('updateOrientationMode()'); assert.equal(missing.tile.hidden, true);
});
