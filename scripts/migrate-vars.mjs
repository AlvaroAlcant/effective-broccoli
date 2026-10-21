// Renombra variables `let` del closure a `TARGET.name`, borrando sus
// declaraciones y saltando identificadores sombreados en scopes anidados.
// Uso: node scripts/migrate-vars.mjs <target> <var1,var2,...>
import fs from 'node:fs';
import * as acorn from 'acorn';
import MagicString from 'magic-string';

const FILE = 'src/lib/teclear/game.svelte.js';
const [target, list] = process.argv.slice(2);
const MOVED = new Set(list.split(','));
const src = fs.readFileSync(FILE, 'utf8');
const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module' });
const ms = new MagicString(src);

let root = ast;
for (const n of ast.body) {
    if (n.type === 'FunctionDeclaration' && n.id.name === 'initTeclear') root = n;
    if (n.type === 'ExportNamedDeclaration' && n.declaration?.id?.name === 'initTeclear') root = n.declaration;
}

// Declaraciones a borrar (cada declarator suelto dentro de un `let`)
const declRanges = new Map();
for (const stmt of root.body.body) {
    if (stmt.type !== 'VariableDeclaration') continue;
    for (const d of stmt.declarations) {
        if (d.id.type === 'Identifier' && MOVED.has(d.id.name)) {
            declRanges.set(d.id.name, [d.start, d.end]);
        }
    }
}

// Sombras: nombres declarados dentro de funciones/bloques anidados
const shadows = [];
function collect(node, inside) {
    if (!node || typeof node !== 'object') return;
    const isFn = /Function/.test(node.type || '');
    if (isFn && node !== root) inside = node;
    if (inside) {
        const names = [];
        if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && MOVED.has(node.id.name))
            names.push(node.id.name);
        if (isFn) node.params.forEach(p => {
            if (p.type === 'Identifier' && MOVED.has(p.name)) names.push(p.name);
        });
        names.forEach(n => shadows.push({ n, a: inside.start, b: inside.end }));
    }
    for (const k in node) {
        if (k === 'start' || k === 'end' || k === 'loc') continue;
        const c = node[k];
        if (Array.isArray(c)) c.forEach(x => collect(x, inside));
        else if (c && c.type) collect(c, inside);
    }
}
collect(root, null);
const shadowed = (pos, name) => shadows.some(s => s.n === name && pos >= s.a && pos < s.b);

let renamed = 0, skipped = 0;
function walk(node, parent) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'Identifier' && MOVED.has(node.name)) {
        const decl = declRanges.get(node.name);
        if (decl && node.start >= decl[0] && node.start < decl[1]) { /* la decl se borra */ }
        else if (shadowed(node.start, node.name)) skipped++;
        else if (!(parent && parent.type === 'MemberExpression' && parent.property === node && !parent.computed) &&
                 !(parent && (parent.type === 'Property' || parent.type === 'PropertyDefinition') && parent.key === node)) {
            ms.appendLeft(node.start, target + '.');
            renamed++;
        }
    }
    for (const k in node) {
        if (k === 'start' || k === 'end' || k === 'loc') continue;
        const c = node[k];
        if (Array.isArray(c)) c.forEach(x => walk(x, node));
        else if (c && c.type) walk(c, node);
    }
}
walk(root, null);

// borrar declarators (y el `let x = ...;` completo si queda solo)
for (const stmt of root.body.body) {
    if (stmt.type !== 'VariableDeclaration') continue;
    const moved = stmt.declarations.filter(d => declRanges.has(d.id.name));
    if (!moved.length) continue;
    if (moved.length === stmt.declarations.length) {
        // toda la sentencia: quitar también su línea/comentarios previos
        let start = stmt.start;
        const before = src.slice(0, start).split('\n');
        let i = before.length - 1;
        while (i > 0 && (/^\s*\/\//.test(before[i - 1]) || /^\s*$/.test(before[i - 1]))) i--;
        const cs = before.slice(0, i).join('\n').length;
        if (cs < start) start = cs;
        ms.remove(start, stmt.end + 1 > src.length ? stmt.end : stmt.end);
    } else {
        moved.forEach(d => ms.remove(d.start, d.end));
    }
}

fs.writeFileSync(FILE, ms.toString());
console.log(`renombradas: ${renamed} · sombras: ${skipped} · decls: ${declRanges.size}`);
