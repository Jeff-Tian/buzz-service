import logger from '../common/logger'

const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const knex = require('knex')(config)
const _ = require('lodash')
const user = require('../dal/user')
const wechat = require('../common/wechat')
const mail = require('../common/mail')
const msgDal = require('../dal/msg')

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

        ctx.status = 200
        ctx.body = feedback || {}
    } catch (ex) {
        logger.error(ex)
        ctx.throw(500, ex)
    }
}

const getEvaluateStatus = async ctx => {
    const classId = ctx.params.class_id

    try {
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

        let mark = false
        if (arr.length === evaluateList.length) {
            mark = true
        }
        ctx.body = { class_id: classId, feedback: mark }
        ctx.status = 200
    } catch (error) {
        logger.error(error)
    }
}

const sendFeedbackNotification = async (from_user_id, to_user_id, class_id, msg_id) => {
    try {
        const class_topic = _.get(await knex('classes').where({ class_id }), '0.topic')
        const from = await user.get(from_user_id, true)
        const to = await user.get(to_user_id, true)
        if (from && to) {
            if (to.wechat_openid) {
                await wechat.sendFeedbackTpl(from, to, class_id, class_topic, msg_id)
            } else if (to.email) {
                await mail.sendFeedbackMail(from, to, class_id, msg_id)
            }
        }
    } catch (e) {
        logger.error(e)
    }
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
        const msg = await msgDal.upsert({ type: 'class_feedback', class_id: ctx.params.class_id, from_user_id: ctx.params.from_user_id, to_user_id: ctx.params.to_user_id }).catch(e => logger.error('upsert msg error', e))
        await sendFeedbackNotification(ctx.params.from_user_id, ctx.params.to_user_id, ctx.params.class_id, _.get(msg, 'msg_id'))
        ctx.status = 201
        ctx.set('Location', `${ctx.request.URL}/${ctx.params.user_id}/${ctx.params.from_user_id}/evaluate/${ctx.params.to_user_id}`)
        ctx.body = inserted
    } catch (ex) {
        logger.error(ex)
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
    } catch (ex) {
        logger.error(ex)
        ctx.throw(500, ex)
    }
}

// TODO:
const getFeedBacksTo = async ctx => {
    try {
        const classId = ctx.params.class_id
        const feedbacksToUserId = ctx.params.user_id

        ctx.body = []
    } catch (ex) {
        logger.error(ex)
        ctx.throw(500, ex)
    }
}

const getFeedBacksFrom = async ctx => {
    try {
        ctx.body = []
    } catch (ex) {
        logger.error(ex)
        ctx.throw(500, ex)
    }
}

module.exports = {
    getFeedbackList,
    getEvaluateStatus,
    setFeedbackInfo,
    getAdminFeedbackList,
    getFeedBacksTo,
    getFeedBacksFrom,
}
