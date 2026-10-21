// Migra llamadas directas a localStorage a StorageService.
// Patrones AST (sin regex sobre valores, que pueden tener comas/ternarias):
//   localStorage.getItem(k)                     -> storage.get(k)
//   localStorage.setItem(k, v)                  -> storage.set(k, v)
//   localStorage.removeItem(k)                  -> storage.remove(k)
//   JSON.parse(localStorage.getItem(k) || "x")  -> storage.getJSON(k, x)
//   localStorage.setItem(k, JSON.stringify(v))  -> storage.setJSON(k, v)
import fs from 'node:fs';
import * as acorn from 'acorn';
import MagicString from 'magic-string';

const FILE = 'src/lib/teclear/game.svelte.js';
const src = fs.readFileSync(FILE, 'utf8');
const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module' });
const ms = new MagicString(src);
const edits = [];

const isLs = (n, m) =>
    n?.type === 'MemberExpression' && !n.computed &&
    n.object.type === 'Identifier' && n.object.name === 'localStorage' &&
    n.property.type === 'Identifier' && n.property.name === m;

const MAP = { getItem: 'get', setItem: 'set', removeItem: 'remove' };
let count = 0;

function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'CallExpression') {
        // JSON.parse(localStorage.getItem(k) || "fallback") -> storage.getJSON(k, fallback)
        if (node.callee.type === 'MemberExpression' && !node.callee.computed &&
            node.callee.object.type === 'Identifier' && node.callee.object.name === 'JSON' &&
            node.callee.property.name === 'parse' &&
            node.arguments.length === 1 &&
            node.arguments[0].type === 'LogicalExpression' && node.arguments[0].operator === '||' &&
            node.arguments[0].left.type === 'CallExpression' &&
            isLs(node.arguments[0].left.callee, 'getItem') &&
            node.arguments[0].left.arguments.length === 1) {
            const get = node.arguments[0].left;
            const key = src.slice(get.arguments[0].start, get.arguments[0].end);
            const fb = src.slice(node.arguments[0].right.start, node.arguments[0].right.end);
            ms.overwrite(node.start, node.end,
                `storage.getJSON(${key}, ${fb === '"null"' || fb === "'null'" ? 'null' : fb})`);
            edits.push([node.start, node.end]);
            count++;
            return;
        }
        for (const [ls, name] of Object.entries(MAP)) {
            if (isLs(node.callee, ls)) {
                // setItem(k, JSON.stringify(v)) -> setJSON(k, v)
                if (ls === 'setItem' && node.arguments.length === 2 &&
                    node.arguments[1].type === 'CallExpression' &&
                    node.arguments[1].callee.type === 'MemberExpression' &&
                    !node.arguments[1].callee.computed &&
                    node.arguments[1].callee.object.name === 'JSON' &&
                    node.arguments[1].callee.property.name === 'stringify' &&
                    node.arguments[1].arguments.length === 1) {
                    const key = src.slice(node.arguments[0].start, node.arguments[0].end);
                    const val = src.slice(node.arguments[1].arguments[0].start,
                                          node.arguments[1].arguments[0].end);
                    ms.overwrite(node.start, node.end, `storage.setJSON(${key}, ${val})`);
                } else {
                    ms.overwrite(node.callee.start, node.callee.end, `storage.${name}`);
                }
                edits.push([node.start, node.end]);
                count++;
                return;
            }
        }
    }
    for (const key in node) {
        if (key === 'start' || key === 'end' || key === 'loc') continue;
        const c = node[key];
        if (Array.isArray(c)) c.forEach(visit);
        else if (c && typeof c === 'object' && c.type) visit(c);
    }
}
visit(ast);

// No aplicar ediciones contenidas dentro de otra (getItem dentro de getJSON ya cubierto)
ms.remove(0, 0);
fs.writeFileSync(FILE, ms.toString());
console.log(`llamadas migradas: ${count}`);
const rest = src.match(/localStorage/g);
console.log('localStorage restantes en fuente original:', rest ? rest.length : 0);
