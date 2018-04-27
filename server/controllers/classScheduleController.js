const _ = require('lodash')
const request = require('request-promise-native')
const Scheduling = require('../bll/scheduling')

const promisify = require('../common/promisify')
const timeHelper = require('../common/time-helper')
const env = process.env.NODE_ENV || 'test'
const knexConfig = require('../../knexfile')[env]
const knex = require('knex')(knexConfig)
const classSchedules = require('../bll/class-schedules')
const config = require('../config/index')
const listSuggested = async ctx => {
    try {
        const timeRangeStart = new Date(ctx.query.time_range_start).getTime()

        const res = await knex('student_class_schedule')
            .where('student_class_schedule.start_time', '>=', timeRangeStart)
            .andWhere('student_class_schedule.status', 'booking')

        const suggestions = Scheduling.makeGroups(res)
        console.log('res = ', res)
        ctx.status = 200
        ctx.body = res
    } catch (error) {
        console.error(error)
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
    return search
        .where('classes.start_time', '>=', start_time)
        .andWhere('classes.end_time', '<=', end_time)
}

function selectClasses() {
    return knex('classes')
        .leftJoin('companion_class_schedule', 'classes.class_id', 'companion_class_schedule.class_id')
        .leftJoin('student_class_schedule', 'classes.class_id', 'student_class_schedule.class_id')
        .groupByRaw('classes.class_id')
        .select('classes.class_id as class_id', 'classes.adviser_id as adviser_id', 'classes.start_time as start_time', 'classes.end_time as end_time', 'classes.status as status', 'classes.name as name', 'classes.remark as remark', 'classes.topic as topic', 'classes.room_url as room_url', 'classes.exercises as exercises', 'classes.level as level', knex.raw('group_concat(companion_class_schedule.user_id) as companions'), knex.raw('group_concat(student_class_schedule.user_id) as students'))
}

function searchClasses(search) {
    return search
        .select(
            'classes.class_id as class_id', 'classes.adviser_id as adviser_id', 'classes.start_time as start_time',
            'classes.end_time as end_time', 'classes.status as status', 'classes.name as name', 'classes.remark as remark',
            'classes.topic as topic', 'classes.room_url as room_url', 'classes.exercises as exercises', 'classes.level as level',
            knex.raw('group_concat(companion_class_schedule.user_id) as companions'),
            knex.raw('group_concat(student_class_schedule.user_id) as students')
        )
}

const getClassById = async function (classId) {
    const studentsSubQuery = knex('student_class_schedule')
        .select(knex.raw('group_concat(user_id) as students')).where('class_id', '=', classId).groupBy('student_class_schedule.class_id')
        .as('students')
    const companionsSubQuery = knex('companion_class_schedule')
        .select(knex.raw('group_concat(user_id) as companions')).where('class_id', '=', classId).groupBy('companion_class_schedule.class_id')
        .as('companions')
    const companionsNamesSubQuery = knex('companion_class_schedule')
        .leftJoin('users', 'companion_class_schedule.user_id', 'users.user_id')
        .select(knex.raw('group_concat(users.name) as companion_name'))
        .where('companion_class_schedule.class_id', '=', classId)
        .groupBy('companion_class_schedule.class_id')
        .as('companion_name')
    const companionsAvatarsSubQuery = knex('companion_class_schedule')
        .leftJoin('user_profiles', 'companion_class_schedule.user_id', 'user_profiles.user_id')
        .select(knex.raw('group_concat(user_profiles.avatar) as companion_avatar'))
        .where('companion_class_schedule.class_id', '=', classId)
        .groupBy('companion_class_schedule.class_id')
        .as('companion_avatar')

    const selecting =
        knex('classes')
            .select('classes.class_id as class_id', 'classes.adviser_id as adviser_id', 'classes.start_time as start_time', 'classes.end_time as end_time', 'classes.status as status', 'classes.name as name', 'classes.remark as remark', 'classes.topic as topic', 'classes.room_url as room_url', 'classes.exercises as exercises', 'classes.level as level')
            .select(process.env.NODE_ENV !== 'test' ? knex.raw('UTC_TIMESTAMP as "CURRENT_TIMESTAMP"') : knex.fn.now())
            .select(studentsSubQuery)
            .select(companionsSubQuery)
            .select(companionsNamesSubQuery)
            .select(companionsAvatarsSubQuery)
            .where('class_id', '=', classId)

    return (await selecting.where('classes.class_id', classId))[0] || {}
}
const getClassByClassId = async ctx => {
    ctx.status = 200
    ctx.set('Location', `${ctx.request.URL}/${ctx.params.class_id}`)

    ctx.body = [await getClassById(ctx.params.class_id)]
}

async function addClassJob(classInfo) {
    try {
        await request({
            uri: `${config.endPoints.bullService}/api/v1/task`,
            method: 'POST',
            body: classInfo,
            json: true,
        })
    } catch (ex) {
        console.error(ex)
    }
}

const list = async ctx => {
    try {
        const { start_time, end_time } = uniformTime(ctx.query.start_time, ctx.query.end_time)

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
                .select('classes.class_id as class_id', 'classes.adviser_id as adviser_id', 'classes.start_time as start_time', 'classes.end_time as end_time', 'classes.status as status', 'classes.name as name', 'classes.remark as remark', 'classes.topic as topic', 'classes.room_url as room_url', 'classes.exercises as exercises', 'classes.level as level', 'students.students as students', 'companions.companions as companions', 'companions.companion_name as companion_name', 'companions.companion_avatar as companion_avatar')
                .select(process.env.NODE_ENV !== 'test' ? knex.raw('UTC_TIMESTAMP as "CURRENT_TIMESTAMP"') : knex.fn.now())
                .leftJoin(studentsSubQuery, 'classes.class_id', 'students.class_id')
                .leftJoin(companionsSubQuery, 'classes.class_id', 'companions.class_id')

        let search = selecting
            .orderBy('classes.start_time', 'DESC')

        if (start_time || end_time) {
            search = filterByTime(search, start_time, end_time)
        }

        ctx.body = await search
    } catch (error) {
        console.error(error)
        ctx.throw(error)
    }
}

const upsert = async ctx => {
    const { body } = ctx.request

    const trx = await promisify(knex.transaction)

    try {
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

        if (body.class_id) {
            if (JSON.stringify(data) !== '{}') {
                await trx('classes')
                    .returning('class_id')
                    .update(data)
                    .where({ class_id: body.class_id })
            }

            let originalCompanions = await trx('companion_class_schedule')
                .select('user_id')
                .where({ class_id: body.class_id })

            originalCompanions = originalCompanions.map(oc => oc.user_id)
            console.log('original companions = ', originalCompanions)

            const toBeDeletedCompanionSchedules = originalCompanions.filter(c => companionSchedules.map(cs => cs.user_id).indexOf(c) < 0)
            const tbBeUpdatedCompanionSchedules = originalCompanions.filter(c => companionSchedules.map(cs => cs.user_id).indexOf(c) >= 0)

            if (toBeDeletedCompanionSchedules.length) {
                await trx('companion_class_schedule')
                    .where('user_id', 'in', toBeDeletedCompanionSchedules)
                    .andWhere({ class_id: body.class_id })
                    .del()
            }
            if (tbBeUpdatedCompanionSchedules.length) {
                const updateForCompanions = {
                    start_time: body.start_time,
                    end_time: body.end_time,
                }
                if (JSON.stringify(updateForCompanions) !== '{}') {
                    await trx('companion_class_schedule')
                        .where('user_id', 'in', tbBeUpdatedCompanionSchedules)
                        .update(updateForCompanions)
                }
            }

            companionSchedules = companionSchedules.filter(s => originalCompanions.indexOf(s.user_id) < 0)
            console.log('companionSchedules=', companionSchedules)
            let originalStudents = await trx('student_class_schedule')
                .select('user_id')
                .where({ class_id: body.class_id })

            originalStudents = originalStudents.map(os => os.user_id)
            console.log('original students = ', originalStudents)

            const toBeDeletedStudentSchedules = originalStudents.filter(s => studentSchedules.map(ss => ss.user_id).indexOf(s) < 0)
            console.log('toBeDeleted = ', toBeDeletedStudentSchedules)
            const toBeUpdatedStudentSchedules = originalStudents.filter(s => studentSchedules.map(ss => ss.user_id).indexOf(s) >= 0)
            console.log('tobeUpdated = ', toBeUpdatedStudentSchedules)

            await classSchedules.removeStudents(trx, toBeDeletedStudentSchedules, body.class_id)

            if (toBeUpdatedStudentSchedules.length) {
                const updateForStudent = {
                    start_time: body.start_time,
                    end_time: body.end_time,
                }

                if (JSON.stringify(updateForStudent) !== '{}') {
                    await trx('student_class_schedule')
                        .where('user_id', 'in', toBeUpdatedStudentSchedules)
                        .update(updateForStudent)
                }
            }

            studentSchedules = studentSchedules.filter(s => originalStudents.indexOf(s.user_id) < 0)
            console.log('students after filter = ', studentSchedules)
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

        await trx.commit()

        ctx.status = body.class_id ? 200 : 201
        ctx.set('Location', `${ctx.request.URL}`)
        const classInfo = await getClassById(classIds[0])
        await addClassJob(classInfo)
        ctx.body = classInfo
    } catch (error) {
        console.error(error)

        await trx.rollback()
        ctx.status = 500
        ctx.body = {
            error: 'Save class failed!',
        }
    }
}

const change = async ctx => {
    const trx = await promisify(knex.transaction)
    try {
        const listAll = await trx('classes')
            .where('status', 'not in', ['ended', 'cancelled'])
            .select()
        const currentTime = new Date().getTime()
        /* let filtrateList = new Set() */
        const arr = []

        for (let c = 0; c < listAll.length; c++) {
            const searchTime = new Date(listAll[c].end_time).getTime()
            if (searchTime < currentTime) {
                /* filtrateList = filtrateList.add(listAll[c]) */
                arr.push(listAll[c].class_id)
            }
        }
        if (arr.length) {
            await trx('classes')
                .where('class_id', 'in', arr)
                .update({
                    status: 'ended',
                })

            await trx('companion_class_schedule')
                .where('class_id', 'in', arr)
                .update({
                    status: 'ended',
                })

            await trx('student_class_schedule')
                .where('class_id', 'in', arr)
                .update({
                    status: 'ended',
                })
        }

        await trx.commit()

        const listEnd = await knex('classes')
            .select()

        ctx.body = listEnd
        ctx.status = 200
    } catch (error) {
        console.log(error)
        await trx.rollback()
    }
}

const endClass = async ctx => {
    const trx = await promisify(knex.transaction)
    try {
        const classId = ctx.params.class_id
        const { endTime } = ctx.request.body
        console.log('需要修改班级状态的班级classID：', classId)
        console.log('设置定时器的时间endTime：', endTime)
        const cronTime = new Date(endTime).getTime()
        console.log('已经触发的定时器的时间cronTime:', cronTime)

        const classInfo = _.get(await trx('classes')
            .where('class_id', classId), 0)
        if (!classInfo) {
            throw new Error('class not found')
        }
        if (classInfo.status !== 'opened') {
            throw new Error(`can't end ${classInfo.status} class`)
        }
        const sqlTime = new Date(classInfo.end_time).getTime()
        console.log('数据库中班级的结束时间sqlTime', sqlTime)

        if (sqlTime === cronTime) {
            console.log('定时器的时间===数据库中班级的结束时间，即将进行修改信息操作')
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
            console.log('修改成功')
        }

        await trx.commit()

        const listEnd = await knex('classes')
            .select()
            .where('class_id', classId)

        ctx.body = listEnd
        ctx.status = 200
        console.log('返回的被修改班级的信息', ctx.body)
    } catch (error) {
        console.error(error)

        await trx.rollback()
        ctx.status = 500
        ctx.body = {
            error: 'end class failed!',
        }
    }
}

const countBookedClasses = async user_id => {
    const result = await knex('classes')
        .leftJoin('student_class_schedule', 'classes.class_id', 'student_class_schedule.class_id')
        .select('classes.status as class_status', 'classes.class_id as class_id', 'student_class_schedule.status as schedule_status')
        .countDistinct('classes.class_id as count')
        .where({ user_id, 'student_class_schedule.status': 'confirmed' })
        .whereIn('classes.status', ['opened'])
    return _.get(result, '0.count')
}

const getUsersByClassId = async ({ class_id, class_status = ['opened', 'ended'], role = ['student', 'companion'] }) => {
    const classInfo = _.get(await knex('classes').where({ class_id }).whereIn('classes.status', class_status).select('class_id', 'topic', 'status', 'start_time', 'end_time'), 0)
    if (!classInfo) return
    let students = []
    if (_.includes(role, 'student')) {
        const studentQuery = knex('student_class_schedule')
            .leftJoin('user_profiles', 'student_class_schedule.user_id', 'user_profiles.user_id')
            .leftJoin('user_social_accounts', 'student_class_schedule.user_id', 'user_social_accounts.user_id')
            .leftJoin('users', 'student_class_schedule.user_id', 'users.user_id')
            .where({
                'student_class_schedule.class_id': class_id,
                'student_class_schedule.status': 'confirmed',
            })
            .select(
                'user_social_accounts.wechat_openid as wechat_openid',
                'user_social_accounts.wechat_name as wechat_name',
                'student_class_schedule.user_id as user_id',
                'user_profiles.email as email',
                'user_profiles.time_zone as time_zone',
                'users.name as name',
            )
        students = await studentQuery
    }
    let companions = []
    if (_.includes(role, 'companion')) {
        const companionQuery = knex('companion_class_schedule')
            .leftJoin('user_social_accounts', 'companion_class_schedule.user_id', 'user_social_accounts.user_id')
            .leftJoin('user_profiles', 'companion_class_schedule.user_id', 'user_profiles.user_id')
            .leftJoin('users', 'companion_class_schedule.user_id', 'users.user_id')
            .select(
                'user_social_accounts.wechat_openid as wechat_openid',
                'user_social_accounts.wechat_name as wechat_name',
                'companion_class_schedule.user_id as user_id',
                'user_profiles.email as email',
                'user_profiles.time_zone as time_zone',
                'users.name as name',
            )
            .where({
                'companion_class_schedule.class_id': class_id,
                'companion_class_schedule.status': 'confirmed',
            })
        companions = await companionQuery
    }
    return { class: classInfo, students, companions }
}

module.exports = {
    listSuggested,
    list,
    upsert,
    change,
    getClassByClassId,
    endClass,
    countBookedClasses,
    getUsersByClassId,
}
