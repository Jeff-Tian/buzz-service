const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)

const selectFeedback = function () {
    return knex('class_feedback')
        .leftJoin('classes', 'class_feedback.class_id', 'classes.class_id')
        .leftJoin('users as users_from', 'class_feedback.from_user_id', 'users_from.user_id')
        .leftJoin('users as users_to', 'class_feedback.to_user_id', 'users_to.user_id')
        .leftJoin('user_profiles as user_profiles_from', 'class_feedback.from_user_id', 'user_profiles_from.user_id')
        .leftJoin('user_profiles as user_profiles_to', 'class_feedback.to_user_id', 'user_profiles_to.user_id')
        .select('classes.class_id as class_id', 'class_feedback.from_user_id as from_user_id', 'class_feedback.to_user_id as to_user_id', 'class_feedback.score as score', 'class_feedback.comment as comment', 'class_feedback.feedback_time as feedback_time', 'users_from.name as from_name', 'users_to.name as to_name', 'user_profiles_from.avatar as from_avatar', 'user_profiles_to.avatar as to_avatar')
}

const selectFeedbackList = function () {
    return knex('classes')
        .innerJoin('class_feedback', 'classes.class_id', 'class_feedback.class_id')
        .select('class_feedback.class_id as class_id', 'class_feedback.from_user_id as from_user_id', 'class_feedback.to_user_id as to_user_id', 'class_feedback.score as score', 'class_feedback.comment as comment', 'classes.topic as topic', 'classes.start_time as start_time', 'classes.end_time as end_time', 'class_feedback.feedback_time as feedback_time')
}

const getFeedbackList = async ctx => {
    try {
        const feedback = await selectFeedback()
            .where('class_feedback.class_id', ctx.params.class_id)
            .andWhere('class_feedback.from_user_id', ctx.params.from_user_id)
            .andWhere('class_feedback.to_user_id', ctx.params.to_user_id)

        ctx.status = 201
        ctx.set('Location', `${ctx.request.URL}/${ctx.params.class_id}/${ctx.params.from_user_id}/evaluate/${ctx.params.to_user_id}`)
        ctx.body = feedback || {}
        console.log(ctx.body)
    } catch (ex) {
        console.error(ex)
        ctx.throw(409, ex)
    }
}

const getEvaluateStatus = async ctx => {
    const classId = ctx.params.class_id

    const companionUserId = await knex('companion_class_schedule')
        .where('class_id', classId)
        .select('user_id')

    const studentUserIdList = await knex('student_class_schedule')
        .where('class_id', classId)
        .select('user_id')

    const arr = []
    for (let i = 0; i < studentUserIdList.length; i++) {
        arr.push(studentUserIdList[i].user_id)
    }

    const evaluateList = await knex('class_feedback')
        .select('score', 'comment')
        .where({
            class_id: classId,
            from_user_id: companionUserId[0].user_id,
        })
        .andWhere('to_user_id', 'in', arr)

    let mark = true
    for (let i = 0; i < evaluateList.length; i++) {
        if (!evaluateList[i].score || !evaluateList[i].comment) {
            mark = false
            break
        }
    }
    ctx.body = { class_id: classId, feedback: mark }
}

const setFeedbackInfo = async ctx => {
    const { body } = ctx.request
    const data = body.map(b => Object.assign({
        class_id: ctx.params.class_id,
        from_user_id: ctx.params.from_user_id,
        to_user_id: ctx.params.to_user_id,
    }, b))

    try {
        const inserted = await knex('class_feedback')
            .returning('class_id')
            .insert(data)

        ctx.status = 201
        ctx.set('Location', `${ctx.request.URL}/${ctx.params.user_id}/${ctx.params.from_user_id}/evaluate/${ctx.params.to_user_id}`)
        ctx.body = inserted
    } catch (ex) {
        console.error(ex)
        ctx.throw(409, ex)
    }
}

const getAdminFeedbackList = async ctx => {
    try {
        const feedback = await selectFeedbackList()
            .where('classes.class_id', ctx.params.class_id)

        ctx.status = 201
        ctx.set('Location', `${ctx.request.URL}/admin-list`)
        ctx.body = feedback
        console.log(ctx.body)
    } catch (ex) {
        console.error(ex)
        ctx.throw(409, ex)
    }
}

module.exports = { getFeedbackList, getEvaluateStatus, setFeedbackInfo, getAdminFeedbackList }
