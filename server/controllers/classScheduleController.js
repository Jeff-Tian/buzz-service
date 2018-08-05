import logger from '../common/logger'
import * as userBll from '../bll/user'
import { NeedChargeThreshold, UserTags } from '../common/constants'
import { getSubscribersByClassIdSubQuery } from '../dal/class-schedules'

const _ = require('lodash')
const bluebird = require('bluebird')
const moment = require('moment-timezone')
const request = require('request-promise-native')
const Scheduling = require('../bll/scheduling')

const promisify = require('../common/promisify')
const wechat = require('../common/wechat')
const mail = require('../common/mail')
const timeHelper = require('../common/time-helper')
const env = process.env.NODE_ENV || 'test'
const knexConfig = require('../../knexfile')[env]
const knex = require('knex')(knexConfig)
const classSchedules = require('../bll/class-schedules')
const { getUsersByClassId, getClassesByUserId } = require('../bll/user')
const { getAllClassHours } = require('../bll/class-hours')
const config = require('../config/index')
const listSuggested = async ctx => {
    try {
        const timeRangeStart = new Date(ctx.query.time_range_start).getTime()

        const res = await knex('student_class_schedule')
            .where('student_class_schedule.start_time', '>=', timeRangeStart)
            .andWhere('student_class_schedule.status', 'booking')

        const suggestions = Scheduling.makeGroups(res)
        logger.info('res = ', res)
        ctx.status = 200
        ctx.body = res
    } catch (error) {
        logger.error(error)
        ctx.throw(500, error)
    }
}

const uniformTime = function (theStartTime, theEndTime) {
    let start_time = theStartTime
    if (start_time) {
        start_time = new Date(start_time)
    } else {
        start_time = undefined
    }

    let end_time = theEndTime
    if (end_time) {
        end_time = new Date(end_time)
    } else {
        end_time = undefined
    }
    return { start_time, end_time }
}

function filterByTime(search, start_time, end_time) {
    if (start_time && end_time) {
        return search
            .where('classes.start_time', '>=', start_time)
            .andWhere('classes.end_time', '<', end_time)
    } else if (start_time) {
        return search
            .where('classes.start_time', '>=', start_time)
    }
    return search
        .where('classes.end_time', '<', end_time)
}

function filterByStatus(search, statuses) {
    if (!(statuses instanceof Array)) {
        statuses = [statuses]
    }
    return search.andWhere('classes.status', 'in', statuses)
}

const getClassById = async function (classId, trx = knex) {
    const studentsSubQuery = trx('student_class_schedule')
        .select(knex.raw('group_concat(user_id) as students')).where('class_id', '=', classId).groupBy('student_class_schedule.class_id')
        .as('students')
    const companionsSubQuery = trx('companion_class_schedule')
        .select(knex.raw('group_concat(user_id) as companions')).where('class_id', '=', classId).groupBy('companion_class_schedule.class_id')
        .as('companions')
    const subscribersSubQuery = getSubscribersByClassIdSubQuery(classId)
    const companionsNamesSubQuery = trx('companion_class_schedule')
        .leftJoin('users', 'companion_class_schedule.user_id', 'users.user_id')
        .select(knex.raw('group_concat(users.name) as companion_name'))
        .where('companion_class_schedule.class_id', '=', classId)
        .groupBy('companion_class_schedule.class_id')
        .as('companion_name')
    const companionsAvatarsSubQuery = trx('companion_class_schedule')
        .leftJoin('user_profiles', 'companion_class_schedule.user_id', 'user_profiles.user_id')
        .select(knex.raw('group_concat(user_profiles.avatar) as companion_avatar'))
        .where('companion_class_schedule.class_id', '=', classId)
        .groupBy('companion_class_schedule.class_id')
        .as('companion_avatar')

    const selecting = trx('classes')
        .where('classes.class_id', classId)
        .select('classes.class_id as class_id', 'classes.adviser_id as adviser_id', 'classes.start_time as start_time', 'classes.end_time as end_time', 'classes.status as status', 'classes.name as name', 'classes.remark as remark', 'classes.topic as topic', 'classes.room_url as room_url', 'classes.exercises as exercises', 'classes.level as level', 'classes.topic_level as topic_level', 'classes.module as module', 'classes.notification_disabled as notification_disabled', 'classes.allow_sign_up as allow_sign_up', 'classes.class_hours as class_hours', 'classes.evaluate_disabled as evaluate_disabled')
        .select(process.env.NODE_ENV !== 'test' ? knex.raw('UTC_TIMESTAMP as "CURRENT_TIMESTAMP"') : knex.fn.now())
        .select(studentsSubQuery)
        .select(companionsSubQuery)
        .select(companionsNamesSubQuery)
        .select(companionsAvatarsSubQuery)
        .select(subscribersSubQuery)

    return (await selecting)[0]
}

const getClassByClassId = async ctx => {
    ctx.status = 200
    ctx.set('Location', `${ctx.request.URL}/${ctx.params.class_id}`)
    const class_id = ctx.params.class_id
    let body
    if (class_id === 'rookie') {
        const user_id = ctx.query.user_id
        const result = user_id ? await getClassesByUserId(user_id) : []
        const status = _.find(result, i => i.status === 'ended') ? 'ended' : 'confirmed'
        const minClass = _.chain(result)
            .minBy('start_time')
            .value()
        const startTime = status === 'confirmed' ? moment().hour(10).minute(0).second(0).millisecond(0).utc().format() : moment(_.get(minClass, 'start_time')).subtract(1, 'd').hour(10).minute(0).second(0).millisecond(0).utc().format()
        const endTime = status === 'confirmed' ? moment().hour(22).minute(0).second(0).millisecond(0).utc().format() : moment(_.get(minClass, 'start_time')).subtract(1, 'd').hour(22).minute(0).second(0).millisecond(0).utc().format()
        body = [{
            CURRENT_TIMESTAMP: moment().utc().format(),
            class_end_time: endTime,
            end_time: endTime,
            start_time: startTime,
            class_start_time: startTime,
            classes_status: status,
            status,
            adviser_id: 0,
            class_id: 'rookie',
            companion_avatar: 'https://buzz-corner.user.resource.buzzbuzzenglish.com/rookie_buzzbuzz.png',
            companion_name: 'BuzzBuzz',
            companions: 'BuzzBuzz',
            topic_level: 'Basic',
            topic: '入门指导课',
            module: 'School',
            name: '入门指导课',
            remark: null,
            students: `rookie_01,rookie_02,${user_id}`,
            room_url: 'https://zoom.us/j/2019579072',
            zc: 0,
            evaluate_disabled: true,
            notification_disabled: true,
        }]
    } else if (class_id === 'observation') {
        const user_id = ctx.query.user_id
        const result = user_id ? await getClassesByUserId(user_id) : []
        const minClass = _.chain(result)
            .minBy('end_time')
            .value()
        const status = moment().isSameOrAfter(moment(_.get(minClass, 'end_time')).add(48, 'h')) ? 'ended' : 'confirmed'
        const startTime = minClass ? moment(_.get(minClass, 'end_time')).add(48, 'h').hour(0).minute(0).second(0).millisecond(0).utc().format() : moment().hour(0).minute(0).second(0).millisecond(0).utc().format()
        const endTime = minClass ? moment(_.get(minClass, 'end_time')).add(48, 'h').utc().format() : moment().hour(23).minute(59).second(0).millisecond(0).utc().format()
        body = [{
            CURRENT_TIMESTAMP: moment().utc().format(),
            class_end_time: endTime,
            end_time: endTime,
            start_time: startTime,
            class_start_time: startTime,
            classes_status: status,
            status,
            adviser_id: 0,
            class_id: 'observation',
            companion_avatar: 'https://buzz-corner.user.resource.buzzbuzzenglish.com/rookie_buzzbuzz.png',
            companion_name: 'BuzzBuzz',
            companions: 'BuzzBuzz',
            topic_level: 'Basic',
            topic: 'Observation',
            module: 'School',
            name: 'Observation',
            remark: null,
            students: `${user_id}`,
            evaluate_disabled: true,
            notification_disabled: true,
        }]
    } else {
        body = [await getClassById(class_id)]
    }
    ctx.body = body
}

const getClassByClassIdv2 = async ctx => {
    ctx.status = 200

    ctx.body = await getClassById(ctx.params.class_id)
}

async function addClassJob(classInfo) {
    if (process.env.NODE_ENV === 'test') {
        return
    }

    try {
        await request({
            uri: `${config.endPoints.bullService}/api/v1/task`,
            method: 'POST',
            body: classInfo,
            json: true,
        })
    } catch (ex) {
        logger.error(ex)
    }
}

function sortSearch(selecting, ctx) {
    const orderby = ctx.query.orderby
    let orderBy = 'diff'
    let direction = 'ASC'

    if (orderby) {
        orderBy = orderby.split(' ')[0]
        direction = orderby.split(' ')[1]
    }
    const search = selecting
        .orderBy(orderBy, direction)
    return search
}

const list = async ctx => {
    try {
        const { start_time, end_time } = uniformTime(ctx.query.start_time, ctx.query.end_time)
        const statuses = ctx.query.statuses
        let { user_ids } = ctx.query
        if (user_ids && !_.isArray(user_ids)) {
            user_ids = [user_ids]
        }

        const studentsSubQuery = knex('student_class_schedule')
            .select(knex.raw('group_concat(user_id) as students'), 'class_id').groupBy('student_class_schedule.class_id')
            .as('students')
        const companionsSubQuery = knex('companion_class_schedule')
            .leftJoin('users', 'companion_class_schedule.user_id', 'users.user_id')
            .leftJoin('user_profiles', 'companion_class_schedule.user_id', 'user_profiles.user_id')
            .select(knex.raw('group_concat(users.user_id) as companions'), knex.raw('group_concat(users.name) as companion_name'), knex.raw('group_concat(user_profiles.avatar) as companion_avatar'), 'class_id').groupBy('companion_class_schedule.class_id')
            .as('companions')

        const selecting =
            knex('classes')
                .select('classes.class_id as class_id', 'classes.adviser_id' +
                    ' as adviser_id', 'classes.start_time as start_time', 'classes.end_time as end_time', 'classes.status as status', 'classes.name as name', 'classes.remark as remark', 'classes.topic as topic', 'classes.room_url as room_url', 'classes.exercises as exercises', 'classes.level as level', 'classes.notification_disabled as notification_disabled', 'classes.allow_sign_up as allow_sign_up', 'classes.class_hours as class_hours', 'classes.evaluate_disabled as evaluate_disabled', 'students.students as students', 'classes.topic_level as topic_level', 'classes.module as module', 'companions.companions as companions', 'companions.companion_name as companion_name', 'companions.companion_avatar as companion_avatar', 'subscribers.subscribers as subscribers')
                .select(process.env.NODE_ENV !== 'test' ? knex.raw('UTC_TIMESTAMP as "CURRENT_TIMESTAMP"') : knex.fn.now())
                .select(process.env.NODE_ENV !== 'test' ? knex.raw('abs(timestampdiff(MICROSECOND, classes.start_time, UTC_TIMESTAMP)) as diff') : knex.raw('abs(julianday("now") - julianday("classes.start_time")) as diff'))
                .leftJoin(studentsSubQuery, 'classes.class_id', 'students.class_id')
                .leftJoin(companionsSubQuery, 'classes.class_id', 'companions.class_id')
                .leftJoin(getSubscribersByClassIdSubQuery(), 'classes.class_id', 'subscribers.class_id')

        let search = sortSearch(selecting, ctx)

        if (start_time || end_time) {
            search = filterByTime(search, start_time, end_time)
        }

        if (statuses) {
            search = filterByStatus(search, statuses)
        }
        if (!_.isEmpty(user_ids)) {
            search.whereIn('classes.class_id', knex.select('class_id').from('student_class_schedule').whereIn('user_id', user_ids).union(function () {
                this.select('class_id').from('companion_class_schedule').whereIn('user_id', user_ids)
            }))
        }

        ctx.body = await search.paginate(ctx.query.per_page, ctx.query.current_page)
    } catch (error) {
        logger.error(error)
        ctx.throw(error)
    }
}
const getByUserId = async ctx => {
    try {
        const user_id = ctx.params.user_id
        ctx.body = await knex('classes').orderBy('classes.start_time', 'DESC')
            .whereIn('class_id', knex.select('class_id').from('student_class_schedule').where({ user_id }).union(function () {
                this.select('class_id').from('companion_class_schedule').where({ user_id })
            }))
            .paginate(ctx.query.per_page, ctx.query.current_page)
    } catch (error) {
        logger.error(error)
        ctx.throw(error)
    }
}

// 新建/更新班级 如果有新人 给新人创建24小时后的任务
const addScheduleJob = async (oldClass, newClass, optional) => {
    if (process.env.NODE_ENV === 'test') {
        return
    }

    try {
        if (_.get(newClass, 'status') !== 'opened') return
        const oldStudents = (_.get(oldClass, 'students') || '').split(',')
        const oldUsers = _.concat([], (_.get(oldClass, 'companions') || '').split(','), oldStudents)
        const newStudents = (_.get(newClass, 'students') || '').split(',')
        const newUsers = _.concat([], (_.get(newClass, 'companions') || '').split(','), newStudents)
        _.remove(_.pullAll(newUsers, oldUsers), i => _.isEmpty(i))
        if (_.isEmpty(newUsers)) return
        const start_time = newClass.start_time
        await request({
            uri: `${config.endPoints.bullService}/api/v1/task/schedule`,
            method: 'POST',
            body: { user_ids: newUsers, start_time },
            json: true,
        })
        if (optional) {
            let subscribers = _.chain(newClass)
                .get('subscribers')
                .split(',')
                .value()
            if (_.isEmpty(subscribers)) return
            subscribers = await knex('users')
                .leftJoin('user_social_accounts', 'users.user_id', 'user_social_accounts.user_id')
                .leftJoin('user_profiles', 'users.user_id', 'user_profiles.user_id')
                .whereIn('users.user_id', subscribers)
                .whereNotNull('user_social_accounts.wechat_openid')
                .whereNot('user_social_accounts.wechat_openid', '')
                .select('user_social_accounts.wechat_openid', 'users.name')
            if (_.isEmpty(subscribers)) return
            const students = await knex('users')
                .leftJoin('user_social_accounts', 'users.user_id', 'user_social_accounts.user_id')
                .leftJoin('user_profiles', 'users.user_id', 'user_profiles.user_id')
                .whereIn('users.user_id', _.difference(newStudents, oldStudents))
                .select('user_social_accounts.wechat_name', 'users.name', 'user_profiles.mobile')
                //
            const names = _.chain(students)
                .map(i => `${i.name} | ${i.wechat_name} | ${i.mobile}`)
                .join('\n')
                .value()
            await bluebird.map(subscribers, async subscriber => {
                await wechat.sendSubTpl(subscriber.wechat_openid, subscriber.name, names, _.get(newClass, 'start_time'), _.get(newClass, 'topic'), _.get(newClass, 'class_id')).catch(e => {
                    logger.error('sendSubTpl', e)
                })
            })
        }
    } catch (e) {
        logger.error(e)
    }
}

// 续费通知
const sendRenewTpl = async classInfo => {
    if (process.env.NODE_ENV === 'test') {
        return
    }

    try {
        if (_.get(classInfo, 'status') !== 'ended') return
        const users = (_.get(classInfo, 'students') || '').split(',')
        if (_.isEmpty(users)) return
        await bluebird.map(users, async user_id => {
            const all_class_hours = await getAllClassHours(user_id)
            if (all_class_hours <= NeedChargeThreshold) {
                await userBll.tryAddTags(user_id, [{
                    name: UserTags.NeedCharge,
                    remark: '计算总课时数时课时不足自动添加此标签',
                }])
                await wechat.sendRenewTpl(user_id, all_class_hours).catch(e => {
                    logger.error('sendRenewTplErr', e)
                })
            }
        })
    } catch (e) {
        logger.error(e)
    }
}

const upsert = async ctx => {
    const trx = ctx.trx || await promisify(knex.transaction)
    const { body } = ctx.request

    let oldClassInfo = {}
    if (body.class_id) {
        oldClassInfo = await getClassById(body.class_id, trx)
    }

    let classIds = [body.class_id]

    const data = {
        adviser_id: body.adviser_id,
        level: body.level,
        start_time: body.start_time,
        end_time: body.end_time,
        status: body.status,
        name: body.name,
        remark: body.remark,
        topic: body.topic,
        room_url: body.room_url,
        exercises: body.exercises,
        topic_level: body.topic_level,
        module: body.module,
        evaluate_disabled: body.evaluate_disabled,
        notification_disabled: body.notification_disabled,
        allow_sign_up: body.allow_sign_up,
        class_hours: body.class_hours,
    }

    try {
        classSchedules.validateClass(data)
    } catch (ex) {
        return ctx.throw(400, ex)
    }

    let studentSchedules = body.students ? body.students.map(studentId => ({
        user_id: studentId,
        class_id: body.class_id,
        start_time: body.start_time,
        end_time: body.end_time,
        status: 'confirmed',
    })) : []

    let companionSchedules = body.companions ? body.companions.map(companionId => ({
        user_id: companionId,
        class_id: body.class_id,
        start_time: body.start_time,
        end_time: body.end_time,
        status: 'confirmed',
    })) : []

    try {
        if (body.class_id) {
            if (JSON.stringify(data) !== '{}') {
                await trx('classes')
                    .update(data)
                    .where({ class_id: body.class_id })

                console.log('updated ', data)
            }

            let originalCompanions = await trx('companion_class_schedule')
                .select('user_id')
                .where({ class_id: body.class_id })

            console.log('original companions = ', originalCompanions)

            originalCompanions = originalCompanions.map(oc => oc.user_id)
            const toBeDeletedCompanionSchedules = originalCompanions.filter(c => companionSchedules.map(cs => cs.user_id).indexOf(c) < 0)
            const tbBeUpdatedCompanionSchedules = originalCompanions.filter(c => companionSchedules.map(cs => cs.user_id).indexOf(c) >= 0)

            if (toBeDeletedCompanionSchedules.length) {
                await trx('companion_class_schedule')
                    .where('user_id', 'in', toBeDeletedCompanionSchedules)
                    .andWhere({ class_id: body.class_id })
                    .del()

                console.log('deleted ', toBeDeletedCompanionSchedules)
            }
            if (tbBeUpdatedCompanionSchedules.length) {
                const updateForCompanions = {
                    start_time: body.start_time,
                    end_time: body.end_time,
                }
                if (JSON.stringify(updateForCompanions) !== '{}') {
                    console.log('updating....')
                    await trx('companion_class_schedule')
                        .where('user_id', 'in', tbBeUpdatedCompanionSchedules)
                        .andWhere('class_id', '=', body.class_id)
                        .update(updateForCompanions)

                    console.log('updated ', updateForCompanions)
                }
            }

            companionSchedules = companionSchedules.filter(s => originalCompanions.indexOf(s.user_id) < 0)
            let originalStudents = await trx('student_class_schedule')
                .select('user_id')
                .where({ class_id: body.class_id })

            console.log('original students = \', ', originalStudents)

            originalStudents = originalStudents.map(os => os.user_id)

            const toBeDeletedStudentSchedules = originalStudents.filter(s => studentSchedules.map(ss => ss.user_id).indexOf(s) < 0)
            const toBeUpdatedStudentSchedules = originalStudents.filter(s => studentSchedules.map(ss => ss.user_id).indexOf(s) >= 0)

            await classSchedules.removeStudents(trx, toBeDeletedStudentSchedules, body.class_id)
            console.log('removed students', toBeDeletedCompanionSchedules)

            if (toBeUpdatedStudentSchedules.length) {
                const updateForStudent = {
                    start_time: body.start_time,
                    end_time: body.end_time,
                }

                if (JSON.stringify(updateForStudent) !== '{}') {
                    await trx('student_class_schedule')
                        .where('user_id', 'in', toBeUpdatedStudentSchedules)
                        .andWhere('class_id', '=', body.class_id)
                        .update(updateForStudent)
                }
            }

            studentSchedules = studentSchedules.filter(s => originalStudents.indexOf(s.user_id) < 0)
        } else {
            classIds = await trx('classes')
                .returning('class_id')
                .insert(data)
        }

        if (studentSchedules.length) {
            await classSchedules.addStudents(trx, studentSchedules, classIds[0])
        }

        if (companionSchedules.length) {
            await trx('companion_class_schedule')
                .returning('start_time')
                .insert(companionSchedules.map(s => {
                    s.class_id = classIds[0]
                    return s
                }))
        }

        await classSchedules.saveSubscribers(trx, body.subscribers || [], classIds[0])
        const classInfo = await getClassById(classIds[0], trx)
        await addClassJob(classInfo)
        await addScheduleJob(oldClassInfo, classInfo, ctx.request.body.optional)
        await trx.commit()
        ctx.status = body.class_id ? 200 : 201
        ctx.set('Location', `${ctx.request.URL}`)
        ctx.body = classInfo

        console.log('classInfo = , ', classInfo, body.class_id)
    } catch (error) {
        logger.error(error)

        await trx.rollback()
        ctx.status = 400
        ctx.body = {
            error: `Save class failed! ${error.message}`,
        }
    }
}

const change = async ctx => {
    const trx = await promisify(knex.transaction)
    let transactionExecuted = false
    try {
        const sql = knex('classes')
            .where('status', 'not in', ['ended', 'cancelled'])
            .andWhereRaw(' end_time <= UTC_TIMESTAMP() ')
            .select('class_id')

        logger.info(`sql = ${JSON.stringify(sql.toSQL())}`)

        const endedClassIds = (await sql).map(c => c.class_id)

        logger.info(`尝试批量结束班级：${endedClassIds.join(', ')}`)

        if (endedClassIds.length) {
            await trx('classes')
                .where('class_id', 'in', endedClassIds)
                .update({
                    status: 'ended',
                })

            await trx('companion_class_schedule')
                .where('class_id', 'in', endedClassIds)
                .andWhere('status', 'in', ['confirmed'])
                .update({
                    status: 'ended',
                })

            await trx('student_class_schedule')
                .where('class_id', 'in', endedClassIds)
                .andWhere('status', 'in', ['confirmed'])
                .update({
                    status: 'ended',
                })

            await trx.commit()

            transactionExecuted = true
        }

        ctx.body = { message: 'done' }
        ctx.status = 200
    } catch (error) {
        logger.error(error)
        if (transactionExecuted) {
            await trx.rollback()
        }

        ctx.status = 400
        ctx.body = { message: 'error', error }
    }
}

const endClass = async ctx => {
    const trx = await promisify(knex.transaction)
    try {
        const classId = ctx.params.class_id
        const { endTime } = ctx.request.body
        logger.info('需要修改班级状态的班级classID：', classId)
        logger.info('设置定时器的时间endTime：', endTime)
        const cronTime = new Date(endTime).getTime()
        logger.info('已经触发的定时器的时间cronTime:', cronTime)

        const classInfo = _.get(await trx('classes')
            .where('class_id', classId), 0)
        if (!classInfo) {
            throw new Error(`class of id ${classId} not found`)
        }
        if (classInfo.status !== 'opened') {
            throw new Error(`can't end ${classInfo.status} class`)
        }
        const sqlTime = new Date(classInfo.end_time).getTime()
        logger.info('数据库中班级的结束时间sqlTime', sqlTime)

        if (sqlTime === cronTime) {
            logger.info('定时器的时间===数据库中班级的结束时间，即将进行修改信息操作')
            await trx('classes')
                .where('class_id', classId)
                .update({
                    status: 'ended',
                })

            await trx('companion_class_schedule')
                .where('class_id', classId)
                .update({
                    status: 'ended',
                })

            await trx('student_class_schedule')
                .where('class_id', classId)
                .update({
                    status: 'ended',
                })
            logger.info('修改成功')
        }

        await trx.commit()

        const listEnd = await knex('classes')
            .select()
            .where('class_id', classId)
        await sendRenewTpl(await getClassById(classId))
        ctx.body = listEnd
        ctx.status = 200
    } catch (error) {
        logger.error(error)

        await trx.rollback()
        ctx.status = 500
        ctx.body = {
            error: 'end class failed!',
        }
    }
}

const sendDayClassBeginMsg = async ctx => {
    try {
        const { class_id } = ctx.request.body
        const { classInfo, students, companions } = await getUsersByClassId({
            class_id,
            class_status: ['opened'],
        })
        // 不发送禁止通知的课的通知
        const classDetail = _.get(await knex('classes').where('class_id', class_id), 0)
        if (_.get(classDetail, 'notification_disabled')) return
        // 不发送过去的通知
        if (moment(classInfo.start_time).isBefore(moment())) return
        await bluebird.map(students, async i => {
            if (!i.wechat_openid) return
            await wechat.sendDayClassBeginTpl(i.wechat_openid, i.name, classInfo.class_id, classInfo.topic, classInfo.start_time, classInfo.end_time).catch(logger.error)
        })
        await bluebird.map(companions, async i => {
            if (i.wechat_openid) {
                await wechat.sendDayClassBeginTpl(i.wechat_openid, i.name, classInfo.class_id, classInfo.topic, classInfo.start_time, classInfo.end_time).catch(logger.error)
            } else if (i.email) {
                await mail.sendDayClassBeginMail(i.email, i.name, classInfo.class_id, classInfo.topic, classInfo.start_time, i.time_zone)
            }
        })
        ctx.status = 200
        ctx.body = { done: true }
    } catch (e) {
        logger.error(e)
        ctx.throw(500, e)
    }
}

const sendMinuteClassBeginMsg = async ctx => {
    try {
        const { class_id } = ctx.request.body
        const { classInfo, students, companions } = await getUsersByClassId({
            class_id,
            class_status: ['opened'],
        })
        // 不发送禁止通知的课的通知
        const classDetail = _.get(await knex('classes').where('class_id', class_id), 0)
        if (_.get(classDetail, 'notification_disabled')) return
        // 不发送过去的通知
        if (moment(classInfo.start_time).isBefore(moment())) return
        await bluebird.map(students, async i => {
            if (!i.wechat_openid) return
            await wechat.sendMinuteClassBeginTpl(i.wechat_openid, i.name, classInfo.class_id, classInfo.topic, classInfo.start_time, classInfo.end_time).catch(logger.error)
        })
        await bluebird.map(companions, async i => {
            if (i.wechat_openid) {
                await wechat.sendMinuteClassBeginTpl(i.wechat_openid, i.name, classInfo.class_id, classInfo.topic, classInfo.start_time, classInfo.end_time).catch(logger.error)
            } else if (i.email) {
                await mail.sendMinuteClassBeginMail(i.email, i.name, classInfo.class_id, classInfo.topic, classInfo.start_time, i.time_zone)
            }
        })
        ctx.status = 200
        ctx.body = { done: true }
    } catch (e) {
        logger.error(e)
        ctx.throw(500, e)
    }
}

const sendNowClassBeginMsg = async ctx => {
    try {
        const { class_id } = ctx.request.body
        const { classInfo, students, companions } = await getUsersByClassId({
            class_id,
            class_status: ['opened'],
        })
        // 不发送禁止通知的课的通知
        const classDetail = _.get(await knex('classes').where('class_id', class_id), 0)
        if (_.get(classDetail, 'notification_disabled')) return
        // 不发送过去的通知
        if (moment(classInfo.start_time).isBefore(moment())) return
        let room_url = classInfo.room_url || ''
        const zoom_number = room_url.split('/')[room_url.split('/').length - 1] || ''
        room_url = `${config.endPoints.buzzCorner}/zoom-join?zoom_number=${zoom_number}&user_name=`
        await bluebird.map(students, async i => {
            if (!i.wechat_openid) return
            await wechat.sendNowClassBeginTpl(i.wechat_openid, i.name, classInfo.class_id, classInfo.topic, classInfo.start_time, classInfo.end_time, room_url + i.name).catch(logger.error)
        })
        await bluebird.map(companions, async i => {
            if (i.wechat_openid) {
                await wechat.sendNowClassBeginTpl(i.wechat_openid, i.name, classInfo.class_id, classInfo.topic, classInfo.start_time, classInfo.end_time, room_url + i.name).catch(logger.error)
            } else if (i.email) {
                await mail.sendNowClassBeginMail(i.email, i.name, classInfo.class_id, classInfo.topic, classInfo.start_time, i.time_zone, room_url + i.name)
            }
        })
        ctx.status = 200
        ctx.body = { done: true }
    } catch (e) {
        logger.error(e)
        ctx.throw(500, e)
    }
}

const sendEvaluationMsg = async ctx => {
    try {
        const { class_id } = ctx.request.body
        // 担心课程状态错误 先不限制取 class_status: ['ended']
        const { classInfo, students, companions } = await getUsersByClassId({ class_id })
        // 不发送禁止通知或禁止评价的课的通知
        const classDetail = _.get(await knex('classes').where('class_id', class_id), 0)
        if (_.get(classDetail, 'notification_disabled') || _.get(classDetail, 'evaluate_disabled')) return
        // 不发送未来的通知
        if (moment(classInfo.end_time).isAfter(moment())) return
        await bluebird.map(students, async i => {
            const companion_id = _.chain(companions)
                .head()
                .get('user_id')
                .value()
            if (!i.wechat_openid || !companion_id) return
            await wechat.sendStudentEvaluationTpl(i.wechat_openid, classInfo.class_id, classInfo.topic, classInfo.end_time, companion_id).catch(logger.error)
        })
        await bluebird.map(companions, async i => {
            if (i.wechat_openid) {
                await wechat.sendCompanionEvaluationTpl(i.wechat_openid, classInfo.class_id, classInfo.topic, classInfo.end_time).catch(logger.error)
            } else if (i.email) {
                await mail.sendCompanionEvaluationMail(i.email, i.name, classInfo.class_id, classInfo.topic)
            }
        })
        ctx.status = 200
        ctx.body = { done: true }
    } catch (e) {
        logger.error(e)
        ctx.throw(500, e)
    }
}
const listByUserId = async ctx => {
    let { start_time, end_time } = timeHelper.uniformTime(ctx.query.start_time, ctx.query.end_time)
    start_time = timeHelper.convertToDBFormat(start_time)
    end_time = timeHelper.convertToDBFormat(end_time)
    let companionSearch = knex('companion_class_schedule')
        .leftJoin('classes', 'companion_class_schedule.class_id', 'classes.class_id')
        .leftJoin('class_subscribers', 'class_subscribers.class_id', 'classes.class_id')
        .leftJoin('user_profiles', 'companion_class_schedule.user_id', 'user_profiles.user_id')
        .leftJoin('users', 'companion_class_schedule.user_id', 'users.user_id')
        .select(
            knex.raw('null as comment'),
            knex.raw('null as from_user_id'),
            knex.raw('null as score'),
            knex.raw('null as title'),
            knex.raw('null as to_user_id'),
            'companion_class_schedule.class_id as class_id',
            'classes.status AS classes_status',
            'classes.end_time AS class_end_time',
            'classes.start_time AS class_start_time',
            'classes.topic AS topic',
            'companion_class_schedule.user_id AS companion_id',
            'companion_class_schedule.status AS status',
            'companion_class_schedule.start_time AS start_time',
            'companion_class_schedule.end_time AS end_time',
            'users.name AS companion_name',
            'user_profiles.avatar AS companion_avatar',
            'companion_class_schedule.user_id AS user_id',
            'companion_class_schedule.batch_id as batch_id',
            'user_profiles.country as companion_country'
        )
    if (process.env.NODE_ENV !== 'test') {
        companionSearch = companionSearch
            .select(knex.raw('UTC_TIMESTAMP as "CURRENT_TIMESTAMP"'))
    } else {
        companionSearch = companionSearch
            .select(knex.fn.now())
    }

    companionSearch = companionSearch
        .whereNotIn('classes.status', ['cancelled'])
        .where(function () {
            this.where('companion_class_schedule.user_id', ctx.params.user_id)
                .orWhereIn('class_subscribers.user_id', ctx.params.user_id)
        })
        .andWhere('companion_class_schedule.start_time', '>=', start_time)
        .andWhere('companion_class_schedule.end_time', '<=', end_time)

    let studentSearch = knex('student_class_schedule')
        .leftJoin('classes', 'student_class_schedule.class_id', 'classes.class_id')
        .leftJoin('class_subscribers', 'class_subscribers.class_id', 'classes.class_id')
        .leftJoin('companion_class_schedule', 'student_class_schedule.class_id', 'companion_class_schedule.class_id')
        .leftJoin('user_profiles', 'companion_class_schedule.user_id', 'user_profiles.user_id')
        .leftJoin('users', 'companion_class_schedule.user_id', 'users.user_id')

        .leftJoin('class_feedback', function () {
            this.on(function () {
                this.on('class_feedback.class_id', 'student_class_schedule.class_id')
                this.andOn('class_feedback.to_user_id', 'user_profiles.user_id')
                this.andOn('class_feedback.from_user_id', 'student_class_schedule.user_id')
            })
        })
        .groupBy('classes.class_id')
        .select(
            'class_feedback.comment as comment',
            'class_feedback.from_user_id as from_user_id',
            'class_feedback.score as score',
            'classes.name as title',
            'class_feedback.to_user_id as to_user_id',
            'student_class_schedule.class_id as class_id',
            'classes.status as classes_status',
            'classes.end_time as class_end_time',
            'classes.start_time as class_start_time',
            'classes.topic as topic',
            knex.raw('group_concat(user_profiles.user_id) as companion_id'),
            'student_class_schedule.status as status',
            'student_class_schedule.start_time as start_time',
            'student_class_schedule.end_time as end_time',
            knex.raw('group_concat(users.name) as companion_name'),
            knex.raw('group_concat(user_profiles.avatar) as companion_avatar'),
            'student_class_schedule.user_id as user_id',
            knex.raw('null as batch_id'),
            knex.raw('group_concat(user_profiles.country) as companion_country'),
        )

    if (process.env.NODE_ENV !== 'test') {
        studentSearch = studentSearch.select(knex.raw('UTC_TIMESTAMP as "CURRENT_TIMESTAMP"'))
    } else {
        studentSearch = studentSearch.select(knex.fn.now())
    }

    studentSearch = studentSearch
        .where(function () {
            this.where('student_class_schedule.user_id', ctx.params.user_id)
                .orWhereIn('class_subscribers.user_id', ctx.params.user_id)
        })
        .andWhere('student_class_schedule.start_time', '>=', timeHelper.convertToDBFormat(start_time))
        .andWhere('student_class_schedule.end_time', '<=', timeHelper.convertToDBFormat(end_time))
        .andWhere('classes.status', 'not in', ['cancelled'])

    let result = await companionSearch.union(studentSearch)
    if (!_.isArray(result)) result = []

    const role = _.get(await knex('users')
        .select('role')
        .where({ user_id: ctx.params.user_id }), '0.role')
    if (role === 's') {
        const status = _.find(result, i => i.status === 'ended') ? 'ended' : 'confirmed'
        const minClass = _.chain(result)
            .minBy('class_start_time')
            .value()
        const CURRENT_TIMESTAMP = moment().utc().format()
        const startTime = status === 'confirmed' ? moment().hour(10).minute(0).second(0).millisecond(0).utc().format() : moment(_.get(minClass, 'class_start_time')).subtract(1, 'd').hour(10).minute(0).second(0).millisecond(0).utc().format()
        const endTime = status === 'confirmed' ? moment().hour(22).minute(0).second(0).millisecond(0).utc().format() : moment(_.get(minClass, 'class_end_time')).subtract(1, 'd').hour(22).minute(0).second(0).millisecond(0).utc().format()
        result.push({
            CURRENT_TIMESTAMP: moment().utc().format(),
            class_end_time: endTime,
            end_time: endTime,
            start_time: startTime,
            class_start_time: startTime,
            classes_status: status,
            status,
            class_id: 'rookie',
            comment: null,
            companion_avatar: 'https://buzz-corner.user.resource.buzzbuzzenglish.com/rookie_buzzbuzz.png',
            companion_country: 'china',
            companion_id: 'BuzzBuzz',
            companion_name: 'BuzzBuzz',
            from_user_id: null,
            score: null,
            title: '入门指导课',
            to_user_id: null,
            topic_level: 'Basic',
            topic: '入门指导课',
            module: 'School',
            user_id: ctx.params.user_id,
            room_url: 'https://zoom.us/j/2019579072',
            zc: 0,
            evaluate_disabled: true,
            notification_disabled: true,
        })
    } else if (role === 'c') {
        const minClass = _.chain(result)
            .minBy('class_end_time')
            .value()
        const status = moment().isSameOrAfter(moment(_.get(minClass, 'class_end_time')).add(48, 'h')) ? 'ended' : 'confirmed'
        const startTime = minClass ? moment(_.get(minClass, 'class_end_time')).add(48, 'h').hour(0).minute(0).second(0).millisecond(0).utc().format() : moment().hour(0).minute(0).second(0).millisecond(0).utc().format()
        const endTime = minClass ? moment(_.get(minClass, 'class_end_time')).add(48, 'h').utc().format() : moment().hour(23).minute(59).second(0).millisecond(0).utc().format()
        const CURRENT_TIMESTAMP = moment().utc().format()
        result.push({
            CURRENT_TIMESTAMP: moment().utc().format(),
            class_end_time: endTime,
            end_time: endTime,
            start_time: startTime,
            class_start_time: startTime,
            classes_status: status,
            status,
            class_id: 'observation',
            comment: null,
            companion_avatar: 'https://buzz-corner.user.resource.buzzbuzzenglish.com/rookie_buzzbuzz.png',
            companion_country: 'china',
            companion_id: 'BuzzBuzz',
            companion_name: 'BuzzBuzz',
            from_user_id: null,
            score: null,
            title: 'Observation',
            to_user_id: null,
            topic_level: 'Basic',
            topic: 'Observation',
            module: 'School',
            user_id: ctx.params.user_id,
            evaluate_disabled: true,
            notification_disabled: true,
        })
    }

    ctx.body = result
}

const getOptionalList = async ({ user_id, date, class_id, check_class_hours, trx = knex }) => {
    if (!user_id) {
        throw new Error('invalid user_id')
    }
    if (!class_id && !date) {
        throw new Error('invalid date')
    }
    const user = _.get(await trx('user_profiles')
        .leftJoin('user_balance', 'user_balance.user_id', 'user_profiles.user_id')
        .select('user_balance.class_hours', 'user_profiles.grade')
        .where('user_profiles.user_id', user_id), 0)
    const user_grade = _.get(user, 'grade')
    const user_class_hours = _.get(user, 'class_hours')
    if (!user_grade) {
        throw new Error('invalid grade')
    }
    const user_classes = await trx('student_class_schedule')
        .leftJoin('classes', 'student_class_schedule.class_id', 'classes.class_id')
        .whereNotIn('classes.status', ['cancelled'])
        .where('student_class_schedule.user_id', user_id)
        .whereIn('student_class_schedule.status', ['confirmed', 'ended'])
        .select(
            process.env.NODE_ENV !== 'test' ? knex.raw('CONCAT_WS(\',\', classes.module, classes.topic, classes.topic_level) AS content_key') : knex.raw('(classes.module || \',\' || classes.topic || \',\' || classes.topic_level) AS content_key'),
            'student_class_schedule.class_id',
            'classes.status',
            'student_class_schedule.start_time',
            'student_class_schedule.end_time'
        ).orderBy('student_class_schedule.status', 'desc')
        .orderBy('student_class_schedule.start_time', 'desc')
    const recommend_class_id = _.chain(user_classes)
        .find(i => i.status === 'ended')
        .get('class_id')
        .value()
    const recommend_companion_id = recommend_class_id && _.get(await trx('companion_class_schedule')
        .where('class_id', recommend_class_id)
        .whereNotNull('user_id')
        .select('user_id'), '0.user_id')
    const user_contents = _.map(user_classes, 'content_key')
    const user_time_query = _.chain(user_classes)
        .map(i => `(student_class_schedule.start_time >= '${i.end_time}' OR student_class_schedule.end_time <= '${i.start_time}')`)
        .join(' AND ')
        .value()
    let query = trx('student_class_schedule')
        .leftJoin('classes', 'student_class_schedule.class_id', 'classes.class_id')
        .leftJoin('companion_class_schedule', 'student_class_schedule.class_id', 'companion_class_schedule.class_id')
        .leftJoin('user_profiles as student_user_profiles', 'student_class_schedule.user_id', 'student_user_profiles.user_id')

        .leftJoin('user_profiles', 'companion_class_schedule.user_id', 'user_profiles.user_id')
        .leftJoin('users', 'companion_class_schedule.user_id', 'users.user_id')
        .leftJoin('class_feedback', function () {
            this.on(function () {
                this.on('class_feedback.class_id', 'student_class_schedule.class_id')
                this.andOn('class_feedback.to_user_id', 'user_profiles.user_id')
                this.andOn('class_feedback.from_user_id', 'student_class_schedule.user_id')
            })
        })
        .groupBy('classes.class_id')
        .whereNotNull('student_class_schedule.class_id')
        .whereNotIn('classes.status', ['cancelled'])
        .whereIn('classes.allow_sign_up', [true, 1, '1'])
        .whereIn('student_class_schedule.status', ['confirmed'])
        .whereNot('student_class_schedule.user_id', user_id)
        .orderBy('student_class_schedule.start_time', 'asc')
        .select(
            'class_feedback.comment as comment',
            'class_feedback.from_user_id as from_user_id',
            'class_feedback.score as score',
            'classes.name as title',
            'class_feedback.to_user_id as to_user_id',
            'student_class_schedule.class_id as class_id',
            'classes.status as classes_status',
            'classes.end_time as class_end_time',
            'classes.start_time as class_start_time',
            'classes.topic as topic',
            knex.raw('group_concat(DISTINCT user_profiles.user_id) as companion_id'),
            'student_class_schedule.status as status',
            'student_class_schedule.start_time as start_time',
            'student_class_schedule.end_time as end_time',
            knex.raw('group_concat(DISTINCT users.name) as companion_name'),
            knex.raw('group_concat(DISTINCT user_profiles.avatar) as companion_avatar'),
            'student_class_schedule.user_id as user_id',
            knex.raw('null as batch_id'),
            knex.raw('group_concat(DISTINCT user_profiles.country) as companion_country'),

            'classes.class_hours as class_hours',
            knex.raw('COUNT(DISTINCT student_class_schedule.user_id) AS student_count'),
            knex.raw('MAX(student_user_profiles.grade) AS max_grade'),
            knex.raw('MIN(student_user_profiles.grade) AS min_grade'),
            process.env.NODE_ENV !== 'test' ? knex.raw('CONCAT_WS(\',\', classes.module, classes.topic, classes.topic_level) AS content_key') : knex.raw('(classes.module || \',\' || classes.topic || \',\' || classes.topic_level) AS content_key'),
            knex.raw('group_concat(DISTINCT student_user_profiles.grade) as grades'),
            // process.env.NODE_ENV !== 'test' ? knex.raw(`(CASE WHEN (FIND_IN_SET(${user_grade}, grades) > 0 OR FIND_IN_SET(${recommend_companion_id}, companion_id) > 0) THEN 1 ELSE NULL END) as recommend`) : knex.raw('NULL AS recommend'),
        )
        .having('student_count', '<', 3)
        .havingRaw(`ABS(max_grade - ${user_grade}) <= 2 AND ABS(${user_grade} - min_grade) <= 2`)
        .havingNotIn('content_key', user_contents)
    if (_.size(user_time_query) > 0) {
        query = query.whereRaw(user_time_query)
    }
    if (process.env.NODE_ENV !== 'test') {
        query = query.select(knex.raw('UTC_TIMESTAMP as "CURRENT_TIMESTAMP"'))
    } else {
        query = query.select(knex.fn.now())
    }
    if (date) {
        query = query.where('student_class_schedule.start_time', '>', timeHelper.convertToDBFormat(moment(date).add(1, 'h').toISOString()))
            .where('student_class_schedule.start_time', '<', timeHelper.convertToDBFormat(moment(date).add(1, 'd').hour(0).minute(0).second(0).millisecond(0).toISOString()))
    }
    if (class_id) {
        query = query.where('classes.class_id', class_id)
    }
    let result = _.map(await query, i => ({
        ...i,
        recommend: _.chain(i)
            .get('grades')
            .split(',')
            .map(_.toNumber)
            .includes(_.toNumber(user_grade))
            .value() || _.chain(i)
            .get('companion_id')
            .split(',')
            .map(_.toNumber)
            .includes(_.toNumber(recommend_companion_id))
            .value(),
    }))
    if (class_id) {
        if (_.isEmpty(result)) {
            const e = new Error('invalid class')
            e.status = 400
            throw e
        }
        result = [await getClassById(_.get(result, '0.class_id'), trx)]
        if (check_class_hours && _.get(result, '0.class_hours') > user_class_hours) {
            const e = new Error('invalid class hours')
            e.status = 400
            throw e
        }
    }
    return result
}

const getOptionalListCtrl = async ctx => {
    ctx.body = await getOptionalList(ctx.query)
}
const getOptionalByClassId = async ctx => {
    ctx.body = await getOptionalList({ ...ctx.query, ...ctx.params })
}
const joinOptionalByClassId = async ctx => {
    const class_id = ctx.params.class_id
    const { user_id } = ctx.query
    const trx = await promisify(knex.transaction)

    try {
        await getOptionalList({ user_id, class_id, check_class_hours: true, trx })
        const class_info = await getClassById(class_id, trx)
        class_info.students = _.chain(class_info.students)
            .split(',')
            .concat(user_id)
            .map(_.toNumber)
            .value()
        class_info.companions = _.chain(class_info.companions)
            .split(',')
            .map(_.toNumber)
            .value()
        ctx.trx = trx
        ctx.request.body = { ...class_info, optional: true }
        await upsert(ctx)
    } catch (err) {
        logger.error(err)
        await trx.rollback()
        const e = new Error(err)
        e.status = 400
        throw e
    }
}

module.exports = {
    listSuggested,
    list,
    getByUserId,
    listByUserId,
    upsert,
    change,
    getClassByClassId,
    getClassByClassIdv2,
    endClass,
    sendDayClassBeginMsg,
    sendMinuteClassBeginMsg,
    sendNowClassBeginMsg,
    sendEvaluationMsg,
    getOptionalList: getOptionalListCtrl,
    getOptionalByClassId,
    joinOptionalByClassId,
}
