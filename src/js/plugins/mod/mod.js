const { Mod, module, require } = (() => {
    const o = {},
        auth = Symbol(),
        backAuth = Symbol(),
        schemaAuth = Symbol(),
        modAuth = Symbol();

    (exports => {
        (() => {
            const modReg = new Map

            exports.module = module
            function module(f) {
                const modID = Symbol()

                const load = () => {
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

            exports.apply = function(...objects) {
                if (objects.length < 2 || objects.some(it => typeof it !== 'object' || it === null)) {
                    throw 'unsupported data passed to Mod.spread(...objects)'
                }

                let r = objects[0]
                for (const i in objects) {
                    if (i === 0) {
                        continue
                    }

                    for (const j in objects[i]) {
                        r[j] = objects[i][j]
                    }
                }
            }

            exports.type = type
            function type(val) {
                if (val === null) {
                    return 'null'
                }

                if (Array.isArray(val)) {
                    return 'array'
                }

                if (val instanceof HTMLElement) {
                    return 'element'
                }

                return typeof val
            }


            exports.doc = document
            exports.win = window


            const domParser = new DOMParser()
            exports.html = function(sts, ...interps) {
                const rand = String(Math.random())
                const strings = sts.map(it => it.replace('<>', '<frag>').replace('</>', '</frag>'))

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

                html.querySelectorAll('frag').forEach(frag => {
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
                let toAppend = []

                for (const key in Object.keys(html.body.childNodes)) {
                    const node = html.body.childNodes[key]
                    toAppend.push(node)
                }

                for (const node of toAppend) {
                    frag.append(node)
                }

                for (const child of frag.children) {
                    patch(child)
                }

                return frag
            }


            // returns the first child matching the given query
            exports.select = function(strings, ...interps) {
                let s = ''
                for (const i in strings) {
                    s += strings[i]
                    if (i in interps) {
                        s += interps[i]
                    } else {
                        break
                    }
                }

                return document.querySelector(s)
            }

            // narrows the returned select function onto the first valid child of the query list
            exports.select.from = function(...args) {
                let el = document

                for (const key in args) {
                    const arg = args[key]

                    if (key === 0 && type(arg) === 'element') {
                        el = arg
                    } else if (type(arg) === 'string') {
                        el = el.querySelector(arg)
                    }
                }

                const f = function(st, ...int) {
                    let s = ''
                    for (const i in st) {
                        s += st[i]
                        if (i in int) {
                            s += int[i]
                        } else {
                            break
                        }
                    }

                    return el.querySelector(s)
                }

                f.all = function(st, ...int) {
                    let s = ''
                    for (const i in st) {
                        s += st[i]
                        if (i in int) {
                            s += int[i]
                        } else {
                            break
                        }
                    }

                    return el.querySelectorAll(s)
                }

                return f
            }

            // narrows the returned select function onto all valid children of the query list
            exports.select.from.all = function(...args) {
                let els = document

                for (const key in args) {
                    const arg = args[key]

                    if (key === 0 && type(arg) === 'element') {
                        els = [arg]
                    } else if (type(arg) === 'string') {
                        const r = []
                        for (const el of els) {
                            for (const res of el.querySelectorAll(arg)) {
                                r.push(res)
                            }
                        }

                        els = r
                    }
                }

                const f = function(st, ...int) {
                    let s = ''
                    for (const i in st) {
                        s += st[i]
                        if (i in int) {
                            s += int[i]
                        } else {
                            break
                        }
                    }

                    const r = []
                    for (const el of els) {
                        r.push(el.querySelector(s))
                    }

                    return r
                }

                f.all = function(st, ...int) {
                    let s = ''
                    for (const i in st) {
                        s += st[i]
                        if (i in int) {
                            s += int[i]
                        } else {
                            break
                        }
                    }

                    const r = []
                    for (const el of els) {
                        r.push(el.querySelectorAll(s))
                    }

                    return r
                }

                return f
            }

            // returns all children matching the given query
            exports.select.all = function(strings, ...interps) {
                if (type(strings) === 'element' && interps.length === 0) {
                    return function(st, ...int) {
                        let s = ''
                        for (const i in st) {
                            s += st[i]
                            if (i in int) {
                                s += int[i]
                            } else {
                                break
                            }
                        }

                        return strings.querySelectorAll(s)
                    }
                }

                let s = ''
                for (const i in strings) {
                    s += strings[i]
                    if (i in interps) {
                        s += interps[i]
                    } else {
                        break
                    }
                }

                return document.querySelectorAll(s)
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

            function unpackSchema(box) {
                if (!(
                    type(box) === 'object' &&
                    '#__unpack' in box
                )) {
                    throw 'Unsupported box type passed to (private) Mod.unpackSchema(box)'
                }

                const [sa, res] = box['#__unpack'](auth)

                if (sa === schemaAuth) {
                    return res
                } else {
                    throw 'Invalid credentials in box passed to (private) Mod.unpackSchema(box)'
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

            exports.boolean = val => !!val
            exports.number = val => +val
            exports.string = val => `${val}`

            exports.keyof = function(o) {
                if (typeof o !== 'object') {
                    throw 'invalid type `' + type(o) + '` provided to Mod.keyof(o)'
                }

                return Object.keys(o)
            }

            exports.constant = function(val) {
                const res = structuredClone(val)

                function constify(v) {
                    if (type(v) === 'object' || type(v) === 'array') {
                        for (const k in v) {
                            constify(v[k])
                        }
                    }

                    Object.freeze(v)
                }

                constify(res)
                return res
            }

            exports.equivalent = function(left, right) {
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

            const vt = {}
            exports.vt = vt
            vt.schema = schema
            function schema(template) {
                return {
                    '#__unpack'(a) {
                        if (a === auth) {
                            return [schemaAuth, template]
                        } else {
                            throw 'Unauthorized attempt to unpack vt template'
                        }
                    }
                }
            }

            function createSchemaType(val) {
                return {
                    '#__unpack'(a) {
                        if (a === auth) {
                            return [backAuth, val]
                        } else {
                            throw 'Unauthorized attempt to unpack vt type'
                        }
                    }
                }
            }

            const $ = {}
            // results of `type(...)`
            $.string = createSchemaType('string')
            $.number = createSchemaType('number')
            $.bigint = createSchemaType('bigint')
            $.symbol = createSchemaType('symbol')
            $.null = createSchemaType('null')
            $.undefined = createSchemaType('undefined')
            $.array = createSchemaType('array')
            $.object = createSchemaType('object')
            $.element = createSchemaType('element')
            // special types
            $.integer = createSchemaType('integer')
            $.any = createSchemaType('Any')
            // compound types
            $.Union = (...types) => createSchemaType('(Union::' + types.map(it => tryUnpack(it)).join('|') + ')')
            $.Record = (type) => createSchemaType('(Record::' + tryUnpack(type) + ')')
            $.Array = (type) => createSchemaType('(Array::' + tryUnpack(type) + ')')
            $.Rest = (type) => createSchemaType('(Rest::' + tryUnpack(type) + ')')

            function tryUnpack(maybeBox) {
                if (type(maybeBox) !== 'object' || !('#__unpack' in maybeBox)) {
                    return maybeBox
                }

                return unpack(maybeBox)
            }



            vt.$ = $

            // schema($.string)  |  schema({ cool: $.string })  |  schema([$.string])  |  schema($.Array($.string))
            vt.parse = function(template, target) {
                function p(temp, targ) {
                    if (type)

                    if (type(temp) !== type(targ)) {
                        return false
                    }
                }

                return p(template, target)
            }

            // template or vt-type
            vt.stringify = function(item) {

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
        Mod: {
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
        }
    }
})();



(() => {
    async function run(f) {
        await f()
    }

    run(async() => {
        const thisPath = document
            .querySelector('script[src$="mod.js"]')
            .getAttribute('src')

        const slPath = thisPath.slice(0, thisPath.lastIndexOf('/') + 1) + 'path.sl'

        const resp = await fetch(slPath)
        const slText = await resp.text()
        const files = parseSl(slText)

        function parseSl(sl) {
            const lines = sl.split('\n').map(it => it.trim()).filter(it => it.trim() !== '')

            const truncated = []
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

                    truncated.push(res)
                }
            }

            return truncated
        }


        for (const file of files.filter(it => it.type === 'jsx')) {
            const host = document.createElement('script')
            host.setAttribute('type', 'text/javascript')

            let processed = await fetch(file.full)
            processed = await processed.text()
            processed = processed.replace(/\s*const\s+([A-Z][a-zA-Z_$]+)\s+=\s+module\s*\(\s*exports\s*=>\s*\{/, 'const $1 = module(exports => {\n    const $__MOD = require(Mod);')

            let out = ''
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

                for (const buf of buffers) {
                    out += buf
                        .replaceAll('<jsx>', '$__MOD.html`')
                        .replaceAll('</jsx>', '`')
                        .replaceAll(/on:([a-zA-Z\-_]+)=\{/g, `on:$1=\${`)
                        .replaceAll(/use:\{/g, `use:\${`)
                        .replaceAll(/([A-Za-z\-]+)=\{/g, `$1=\${`)
                }
            } else {
                out = processed
                    .replaceAll('<jsx>', '$__MOD.html`')
                    .replaceAll('</jsx>', '`')
                    .replaceAll(/on:([a-zA-Z\-_]+)=\{/g, `on:$1=\${`)
                    .replaceAll(/use:\{/g, `use:\${`)
                    .replaceAll(/([A-Za-z\-]+)=\{/g, `$1=\${`)
            }

            const temp = new File([`// compiled by SL from source: ${file.full} \n'use strict';\n\n` + out], file.name, {
                type: 'text/javascript'
            })

            host.setAttribute('sl-from', file.full)
            host.src = URL.createObjectURL(temp)

            document.body.append(host)
        }


        for (const file of files.filter(it => it.type === 'js' && it.name !== 'mod')) {
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

        //document.body.innerHTML = `${files.filter(it => it.type === 'js').map(it => `<script src="${it.full}"></script>`).join('\n')}\n\n${document.body.innerHTML}`
    })
})()
