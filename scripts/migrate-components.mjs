// migrate-components.mjs — G.x → engine.state.x / engine.x / engine.actions.x
import fs from 'fs';
import * as acorn from 'acorn';

const SRC = 'src/lib/teclear/game.svelte.js';
const src = fs.readFileSync(SRC, 'utf8');
const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module' });
const walk = (n, f) => { if (!n || typeof n !== 'object') return; if (n.type) f(n); for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach(x => walk(x, f)); else if (v && typeof v === 'object') walk(v, f); } };

// clasifica las keys del impl: mirror de S → state; resto → getter/field/method
const keyMap = {};   // G.x → "state.x" | "x" | "x()" | "t"
walk(ast, n => {
    if (n.type === 'CallExpression' && n.callee.type === 'MemberExpression' &&
        n.callee.object.name === 'Object' && n.callee.property.name === 'assign' &&
        n.arguments[1] && n.arguments[1].type === 'ObjectExpression') {
        for (const p of n.arguments[1].properties) {
            const k = p.key.name || p.key.value;
            const v = p.value;
            if (k === 'a') keyMap[k] = 'actions';
            else if (k === 't') keyMap[k] = 't';
            else if (k === 'level') keyMap[k] = 'level()';
            else if (k === 'savedScore') keyMap[k] = 'savedScore';
            else if ((v.type === 'ArrowFunctionExpression' || v.type === 'FunctionExpression') &&
                     v.body.type === 'MemberExpression' && v.body.object.name === 'S' &&
                     v.body.property.name === k) keyMap[k] = 'state.' + k;
            else keyMap[k] = k;
        }
    }
});
console.log('keys:', Object.keys(keyMap).length,
    '| state:', Object.values(keyMap).filter(v => v.startsWith('state.')).length);

const files = [
    'src/lib/teclear/Header.svelte', 'src/lib/teclear/GameArea.svelte',
    'src/lib/teclear/Footer.svelte', 'src/lib/teclear/Ranking.svelte',
    'src/lib/teclear/Stats.svelte', 'src/lib/teclear/Perfil.svelte',
    'src/lib/teclear/Shop.svelte', 'src/lib/teclear/Logros.svelte',
    'src/lib/teclear/Inventario.svelte', 'src/lib/teclear/Selectors.svelte',
];

for (const f of files) {
    let s = fs.readFileSync(f, 'utf8');
    // import { G } from './game.svelte.js' → engine
    s = s.replace(/import\s*\{\s*G\s*\}\s*from\s*'\.\/game\.svelte\.js';?/,
                  "import { engine } from './engine.svelte.js';");
    // G.a.x → engine.actions.x   |   G.x → engine.<map>
    s = s.replace(/\bG\.a\.(\w+)/g, 'engine.actions.$1');
    s = s.replace(/\bG\.(\w+)/g, (m, k) => {
        const t = keyMap[k];
        if (!t) { console.log('  ?? clave sin mapear:', k, 'en', f); return m; }
        if (t === 'actions') return 'engine.actions';
        if (t === 't') return 'engine.t';
        return 'engine.' + t;
    });
    fs.writeFileSync(f, s);
    const n = (s.match(/engine\./g) || []).length;
    console.log(f.split('/').pop(), '→', n, 'refs');
}

// +page.svelte: initTeclear() → engine.mount()
const page = 'src/routes/+page.svelte';
let p = fs.readFileSync(page, 'utf8');
p = p.replace(/import\s*\{\s*initTeclear\s*\}\s*from\s*'#lib\/teclear\/game\.svelte\.js';?/,
              "import { engine } from '#lib/teclear/engine.svelte.js';");
p = p.replace(/initTeclear\(\)/, 'engine.mount()');
fs.writeFileSync(page, p);
console.log('+page.svelte → engine.mount()');
