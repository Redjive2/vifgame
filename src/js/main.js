



















/**
 * @typedef {(Object) => Object} Component
 * @param {Component} func
 * **/
function goofier(func) {
    'use strict'

}



class _INTERNAL_VALIDATION_ERR extends Error {
    constructor(msg) {
        super();
        this.message = msg
    }
}


function validateProcessedGDLayer(dataLayer) {
    'use strict'

    const err = (() => {
        let errs = []

        return msg => {
            if (msg && typeof msg === 'string') {
                errs.push(msg)
            } else {
                throw new _INTERNAL_VALIDATION_ERR (
                    '\n\n> Call to `validateProcessGDLayer` failed; detected malformations:\n\n   +--->\n   |  ' +
                    errs.join('\n   |  ') +
                    '\n   +--->\n\n' +
                    '> Got dataLayer: `' +
                    JSON.stringify(dataLayer) +
                    '`\n'
                )
            }
        }
    })()

    try {
        if (typeof dataLayer !== 'object') {
            err('dataLayer is of invalid type `' + typeof dataLayer + '`')
        }

        if (
            Object.keys(dataLayer)
                .some(it =>
                    'css attr events markers content field'.split(' ').includes(it) ||
                    !(
                        it.includes('_') &&
                        !(
                            isNaN(parseInt(it.slice(it.lastIndexOf('_')), 10))
                        )
                    )
                )
        ) {
            err('invalid key `' + Object.keys(dataLayer).find(it =>
                'css attr events markers content field'.split(' ').includes(it) ||
                !(
                    it.includes('_') &&
                    !(
                        isNaN(parseInt(it.slice(it.lastIndexOf('_')), 10))
                    )
                )
            ) + '` found in dataLayer')
        }

        for (const key in dataLayer) {
            let halt = dataLayer[key] !== 'object' || Array.isArray(dataLayer[key])

            if (typeof dataLayer[key] !== 'object') {
                err('found key `' + key + '` with invalid value of type `' + typeof dataLayer[key] + '`')
            } else if (Array.isArray(dataLayer[key])) {
                err('found key `' + key + '` with invalid value of kind `Array`')
            }

            if (halt) {
                err()
            }

            validateProcessedGD(dataLayer[key])
        }
    } catch (error) {
        if (!(error instanceof _INTERNAL_VALIDATION_ERR)) {
            err('!! INTERNAL ERROR CAUSED EARLY RETURN')
        }

        err()
    }

    err()
}


function validateProcessedGD(data) {
    'use strict'

    const err = (() => {
        let errs = []

        return msg => {
            if (msg && typeof msg === 'string') {
                errs.push(msg)
            } else {
                throw new _INTERNAL_VALIDATION_ERR (
                    '\n\n> Call to `validateProcessGD` failed; detected malformations:\n\n   +--->\n   |  ' +
                    errs.join('\n   |  ') +
                    '\n   +--->\n\n' +
                    '> Got data: `' +
                    JSON.stringify(data) +
                    '`\n'
                )
            }
        }
    })()

    try {
        if (typeof data !== 'object') {
            err('data is of invalid type `' + typeof data + '`')
        }


        // validate that all keys are valid descriptors and all values are objects
        for (const key in data) {
            if (!(
                'css attr events markers content field'.split(' ').includes(key)
            )) {
                err('invalid descriptor `' + key + '`' + ' found')
            } else if (typeof data[key] !== 'object') {
                err('value of descriptor `' + key + '` is of invalid type `' + typeof data[key] + '`')
            } else if (Array.isArray(data[key])) {
                err('value of descriptor `' + key + '` is of invalid kind `Array`')
            }
        }


        for (const descriptor of 'css attr events markers'.split(' ')) {
            if (!(descriptor in data)) {
                err('missing descriptor `' + descriptor + '` not found')
            }
        }

        for (const key in data.css) {
            if (typeof key !== 'string') {
                err('key in descriptor `css` is of invalid type `' + typeof key + '`')
            }

            if (typeof data.css[key] !== 'string') {
                err('value of key `' + key + '` in descriptor `css` is of invalid type `' + typeof data.css[key] + '`')
            }
        }

        for (const key in data.attr) {
            if (typeof key !== 'string') {
                err('key in descriptor `attr` is of invalid type `' + typeof key + '`')
            }

            if (typeof data.attr[key] !== 'string') {
                err('value of key `' + key + '` in descriptor `attr` is of invalid type `' + typeof data.attr[key] + '`')
            }
        }

        for (const key in data.events) {
            if (typeof key !== 'string') {
                err('key in descriptor `attr` is of invalid type `' + typeof key + '`')
            }

            if (typeof data.attr[key] !== 'function') {
                err('value of key `' + key + '` in descriptor `attr` is of invalid type `' + typeof data.attr[key] + '`')
            }
        }


        // validate that there is EITHER content or field, not both
        if ('content' in data && 'field' in data) {
            err('both field and content descriptors found')
        }

        if ('content' in data) {
            if (typeof data.content !== 'object') {
                err('content descriptor is of invalid type `' + typeof data.content + '`')
            }

            if (Object.keys(data.content).length === 0) {
                err('empty content descriptor')
            }

            if (
                Object.keys(data.content)
                    .some(it =>
                        'css attr events markers content field'.split(' ').includes(it) ||
                        !(
                            it.includes('_') &&
                            !(
                                isNaN(parseInt(it.slice(it.lastIndexOf('_')), 10))
                            )
                        )
                    )
            ) {
                err('invalid key in content `' + Object.keys(data.content).find(it =>
                    'css attr events markers content field'.split(' ').includes(it) ||
                    !(
                        it.includes('_') &&
                        !(
                            isNaN(parseInt(it.slice(it.lastIndexOf('_')), 10))
                        )
                    )
                ) + '`')
            }

            for (const key in data.content) {
                validateProcessedGD(data.content[key])
            }
        } else if ('field' in data) {
            if (typeof data.field !== 'string') {
                err('field descriptor is of invalid type `' + typeof data.field + '`')
            }
        }
    } catch (error) {
        if (!(error instanceof _INTERNAL_VALIDATION_ERR)) {
            err('!! INTERNAL ERROR CAUSED EARLY RETURN')
        }

        err()
    }

    err()
}
