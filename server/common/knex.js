const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)

const KnexQueryBuilder = require('knex/lib/query/builder')

KnexQueryBuilder.prototype.paginate = function (pageSize, currentPage) {
    if (!pageSize && !currentPage) {
        return this
    }

    const pagination = {}
    pageSize = pageSize || 10
    let page = currentPage || 1
    if (page < 1) page = 1
    const offset = (page - 1) * pageSize

    return Promise.all([
        // this.clone().count('* as total'),
        knex.count('* as total').from(this.clone().as('inner')),
        this.offset(offset).limit(pageSize),
    ])
        .then(([total, rows]) => {
            const count = total[0].total
            pagination.total = count
            pagination.per_page = pageSize
            pagination.offset = offset
            pagination.to = offset + rows.length
            pagination.last_page = Math.ceil(count / pageSize)
            pagination.current_page = page
            pagination.from = offset
            pagination.data = rows
            return pagination
        })
}

knex.queryBuilder = function () {
    return new KnexQueryBuilder(knex.client)
}
