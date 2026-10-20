// Migración Fase 2: mueve `let x = $state(v)` del closure de initTeclear
// a campos de la clase GameState (S.x) y renombra todos los usos con
// resolución de scope real (acorn + magic-string).
import fs from 'node:fs';
import * as acorn from 'acorn';
import MagicString from 'magic-string';

const PATH = 'src/lib/teclear/game.svelte.js';
const src = fs.readFileSync(PATH, 'utf8');
const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module', allowReturnOutsideFunction: true });

// ---- 1. localizar initTeclear y recolectar las vars $state de nivel superior
let initFn = null;
for (const node of ast.body) {
    if (node.type === 'FunctionDeclaration' && node.id?.name === 'initTeclear') initFn = node;
    if (node.type === 'ExportNamedDeclaration' && node.declaration?.id?.name === 'initTeclear') initFn = node.declaration;
    if (node.type === 'ExportNamedDeclaration' && node.declaration?.declarations?.[0]?.init?.id?.name === 'initTeclear') initFn = node.declaration.declarations[0].init;
}
if (!initFn) { console.error('initTeclear no encontrado'); process.exit(1); }

const isStateCall = n => n?.type === 'CallExpression' && n.callee?.type === 'Identifier' && n.callee.name === '$state';

// vars $state declaradas como statements directos del cuerpo de initTeclear
const stateVars = new Map(); // name -> {declStatement, declarator, init}
for (const stmt of initFn.body.body) {
    if (stmt.type !== 'VariableDeclaration' || stmt.kind !== 'let') continue;
    for (const d of stmt.declarations) {
        if (d.id.type === 'Identifier' && isStateCall(d.init)) {
            stateVars.set(d.id.name, { stmt, decl: d, init: d.init.arguments[0] });
        }
    }
}
console.log('vars $state encontradas:', [...stateVars.keys()].join(', '));

// ---- 2. walker con scope: cada función/bloque-catch/for declara bindings
function declaredNames(node) {
    // nombres que un nodo introduce en su propio scope (params, lets/consts/vars/functions)
    const out = new Set();
    const add = pat => {
        if (!pat) return;
        if (pat.type === 'Identifier') out.add(pat.name);
        else if (pat.type === 'RestElement') add(pat.argument);
        else if (pat.type === 'AssignmentPattern') { add(pat.left); }
        else if (pat.type === 'ArrayPattern') pat.elements.forEach(add);
        else if (pat.type === 'ObjectPattern') pat.properties.forEach(p => add(p.value ?? p.argument));
    };
    if (node.params) node.params.forEach(add);
    if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') add(node.id);
    if (node.type === 'VariableDeclaration') node.declarations.forEach(d => add(d.id));
    if (node.type === 'ClassDeclaration') add(node.id);
    if (node.type === 'CatchClause') add(node.param);
    // lets/consts de bloque: escanean el cuerpo del bloque / la init del for
    if (node.type === 'BlockStatement') {
        for (const s of node.body) {
            if (s.type === 'VariableDeclaration') s.declarations.forEach(d => add(d.id));
            if (s.type === 'FunctionDeclaration' || s.type === 'ClassDeclaration') add(s.id);
        }
    }
    if ((node.type === 'ForStatement' && node.init?.type === 'VariableDeclaration')
        || ((node.type === 'ForInStatement' || node.type === 'ForOfStatement')
            && node.left?.type === 'VariableDeclaration')) {
        const d = node.init || node.left;
        d.declarations.forEach(x => add(x.id));
    }
    return out;
}
const FN = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']);
const BLOCK = new Set(['BlockStatement', 'ForStatement', 'ForInStatement', 'ForOfStatement', 'CatchClause', 'SwitchStatement']);

// propiedades del AST que hay que saltar: identificadores que NO son "usos"
function isNonUse(node, parent, key) {
    if (node.type !== 'Identifier') return true;
    if (parent.type === 'MemberExpression' || parent.type === 'OptionalMemberExpression')
        return key === 'property' && !parent.computed;
    if ((parent.type === 'Property' || parent.type === 'PropertyDefinition' || parent.type === 'ObjectProperty')
        && key === 'key' && !parent.computed) return true;
    if (parent.type === 'LabeledStatement' && key === 'label') return true;
    if ((parent.type === 'VariableDeclarator' || parent.type === 'FunctionDeclaration'
        || parent.type === 'FunctionExpression' || parent.type === 'ClassDeclaration'
        || parent.type === 'CatchClause') && key === 'id') return true;
    if (parent.type === 'MethodDefinition' && key === 'key') return true;
    if (parent.type === 'ImportSpecifier' || parent.type === 'ExportSpecifier'
        || parent.type === 'ImportDefaultSpecifier' || parent.type === 'ImportNamespaceSpecifier') return true;
    if ((parent.type === 'Property' || parent.type === 'ObjectProperty') && key === 'value' && parent.shorthand) return 'shorthand';
    if (parent.type === 'AssignmentPattern' && key === 'left') return true;
    return false;
}

const renames = [];   // {start, end, name, shorthand}
const shadowed = [];  // {name, pos}
const missing = [];   // usos fuera del closure (no debería haber)

// scope: {names:Set, isStateScope:bool} — el scope del cuerpo de
// initTeclear contiene las vars de estado (ES el binding que migramos)
function walk(node, parent, key, scopes) {
    if (!node || typeof node.type !== 'string') return;

    if (node.type === 'Identifier') {
        const nu = isNonUse(node, parent, key);
        if (nu === true || !stateVars.has(node.name)) return;
        // resolución: del scope más interno hacia fuera; el primero que
        // declare el nombre gana — si es el del closure, renombramos
        for (let i = scopes.length - 1; i >= 0; i--) {
            const s = scopes[i];
            if (s.names.has(node.name)) {
                if (s.isStateScope) {
                    renames.push({ start: node.start, end: node.end, name: node.name, shorthand: nu === 'shorthand' });
                } else {
                    shadowed.push({ name: node.name, pos: node.start });
                }
                return;
            }
        }
        missing.push({ name: node.name, pos: node.start });
        return;
    }

    // scope de ESTE nodo (bindings que ocultarían la var de estado)
    let inner = scopes;
    if (FN.has(node.type) || BLOCK.has(node.type)) {
        inner = scopes.concat([{ names: declaredNames(node), isStateScope: node === initFn.body }]);
    }

    for (const k in node) {
        if (k === 'type' || k === 'start' || k === 'end') continue;
        const v = node[k];
        if (Array.isArray(v)) v.forEach(c => c && c.type && walk(c, node, k, inner));
        else if (v && v.type) walk(v, node, k, inner);
    }
}

walk(ast, null, null, []);

// ---- 3. aplicar renombres con magic-string
const ms = new MagicString(src);
// decls que se eliminan enteras (para filtrar renombres solapados)
const killRanges = [];
for (const info of stateVars.values()) {
    if (info.stmt.declarations.length === 1) killRanges.push([info.stmt.start, info.stmt.end + 1]);
}
let skipped = 0;
for (const r of renames) {
    if (killRanges.some(([a, b]) => r.start >= a && r.end <= b)) { skipped++; continue; }
    ms.update(r.start, r.end, r.shorthand ? `${r.name}: S.${r.name}` : `S.${r.name}`);
}

// ---- 4. eliminar las declaraciones let x = $state (se mueven a GameState)
const removed = new Set();
for (const [name, info] of stateVars) {
    if (info.stmt.declarations.length === 1) {
        // línea entera fuera (incluye comentario en línea si lo hay — se conserva en el campo nuevo)
        removed.add(info.stmt);
        ms.remove(info.stmt.start, info.stmt.end + (src[info.stmt.end] === '\n' ? 1 : 0));
    } else {
        // declarador suelto dentro de un let múltiple
        ms.remove(info.decl.start, info.decl.end);
        // limpiar la coma que pueda quedar colgando
    }
}
if (skipped) console.log('renombres saltados (dentro de decls eliminadas):', skipped);
console.log('renombres aplicados:', renames.length, '· shadowed:', shadowed.length, '· decl eliminadas:', removed.size, '· fuera:', missing.length);
if (shadowed.length) console.log('SOMBRAS (revisar a mano):', shadowed.map(s => `${s.name}@${s.pos}`).join(', '));
if (missing.length) console.log('FUERA DEL CLOSURE:', missing.map(s => `${s.name}@${s.pos}`).join(', '));

fs.writeFileSync(PATH, ms.toString());

// ---- 5. emitir state.svelte.js con los inicializadores movidos
const fields = [];
for (const [name, info] of stateVars) {
    let initSrc = info.init ? src.slice(info.init.start, info.init.end) : '';
    // quita el wrapper $state(...): el campo ya lo lleva
    const m = initSrc.match(/^\$state\((.*)\)$/s);
    fields.push(`    ${name} = $state(${m ? m[1] : initSrc});`);
}
const cls = `// Estado reactivo del juego: una única instancia compartida por
// engine, modos, servicios y componentes. Vive en el módulo (no en
// window), así que no se puede tocar desde la consola del navegador.
import { getSetting } from './settings.js';

export class GameState {
${fields.join('\n')}
}

export const S = new GameState();
`;
fs.writeFileSync('src/lib/teclear/state.svelte.js', cls);
console.log('state.svelte.js escrito con', fields.length, 'campos');
