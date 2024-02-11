@module const Main = () => {
    @import(Vif) let
        query,
        pipe

    const entry = <>
        <h1>
            CG3
        </h1>
        <br />
        <h3>
            Code:
        </h3>
        <numeric-input a></numeric-input>
        <numeric-input b></numeric-input>
        <numeric-input c></numeric-input>
        <numeric-input d></numeric-input>
        <br />

        <button enter> enter </button>
    </>

    @export function main() {
        document.body.append(entry)

        query('[enter]').onclick = function() {
            const a = pipe (
                query('[a]').value,
                parseInt
            )

            console.log(a)
        }
    }
}
