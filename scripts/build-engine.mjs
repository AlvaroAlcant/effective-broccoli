// build-engine.mjs — convierte el closure initTeclear() en la clase GameEngine
import fs from 'fs';
import * as acorn from 'acorn';
import MagicString from 'magic-string';

const SRC = 'src/lib/teclear/game.svelte.js';
const OUT = 'src/lib/teclear/engine.svelte.js';
const src = fs.readFileSync(SRC, 'utf8');
const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module' });
const slice = n => src.slice(n.start, n.end);
const walk = (n, f) => { if (!n || typeof n !== 'object') return; if (n.type) f(n); for (const k in n) { if (k === 'type' || k === '_parent') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(x => walk(x, f)); else if (v && typeof v === 'object' && v.type) walk(v, f); } };

const imports = ast.body.filter(n => n.type === 'ImportDeclaration').map(slice);
const fn = ast.body.find(n => n.type === 'FunctionDeclaration' && n.id.name === 'initTeclear')
    || ast.body.find(n => n.type === 'ExportNamedDeclaration' && n.declaration &&
                       n.declaration.id && n.declaration.id.name === 'initTeclear').declaration;

const fields = [], elementNames = [], methods = [], getters = [], mount = [], moduleConsts = [];
const memberNames = new Set();   // nombres que se referencian como this.x dentro
const methodNames = new Set();
let actionsObj = null;

const isGetEl = init => init && init.type === 'CallExpression' &&
    init.callee.type === 'MemberExpression' &&
    init.callee.object.name === 'document' &&
    init.callee.property.name === 'getElementById';

for (const st of fn.body.body) {
    if (st.type === 'VariableDeclaration') {
        for (const d of st.declarations) {
            const nm = d.id.name;
            if (isGetEl(d.init)) {
                elementNames.push(nm); memberNames.add(nm);
                mount.push(`this.${nm} = ${slice(d.init)};`);
            } else if (nm === 'A') {
                actionsObj = d.init;
            } else if (nm === 'LOGO_PHRASES') {
                moduleConsts.push(`const ${nm} = ${slice(d.init)};`);
            } else if (nm === 'ADMIN_NAMES' || nm === 'VERIFY_CHARS') {
                // código muerto: nunca se referencian
            } else {
                memberNames.add(nm);
                let initTxt = d.init ? slice(d.init) : 'undefined';
                if (nm === 'savedScore') initTxt = `$state(${initTxt})`;
                fields.push(`    ${nm} = ${initTxt};`);
            }
        }
    } else if (st.type === 'FunctionDeclaration') {
        memberNames.add(st.id.name);
        methodNames.add(st.id.name);
        methods.push(slice(st).replace(/^function /, ''));
    } else if (st.type === 'ExpressionStatement' &&
               st.expression.type === 'CallExpression' &&
               st.expression.callee.type === 'MemberExpression' &&
               st.expression.callee.object.name === 'Object' &&
               st.expression.callee.property.name === 'assign' &&
               st.expression.arguments[1].type === 'ObjectExpression') {
        // impl → getters (los mirrors de S desaparecen: la vista lee engine.state.x)
        for (const p of st.expression.arguments[1].properties) {
            const k = p.key.name || p.key.value;
            if (k === 't' || k === 'a' || k === 'level' || k === 'savedScore') continue;
            const v = p.value;
            if (v.type !== 'ArrowFunctionExpression' && v.type !== 'FunctionExpression') continue;
            if (v.body.type === 'MemberExpression' && v.body.object.name === 'S') continue;
            getters.push(v.body.type === 'BlockStatement'
                ? `get ${k}() ${slice(v.body)}`
                : `get ${k}() { return ${slice(v.body)}; }`);
        }
    } else if (st.type === 'ExpressionStatement' && st.expression.type === 'UpdateExpression' && st.expression.argument.name === 'rev') {
        // rev++ muere con el proxy
    } else if (st.type === 'ExpressionStatement' && slice(st).startsWith('Object.values(modes)')) {
        mount.push('        Object.values(modes).forEach(m => { m.engine = this; });');
    } else {
        mount.push('        ' + slice(st));
    }
}

const out = `// ---------- Motor del juego ----------
// GameEngine orquesta el ciclo de juego: estado (S), modos (modes),
// servicios (fx/eco/prog/acc/ranking) y view-models para la vista.
// engine.mount() se llama una vez desde +page.svelte al montar la página.
${imports.join('\n')}

${moduleConsts.join('\n')}

export class GameEngine {
    // Estado reactivo compartido (engine.state.score, engine.state.mode…)
    state = S;
    // i18n: engine.t("clave") en las plantillas
    get t() { return t; }

    // ---------- Interno (no reactivo) ----------
${fields.join('\n')}

    // ---------- Elementos del DOM (se enlazan en mount) ----------
    ${elementNames.map(n => n + ';').join('\n    ')}

    // ---------- View-models (getters: la lectura suscribe al $state) ----------
    ${getters.join('\n\n    ')}

    // ---------- Ciclo de juego y utilidades ----------
    ${methods.join('\n\n    ')}

    // ---------- Acciones para la vista (engine.actions.x) ----------
    actions = ${slice(actionsObj)};

    // ---------- Montaje: elementos, servicios, listeners e init ----------
    mount() {
${mount.join('\n')}
    }
}

export const engine = new GameEngine();
`;

fs.writeFileSync(OUT, out);
console.log('emitido', OUT, out.split('\n').length, 'líneas',
    '| fields:', fields.length, '| methods:', methods.length,
    '| getters:', getters.length, '| mount:', mount.length);

// ---------- Pase 2: this./engine. en referencias a miembros ----------
const out2 = fs.readFileSync(OUT, 'utf8');
const ast2 = acorn.parse(out2, { ecmaVersion: 'latest', sourceType: 'module' });
const ms = new MagicString(out2);
const cls = ast2.body.find(n => n.type === 'ClassDeclaration' && n.id.name === 'GameEngine')
    || ast2.body.find(n => n.type === 'ExportNamedDeclaration' && n.declaration &&
                       n.declaration.id && n.declaration.id.name === 'GameEngine').declaration;
const warnings = [];

// recoge nombres ligados dentro de un scope de función
function boundNames(scopeNode) {
    const names = new Set();
    if (scopeNode.params) for (const p of scopeNode.params) {
        if (p.type === 'Identifier') names.add(p.name);
        else if (p.type === 'AssignmentPattern' && p.left.type === 'Identifier') names.add(p.left.name);
        else if (p.type === 'RestElement' && p.argument.type === 'Identifier') names.add(p.argument.name);
        else if (p.type === 'ObjectPattern') for (const q of p.properties) if (q.value && q.value.type === 'Identifier') names.add(q.value.name);
        else if (p.type === 'ArrayPattern') for (const q of p.elements) if (q && q.type === 'Identifier') names.add(q.name);
    }
    walk(scopeNode.body || scopeNode, n => {
        if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier') names.add(n.id.name);
        if (n.type === 'FunctionDeclaration' && n.id) names.add(n.id.name);
        if ((n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression') && n !== scopeNode) {
            for (const p of n.params) if (p.type === 'Identifier') names.add(p.name);
        }
        if (n.type === 'CatchClause' && n.param && n.param.type === 'Identifier') names.add(n.param.name);
    });
    return names;
}

// convierte FunctionExpression → arrow para que this sea el engine
const isGetSet = n => n._parent && (n._parent.kind === 'get' || n._parent.kind === 'set');
function toArrows(node) {
    walk(node, n => {
        if (n !== node && n.type === 'FunctionExpression' && !isGetSet(n)) {
            const params = n.params.map(slice2).join(', ');
            ms.overwrite(n.start, n.body.start, `(${params}) => `);
            n.converted = true;
        }
    });
}
const slice2 = n => out2.slice(n.start, n.end);

// pase sobre un cuerpo de función: prefija miembros y convierte a arrow
function process(fnNode) {
    // primero arrows (un FunctionExpression anidado tiene this propio)
    toArrows(fnNode);
    // ámbitos anidados: para cada función interior, sus ligados son locales
    const shadowScopes = [];
    walk(fnNode, n => {
        if (n === fnNode) return;
        if (n.type === 'FunctionDeclaration' || n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression') {
            shadowScopes.push({ node: n, names: boundNames(n) });
        }
    });
    const isShadowed = (n, name) => {
        for (const s of shadowScopes) {
            if (n.start > s.node.start && n.end < s.node.end && s.names.has(name)) return true;
        }
        return false;
    };
    // ¿dentro de un get/set del objeto Teclea (this ≠ engine)?
    const inRebound = n => {
        for (const s of shadowScopes) {
            if (n.start > s.node.start && n.end < s.node.end &&
                s.node.type === 'FunctionExpression' && !s.node.converted &&
                isGetSet(s.node)) return true;
        }
        return false;
    };
    walk(fnNode, n => {
        if (n.type === 'Identifier' && memberNames.has(n.name)) {
            const p = n._parent;
            if (!p) return;
            if (isShadowed(n, n.name)) { warnings.push('sombra: ' + n.name + ' @' + n.start); return; }
            // claves de propiedad y propiedades no calculadas: fuera
            if ((p.type === 'Property' || p.type === 'PropertyDefinition' || p.type === 'MethodDefinition') && p.key === n && !p.computed) return;
            if (p.type === 'MemberExpression' && p.property === n && !p.computed) return;
            if (p.type === 'LabeledStatement' || p.type === 'BreakStatement' || p.type === 'ContinueStatement') return;
            const pre = inRebound(n) ? 'engine.' : 'this.';
            const isMethod = methodNames.has(n.name);
            const isCall = p.type === 'CallExpression' && p.callee === n;
            const isAssign = p.type === 'AssignmentExpression' || p.type === 'UpdateExpression';
            if (p.type === 'Property' && p.shorthand) {
                ms.overwrite(n.start, n.end, `${n.name}: ${pre}${n.name}${isMethod ? '.bind(' + pre.slice(0, -1) + ')' : ''}`);
            } else if (!isCall && !isAssign && isMethod) {
                ms.overwrite(n.start, n.end, `${pre}${n.name}.bind(${pre.slice(0, -1)})`);
            } else {
                ms.overwrite(n.start, n.end, `${pre}${n.name}`);
            }
        }
    });
}

// padres para el chequeo anterior
(function markParents(n, parent) {
    if (!n || typeof n !== 'object') return;
    if (n.type) n._parent = parent || null;
    for (const k in n) { if (k === 'type' || k === '_parent') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(x => markParents(x, n)); else if (v && typeof v === 'object' && v.type) markParents(v, n); }
})(ast2, null);

for (const m of cls.body.body) {
    if (m.type === 'MethodDefinition') process(m.value);
    else if (m.type === 'PropertyDefinition' && m.value) {
        // field initializers (actions = {...}): this = engine ya
        process({ type: 'ArrowFunctionExpression', params: [], body: m.value, start: m.value.start, end: m.value.end });
    }
}

fs.writeFileSync(OUT, ms.toString());
console.log('prefijos aplicados; avisos:', warnings.length);
warnings.slice(0, 20).forEach(w => console.log('  ', w));
