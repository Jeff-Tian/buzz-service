exports.up = function (knex, Promise) {
    return knex.schema.createTable('faq', table => {
        table.bigIncrements('faq_id')
        table.string('type') // null, 中方首页 student_index, 外籍首页 companion_index
        table.string('title') // 标题
        table.string('sub_title') // 副标题
        table.text('content') // html 内容
        table.boolean('show_related').defaultTo(true) // 是否展示相关内容
        table.string('related_title') // 相关内容的标题
        table.text('related_ids') // 相关内容的ids, 获取详情时, 字段 related_faqs 为标题/副标题/faq_id的数组
        table.boolean('public').defaultTo(true) // 是否发布
    })
}

exports.down = function (knex, Promise) {
    return knex.schema.dropTable('faq')
}
