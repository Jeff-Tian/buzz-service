const bcrypt = require('bcryptjs')

export default class Password {
    static encrypt(password) {
        const salt = bcrypt.genSaltSync(10)
        return bcrypt.hashSync(password, salt)
    }

    static compare(passwordProvided, passwordInDb) {
        return bcrypt.compareSync(passwordProvided, passwordInDb)
    }
}
