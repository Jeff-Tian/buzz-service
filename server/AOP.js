export default class AOP {
    static before() {
        /* eslint-disable */
        Function.prototype.before = function (func) {
            const self = this
            return function () {
                if (func.apply(this, arguments) === false) {
                    return false;
                }

                return self.apply(this, arguments)
            }
        }
        /* eslint-enable */
    }
}
