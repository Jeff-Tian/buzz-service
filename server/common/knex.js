const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)

const KnexQueryBuilder = require('knex/lib/query/builder')

KnexQueryBuilder.prototype.paginate = function (per_page, current_page) {
    if (!per_page && !current_page) {
        return this
    }
    const pagination = {}
    per_page = per_page || 10
    let page = current_page || 1
    if (page < 1) page = 1
    const offset = (page - 1) * per_page
    return Promise.all([
        // this.clone().count('* as total'),
        knex.count('* as total').from(this.clone().as('inner')),
        this.offset(offset).limit(per_page),
    ])
        .then(([total, rows]) => {
            const count = total[0].total
            pagination.total = count
            pagination.per_page = per_page
            pagination.offset = offset
            pagination.to = offset + rows.length
            pagination.last_page = Math.ceil(count / per_page)
            pagination.current_page = page
            pagination.from = offset
            pagination.data = rows
            return pagination
        })
}

knex.queryBuilder = function () {
    return new KnexQueryBuilder(knex.client)
}
