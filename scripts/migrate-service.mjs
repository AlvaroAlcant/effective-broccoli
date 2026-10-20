// Extrae funciones del closure de initTeclear a un servicio:
//   1. Borra las `function NAME(...)` movidas (+ sus comentarios de arriba)
//   2. Renombra las llamadas restantes a `TARGET.NAME(...)`
//      saltando identificadores sombreados por scopes anidados
// Uso: node scripts/migrate-service.mjs <target> <fn1,fn2,...>
import fs from 'node:fs';
import * as acorn from 'acorn';
import MagicString from 'magic-string';

const FILE = 'src/lib/teclear/game.svelte.js';
const [target, list] = process.argv.slice(2);
const MOVED = new Set(list.split(','));
const src = fs.readFileSync(FILE, 'utf8');
const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module' });
const ms = new MagicString(src);

// --- 1. localizar el closure initTeclear y las funciones movidas ---
let root = ast;
for (const n of ast.body) {
    if (n.type === 'FunctionDeclaration' && n.id.name === 'initTeclear') root = n;
    if (n.type === 'ExportNamedDeclaration' && n.declaration?.id?.name === 'initTeclear') root = n.declaration;
}

const deleteRanges = [];   // [start,end) de lo borrado
const movedAt = new Map(); // nombre -> rango de la declaración movida

function isCommentLine(s) { return /^\s*\/\//.test(s) || /^\s*$/.test(s); }

for (const stmt of root.body.body) {
    if (stmt.type !== 'FunctionDeclaration' || !MOVED.has(stmt.id.name)) continue;
    // subir por los comentarios/líneas en blanco que preceden a la función
    let start = stmt.start;
    const before = src.slice(0, start);
    const uptoStart = before.split('\n');
    let i = uptoStart.length - 1;
    // la última línea puede tener la indentación de la función
    while (i > 0 && isCommentLine(uptoStart[i - 1])) { i--; }
    const commentStart = uptoStart.slice(0, i).join('\n').length;
    if (commentStart < start) start = commentStart;
    deleteRanges.push([start, stmt.end]);
    movedAt.set(stmt.id.name, [start, stmt.end]);
}

// --- 2. recolectar nombres declarados en scopes anidados (sombras) ---
const shadows = [];
function collectScopes(node, top) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression') {
        if (node !== root) {
            const names = new Set();
            node.params.forEach(p => names.add(paramNames(p)).add);
            const scope = { start: node.start, end: node.end, names };
            shadows.push(scope);
            // los decls dentro de ESTA función también sombrean solo en su rango
        }
    }
    for (const k in node) {
        if (k === 'start' || k === 'end' || k === 'loc') continue;
        const c = node[k];
        if (Array.isArray(c)) c.forEach(x => collectScopes(x));
        else if (c && typeof c === 'object' && c.type) collectScopes(c);
    }
}
function paramNames(p) {
    if (!p) return new Set();
    if (p.type === 'Identifier') return new Set([p.name]);
    const s = new Set();
    if (p.type === 'ObjectPattern') p.properties.forEach(pr => paramNames(pr.value ?? pr).forEach(n => s.add(n)));
    if (p.type === 'ArrayPattern') p.elements.forEach(el => paramNames(el).forEach(n => s.add(n)));
    if (p.type === 'RestElement') paramNames(p.argument).forEach(n => s.add(n));
    if (p.type === 'AssignmentPattern') paramNames(p.left).forEach(n => s.add(n));
    return s;
}
// sombras = params + variables declaradas dentro de funciones anidadas
function nestedDecls(node, insideNested) {
    if (!node || typeof node !== 'object') return;
    const isFn = /Function/.test(node.type || '');
    if (isFn && node !== root) insideNested = node;
    if (insideNested && node.type === 'VariableDeclarator' && node.id.type === 'Identifier') {
        shadows.push({ start: insideNested.start, end: insideNested.end,
                       names: new Set([node.id.name]) });
    }
    if (insideNested && isFn) {
        node.params.forEach(p => paramNames(p).forEach(n =>
            shadows.push({ start: insideNested.start, end: insideNested.end,
                           names: new Set([n]) })));
    }
    for (const k in node) {
        if (k === 'start' || k === 'end' || k === 'loc') continue;
        const c = node[k];
        if (Array.isArray(c)) c.forEach(x => nestedDecls(x, insideNested));
        else if (c && typeof c === 'object' && c.type) nestedDecls(c, insideNested);
    }
}
collectScopes(root);
nestedDecls(root, null);

const inRange = (pos, [a, b]) => pos >= a && pos < b;
const shadowed = (pos, name) => shadows.some(sc => inRange(pos, [sc.start, sc.end]) &&
    sc.names.has(name));

// --- 3. renombrar referencias ---
let renamed = 0, skipped = 0;
function walk(node, parent) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'Identifier' && MOVED.has(node.name)) {
        const decl = movedAt.get(node.name);
        if (decl && inRange(node.start, decl)) { /* es la propia decl, se borra */ }
        else if (shadowed(node.start, node.name)) { skipped++; }
        else if (!(parent && parent.type === 'MemberExpression' && parent.property === node && !parent.computed) &&
                 !(parent && parent.type === 'Property' && parent.key === node && !parent.computed)) {
            ms.appendLeft(node.start, target + '.');
            renamed++;
        }
    }
    for (const k in node) {
        if (k === 'start' || k === 'end' || k === 'loc') continue;
        const c = node[k];
        if (Array.isArray(c)) c.forEach(x => walk(x, node));
        else if (c && typeof c === 'object' && c.type) walk(c, node);
    }
}
walk(root, null);

// --- 4. aplicar borrados (ordenadas, sin solapes) ---
deleteRanges.sort((a, b) => b[0] - a[0]);
let removed = 0;
for (const [a, b] of deleteRanges) { ms.remove(a, b); removed++; }

fs.writeFileSync(FILE, ms.toString());
console.log(`funciones movidas: ${removed} · llamadas renombradas a ${target}.x: ${renamed} · sombras: ${skipped}`);
const rest = [...MOVED].filter(n => new RegExp(`function ${n}\\(`).test(ms.toString()));
if (rest.length) console.log('¡OJO! decls que quedan:', rest.join(', '));
