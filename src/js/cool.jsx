const Cool = module(() => {
    const { select } = require(Mod)

    @Component function Counter(start, increment) {
        let count = start
        const epic = function click() {
            count += increment
            select.from(this) `button`.textContent = String(count)
        }

        return <jsx>
            <button use:{epic}>
                ${count}
            </button>
        </jsx>
    }
})


