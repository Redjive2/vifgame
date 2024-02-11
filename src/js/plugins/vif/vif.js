

/*

GLOBAL EXPORTS:

    module((exports) => void) => Module
    require(Module) => Record<String, any>
    main(() => void) => void
    println(...any) => void

IN VIF:
    query(string)                                                         // just querySelector
        queryAll(string)                                                  // just querySelectorAll

    run(fn) => void                                                       // runs a function

    timeout(number, () => void) => Timeout                                // setTimeout but better
    interval(number, () => void) => Interval                              // setInterval but better

    pipe(T, ...(any) => any) => any                                       // pipes a value through a series of transformations
        pipe.safe(...) => ...                                             // pipe, but early returns on failure
        pipe.opt(...) => ...                                              // pipe, but early returns on null/undefined

    info(any) => Object                                                   // gives all the following three
        type(any) => string                                               // typeof, but has special cases for  null, array, and dom nodes
        exists(any) => boolean                                            // checks if a value is not null and not undefined
        iterable(any) => boolean                                          // checks if a value is not null and is an object | array

    html `string` => Document.Fragment                                    // returns an html element parsed from html-jsx as a string template
    html.el `string` => Document.Element                                  // same as html, but only returns first element of the frag

    keyof(Object) => string[]                                             // literally Object.keys(Object)

    constant(T) => readonly T                                             // literally Object.freeze(Object) but deep

    equivalent(any, any) => boolean                                       // structurally compares two values
    matches(any, ...any) => boolean                                       // checks if the first value matches any of the following using ===
        matches.equivalent(any, ...any) => boolean                        // same as matches, but using structural equality

*/

const { Vif, module, require, println } = (() => {
    const o = {},
        auth = Symbol(),
        backAuth = Symbol(),
        modAuth = Symbol();

    (exports => {
        (() => {
            const modReg = new Map()

            exports.module = module
            function module(f) {
                const modID = Symbol()

                const load = function() {
                    if (modReg.has(modID)) {
                        return modReg.get(modID)
                    }

                    const t = {}
                    f(t)

                    modReg.set(modID, t)
                    return Object.freeze(t)
                }

                return Object.freeze({
                    '#__unpack'(a) {
                        if (a === auth) {
                            return [modAuth, load()]
                        } else {
                            throw 'Unauthorized attempt to unpack module'
                        }
                    }
                })
            }

            exports.query = function(first, ...rest) {
                let cur

                if (typeof first !== "string") {
                    cur = first.querySelector(rest.shift())
                } else {
                    cur = document.querySelector(first)
                }

                for (const query of rest) {
                    cur = cur.querySelector(query)
                }

                return cur
            }

            exports.run = function run(f) {
                return f()
            }

            exports.timeout = function timeout(delay, callback) {
                const id = setTimeout(callback, delay)

                return Object.freeze({
                    clear: () => clearTimeout(id)
                })
            }

            exports.interval = function(delay, callback) {
                const id = setInterval(callback, delay)

                return Object.freeze({
                    clear: () => clearInterval(id)
                })
            }


            // applies a series of mutator functions onto the result of the previous version, then returns the result
            exports.pipe = function(start, ...mutators) {
                if (mutators.length === 0 || mutators.some(it => typeof it !== 'function')) {
                    throw 'unsupported data passed to Mod.pipe.apply(ref, ...mutations)'
                }

                let acc = start
                for (const mut of mutators) {
                    acc = mut(acc)
                }

                return acc
            }

            // early returns on null | undefined
            exports.pipe.opt = function(start, ...mutators) {
                if (mutators.length === 0 || mutators.some(it => typeof it !== 'function')) {
                    throw 'unsupported data passed to Mod.pipe.apply(ref, ...mutations)'
                }

                let acc = start
                for (const mut of mutators) {
                    const res = mut(acc)
                    if (res === null || res === undefined) {
                        return acc
                    }

                    acc = res
                }

                return acc
            }

            // early returns on err
            exports.pipe.safe = function(start, ...mutators) {
                if (mutators.length === 0 || mutators.some(it => typeof it !== 'function')) {
                    throw 'unsupported data passed to Mod.pipe.apply(ref, ...mutations)'
                }

                let acc = start
                for (const mut of mutators) {
                    let res
                    try {
                        res = mut(acc)
                    } catch (_) {
                        return acc
                    }

                    acc = res
                }

                return acc
            }


            exports.info = function(val) {
                return Object.freeze({
                    type: type(val),
                    exists: val !== null && val !== undefined,
                    iterable: typeof val === 'object' && val !== null
                })
            }


            exports.type = type
            function type(val) {
                if (val === null) {
                    return 'null';
                }

                if (Array.isArray(val)) {
                    return 'array';
                }

                if (val instanceof Node) {
                    return 'node';
                }

                if (val instanceof Error) {
                    return 'error';
                }

                return typeof val;
            }


            exports.doc = document
            exports.win = window

            const domParser = new DOMParser()
            exports.html = function(sts, ...interps) {
                const rand = String(Math.random())
                const strings = sts

                let htmlString = ''
                for (const i in strings) {
                    if (i in interps) {
                        if (type(interps[i]) === 'function' &&
                            strings[i].endsWith('=') &&
                            strings[i].slice(strings[i].lastIndexOf(' ') + 1).startsWith('on:') &&
                            strings[i].slice(strings[i].lastIndexOf(' ') + 1).endsWith('=') &&
                            strings[i].slice(strings[i].lastIndexOf(' ') + 1).length < 32
                        ) {
                            htmlString += strings[i]
                            htmlString += '"#_' + rand + '--' + i + '"'
                        } else if (type(interps[i]) === 'function' &&
                            strings[i].endsWith(':') &&
                            strings[i].slice(strings[i].lastIndexOf(' ') + 1).startsWith('use:')
                        ) {
                            htmlString += strings[i].slice(0, strings[i].length - 4) + 'on:' + interps[i].name + '='
                            htmlString += '"#_' + rand + '--' + i + '"'
                        } else if (strings[i].endsWith('=')) {
                            htmlString += strings[i] + '"'
                            htmlString += interps[i] + '"'
                        } else {
                            htmlString += strings[i]
                            htmlString += interps[i]
                        }
                    } else {
                        htmlString += strings[i]
                    }
                }

                const html = domParser.parseFromString(htmlString, 'text/html')

                html.querySelectorAll('fragment').forEach(frag => {
                    const docFrag = html.createDocumentFragment()

                    const localToAppend = []
                    for (const node of frag.childNodes) {
                        localToAppend.push(node)
                    }

                    for (const node of localToAppend) {
                        docFrag.append(node)
                    }

                    frag.parentNode.insertBefore(docFrag, frag)
                    frag.remove()
                })

                function patch(el) {
                    for (const attr of el.attributes) {
                        if (attr.name.startsWith('on:') && attr.value.startsWith(`#_${rand}--`)) {
                            const index = parseInt(attr.value.slice(attr.value.lastIndexOf('-') + 1))

                            el.removeAttribute(attr.name)
                            el.addEventListener(attr.name.slice(3), interps[index])
                        }
                    }

                    for (const child of el.children) {
                        patch(child)
                    }
                }

                const frag = html.createDocumentFragment()

                for (let i = html.body.childNodes.length - 1; i >= 0; i--) {
                    frag.prepend(html.body.childNodes[i])
                }

                for (const child of frag.children) {
                    patch(child)
                }

                return frag
            }



            exports.html.el = function(string, ...interps) {
                const html = exports.html(string, ...interps)

                if (html.children.length !== 1) {
                    throw 'template string passed to Mod.html.el must generate 1 element'
                }

                return html.firstChild
            }


            function unpack(box) {
                if (!(
                    type(box) === 'object' &&
                    '#__unpack' in box
                )) {
                    throw 'Unsupported box type passed to (private) Mod.unpack(box)'
                }

                const [ba, res] = box['#__unpack'](auth)

                if (ba === backAuth) {
                    return res
                } else {
                    throw 'Invalid credentials in box passed to (private) Mod.unpack(box)'
                }
            }

            exports.unpackModule = unpackModule
            function unpackModule(box) {
                if (!(
                    type(box) === 'object' &&
                    '#__unpack' in box
                )) {
                    throw 'Unsupported box type passed to (private) Mod.unpackModule(box)'
                }

                const [ma, res] = box['#__unpack'](auth)

                if (ma === modAuth) {
                    return res
                } else {
                    throw 'Invalid credentials in box passed to (private) Mod.unpackModule(box)'
                }
            }


            exports.exists = function(val) {
                return val !== null && val !== undefined
            }

            const iterable = val => ((typeof val === 'object') && (!!val))
            exports.iterable = iterable

            exports.keyof = function(o) {
                if (typeof o !== 'object') {
                    throw 'invalid type `' + type(o) + '` provided to Mod.keyof(o)'
                }

                return Object.keys(o)
            }

            exports.constant = function(val) {
                function constify(v) {
                    if (type(v) === 'object' || type(v) === 'array') {
                        for (const k in v) {
                            constify(v[k])
                        }
                    }

                    Object.freeze(v)
                }

                constify(val)
                return val
            }


            exports.equivalent = equivalent
            function equivalent(left, right) {
                function eq(a, b) {
                    if (type(a) !== type(b)) {
                        return false
                    }

                    const compType = type(a)

                    if (compType === 'function') {
                        const sa = String(a).replace(/\s+/, '')
                        const sb = String(b).replace(/\s+/, '')
                        return (
                            /* same signature */ sa.slice(0, sa.indexOf('{')) === sb.slice(0, sb.indexOf('{')) &&
                            sa === sb
                        )
                    } else if (compType !== 'object' && compType !== 'array') {
                        return a === b
                    }

                    for (const key in a) {
                        if (
                            !(key in b) ||
                            !eq(a[key], b[key])
                        ) {
                            return false
                        }
                    }

                    for (const key in b) {
                        if (!(key in a)) {
                            return false
                        }
                    }

                    return true
                }

                return eq(left, right)
            }


            exports.matches = matches
            function matches(left, ...right) {
                return right.includes(left)
            }

            matches.equivalent = function(left, ...right) {
                return right.some(it => equivalent(left, it))
            }
        })()

        return exports
    })(o)

    Object.freeze(o)

    const r = {}
    for (const key in o) {
        if (key !== 'module' && key !== 'unpackModule') {
            r[key] = o[key]
        }
    }

    return {
        Vif: {
            '#__unpack'(a) {
                if (a === auth) {
                    return [modAuth, r]
                } else {
                    throw 'Unauthorized attempt to unpack module'
                }
            }
        },

        module: o.module,

        require(...modules) {
            if (modules.length === 0) {
                return {}
            }

            let r = {}
            for (const module of modules) {
                r = {
                    ...r,
                    ...o.unpackModule(module)
                }
            }

            return r
        },

        println(...values) {
            console.log(...values)
        }
    }
})();

(() => {
    async function run(f) {
        await f()
    }

    run(async() => {
        const thisPath = document
            .querySelector('script[src$="vif.js"]')
            .getAttribute('src')

        const slPath = thisPath.slice(0, thisPath.lastIndexOf('/') + 1) + 'path.sl'

        const resp = await fetch(slPath)
        const slText = await resp.text()
        const files = parseSl(slText)

        function parseSl(sl) {
            const lines = sl.split('\n').map(it => it.trim()).filter(it => it.trim() !== '')

            const full = []
            const paths = []
            for (const line of lines) {
                if (line === '[-]') {
                    paths.pop()
                } else if (line.startsWith('[') && line.endsWith(']') && /[a-zA-Z\-0-9]+/.test(line.slice(1, -1))) {
                    paths.push(line.slice(1, -1))
                } else {
                    let path = ''

                    if (paths.length !== 0) {
                        path += paths.join('/') + '/'
                    }

                    path += line

                    let res = {
                        type: path.slice(path.lastIndexOf('.') + 1),
                        full: path,
                        name: path.slice(path.lastIndexOf('/') + 1).slice (
                            0,
                            path.slice(path.lastIndexOf('/') + 1).indexOf('.')
                        )
                    }

                    full.push(res)
                }
            }

            return full
        }


        for (const file of files.filter(it => it.type === 'jsx')) {
            const host = document.createElement('script')
            host.setAttribute('type', 'text/javascript')

            let processed = await fetch(file.full)
            processed = await processed.text()

            let out = ''

            function translateJSX(jsx) {
                let final = jsx
                    .replaceAll('module(() => {', 'module(exports => {')
                    .replaceAll('<>', '$__VIF.html`')
                    .replaceAll('</>', '`')
                    .replaceAll(/([A-Za-z\-]+)=\{/g, `$1=\${`)
                    .replaceAll(
                        /\n\s*\n(\s*)@export\s+(const|let|var)\s+([a-zA-Z_$]+)/g,
                        '\n\n$1let $3;\n$1exports.$3 = $3'
                    )
                    .replaceAll(
                        /(\s*)@export\s+(function|class)\s+([a-zA-Z_$]+)/g,
                        '$1exports.$3 = $3;\n$1$2 $3'
                    )
                    .replaceAll(
                        /@import\(([a-zA-Z_$]+)\)\s*let\s*([a-zA-Z_$]+)(,\s*[a-zA-Z_$]+\s*)*;?/g,
                        (_, source, first, rest) => 'const {' + first + (rest ?? '') + '} = require(' + source + ');'
                    )
                    .replaceAll(
                        /@module\s+const\s+([a-zA-Z_$]+)\s*=\s*\(\s*\)\s*=>\s*\{/g,
                        'const $1 = module(__$1); function __$1(exports) { const $__VIF = require(Vif); '
                    )
                    .replaceAll(/@auto\s+constructor\s*\(\s*\)\s*;/g, `constructor() {
        super();
        this.internals = this.attachInternals();
        this.shadow = this.attachShadow({mode:"open"});
        for (const key of Object.getOwnPropertyNames(this.__proto__)) {
            if (key.startsWith('w__')) {
                this[key]();
            }
        }
        if ("__vifInit" in this) this.__vifInit();
    }`)
                    .replaceAll(/@handle\s+init\s*\(\s*\)\s*\{/g, '__vifInit() {')
                    .replaceAll(/@handle\s+([a-zA-Z_$]+)/g, '$1Callback')

                let names = []

                final = final.replaceAll(/@component\s+class\s+([A-Z][a-zA-Z_$]*)\s*\{/g, (_, name) => {
                    const elName = name.replaceAll(/([A-Z])/g, it => '-' + it.toLowerCase()).slice(1)
                    names.push([name, elName])
                    return 'exports.' + name + ' = class extends HTMLElement {'
                })

                final = final.replaceAll(/@\$\s+([a-zA-Z_$]+)\s*=/g, '__$1_l=[];get $1(){return this.__$1};set $1(v){this.__$1=v;for(const l of this.__$1_l){l.call(this)}}\n__$1 =')
                    .replaceAll(/@watch\s*\(\s*this.([a-zA-Z_$]+)\)\s*([a-zA-Z_$]+)\s*\(\s*\)\s*\{/g, 'w__$2() { if(!(this.__$1_l.includes(this.w__$2))) {this.__$1_l.push(this.w__$2); return}')
                return final + `;(() => { ` + (names.length > 0 ? `const {${names.map(it => it[0]).join(', ')}} = require(Components); ` : '') + `${names.map(([name, elName]) => 'customElements.define("' + elName + '", ' + name + ');').join(' ')} })();`
            }

            if (processed.length > 5000) {
                const lines = processed.split('\n')

                let buffers = [[]]
                let j = 0
                let count = 0

                for (const i in lines) {
                    buffers[j].push(lines[i])
                    count++

                    if (count === 25) {
                        count = 0
                        j++
                        buffers.push([])
                    }
                }

                buffers = buffers.filter(it => it.length > 0).map(it => it.join('\n'))

                let CUUID = 0;

                for (const buffer of buffers) {
                    out += translateJSX(buffer)
                }
            } else {
                out = translateJSX(processed)
            }

            const temp = new File([`// compiled by SL from source: ${file.full} \n'use strict';\n\n` + out], file.name, {
                type: 'text/javascript'
            })

            host.setAttribute('sl-from', file.full)
            host.src = URL.createObjectURL(temp)

            document.body.append(host)
        }


        for (const file of files.filter(it => it.type === 'js' && it.name !== 'vif')) {
            const host = document.createElement('script')
            host.setAttribute('type', 'text/javascript')
            host.setAttribute('src', file.full)

            document.body.append(host)
        }

        for (const file of files.filter(it => it.type === 'css')) {
            const host = document.createElement('link')
            host.setAttribute('type', 'text/css')
            host.setAttribute('rel', 'stylesheet')
            host.setAttribute('href', file.full)

            document.head.append(host)
        }

        setTimeout(() => {
            const onLoad = `
            (async() => {
                let main

                try {
                    require(Components)
                } catch (_) {}

                try {
                    main = require(Main)
                } catch (e) {
                    if (e instanceof ReferenceError) {
                        throw 'VIF/SL: no module "main" found in path.sl provided files'
                    } else {
                        throw e
                    }
                }

                try {
                    main.main()
                } catch (e) {
                    if (e instanceof ReferenceError) {
                        throw 'VIF/SL: no function "main" found in module "main" in path.sl provided files'
                    } else {
                        throw e
                    }
                }
            })()
            `

            const host = document.createElement('script')
            host.setAttribute('type', 'text/javascript')
            host.textContent = onLoad

            document.body.append(host)
        }, 125)
    })
})();
