@module const Components = () => {
    @import(Vif) let query

    @component class NumericInput {
        @auto constructor();

        @$ count = 0

        @watch(this.count) update() {
            this.setAttribute('count', this.count)
            query(this.shadow, '[view]').textContent = this.count
        }

        @handle init() {
            this.shadow.append(<>
                <span view>0</span>
                <button up>^</button>
                <button down>v</button>
            </>)

            query(this.shadow, '[up]').onclick = () => {
                if (this.count < 9) {
                    this.count++
                }
            }

            query(this.shadow, '[down]').onclick = () => {
                if (this.count > 0) {
                    this.count--
                }
            }
        }
    }
}
