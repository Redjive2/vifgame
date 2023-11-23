const Cool = module(exports => {
    const { select } = require(Mod)

    function Counter(start, inc) {
        let count = start

        function click() {
            count += inc
        }

        return <jsx>
            <button use:{click}>
                count is ${count}
            </button>
        </jsx>
    }

    console.log('loaded cool.jsx')
})
