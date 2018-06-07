import logger from '../common/logger'
import Password from '../security/password'
import { UserTags } from '../common/constants'
/* eslint-disable no-template-curly-in-string */
const _ = require('lodash')
const moment = require('moment-timezone')
const promisify = require('../common/promisify')
const env = process.env.NODE_ENV || 'test'
const config = require('../../knexfile')[env]
const buzzConfig = require('../config')
const knex = require('knex')(config)

const wechat = require('../common/wechat')
const qiniu = require('../common/qiniu')
const mail = require('../common/mail')
const timeHelper = require('../common/time-helper')
const { countBookedClasses } = require('../bll/class-hours')
const { getUsersByWeekly } = require('../bll/user')
const userBll = require('../bll/user')
const userDal = require('../dal/user')
const basicAuth = require('../security/basic-auth')

function selectUsers(isContextSecure) {
    return userDal.selectFields(userDal.joinTables(), isContextSecure)
}

function filterByTime(search, start_time = new Date(1900, 1, 1), end_time = new Date(2100, 1, 1)) {
    return search
        .andWhereRaw('users.user_id in (select distinct user_id from student_class_schedule where student_class_schedule.start_time >= ? and student_class_schedule.end_time < ? union all select distinct user_id from companion_class_schedule where companion_class_schedule.start_time >= ? and companion_class_schedule.end_time < ?)', [start_time, end_time, start_time, end_time])
}

const search = async ctx => {
    try {
        const filters = {}
        const role = ctx.query.role

        if (ctx.query.tags) {
            filters.tags = ctx.query.tags instanceof Array ? ctx.query.tags : [ctx.query.tags]
        }

        let search = userDal.joinTables(filters)
            .orderBy('users.created_at', 'desc')
        if (role) {
            filters['users.role'] = role
            const wsr = ctx.query.weekly_schedule_requirements
            if (wsr) {
                search = search.whereIn('users.user_id', await getUsersByWeekly(wsr, role))
            }
        }

        if (Object.keys(filters).length) {
            search = search.where(filters)
        }

        if (ctx.query.mobile) {
            search = search.andWhere('user_profiles.mobile', 'like', `%${ctx.query.mobile}%`)
        }

        if (ctx.query.email) {
            search = search.andWhere('user_profiles.email', 'like', `%${ctx.query.email}%`)
        }

        if (ctx.query.wechat_name) {
            search = search.andWhere('user_social_accounts.wechat_name', 'like', `%${ctx.query.wechat_name}%`)
        }

        if (ctx.query.display_name) {
            // search = search.andWhereRaw('(user_profiles.display_name like ? or users.name like ?)', [`%${ctx.query.display_name}%`, `%${ctx.query.display_name}%`])
            search = search.andWhere('user_profiles.display_name', 'like', `%${ctx.query.display_name}%`)
        }

        if (ctx.query.start_time || ctx.query.end_time) {
            search = filterByTime(search, ctx.query.start_time, ctx.query.end_time)
        }

        ctx.body = await userDal.selectFields(search, basicAuth.validate(ctx)).paginate(ctx.query.per_page, ctx.query.current_page)
    } catch (error) {
        logger.error(error)

        ctx.status = 500
        ctx.body = { error: error.message }
    }
}
const show = async ctx => {
    try {
        const { user_id } = ctx.params
        const users = await selectUsers(basicAuth.validate(ctx))
            .where({ 'users.user_id': user_id })

        if (!users.length) {
            throw new Error('The requested user does not exists')
        }

        ctx.body = {
            ...users[0],
            booked_class_hours: await countBookedClasses(user_id),
        }
    } catch (error) {
        logger.error(error)

        ctx.status = 404
        ctx.body = {
            error: error.message,
        }
    }
}

const getUserInfoByClassId = async ctx => {
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

    const userList = await knex('users')
        .leftJoin('user_profiles', 'users.user_id', 'user_profiles.user_id')
        .leftJoin('class_feedback', function () {
            this.on('class_feedback.to_user_id', '=', 'users.user_id').onIn('class_id', `${classId}`).onIn('from_user_id', `${companionUserId[0].user_id}`)
        })
        .select('users.user_id as userId', 'users.name as userName', 'user_profiles.avatar as avatar', 'class_feedback.score as score')
        .where('users.user_id', 'in', arr)

    ctx.body = { class_id: classId, userInfo: userList } || []
}

const getByFacebookId = async ctx => {
    try {
        const { facebook_id } = ctx.params
        const users = await selectUsers()
            .where({ 'user_social_accounts.facebook_id': facebook_id })

        if (!users.length) {
            throw new Error('The requested user does not exists')
        }

        ctx.body = users[0]
    } catch (ex) {
        logger.error(ex)

        ctx.status = 404
        ctx.body = {
            error: ex.message,
        }
    }
}

const getByWechat = async ctx => {
    try {
        const { openid, unionid } = ctx.query
        if (!openid && !unionid) {
            throw new Error('Please specifiy a openid or unionid')
        }

        const filter = {}
        if (openid) {
            filter['user_social_accounts.wechat_openid'] = openid
        }
        if (unionid) {
            filter['user_social_accounts.wechat_unionid'] = unionid
        }

        const users = await selectUsers(basicAuth.validate(ctx)).where(filter)

        if (!users.length) {
            throw new Error('The requested user does not exists')
        }

        ctx.body = users[0]
    } catch (ex) {
        logger.error(ex)

        ctx.status = 404
        ctx.body = {
            error: ex.message,
        }
    }
}

const create = async ctx => {
    const trx = await promisify(knex.transaction)

    try {
        const { body } = ctx.request

        const users = await trx('users')
            .returning('user_id')
            .insert({
                name: body.name || '',
                role: body.role,
                created_at: new Date(),
                user_id: body.user_id || undefined,
            })

        if (!users.length) {
            throw new Error('The user already exists')
        }

        const userProfile = await trx('user_profiles').insert({
            user_id: users[0],
            avatar: body.avatar || '',
            mobile: body.mobile,
        })

        const userSocialAccounts = await trx('user_social_accounts').insert({
            user_id: users[0],
            facebook_id: body.facebook_id || null,
            facebook_name: body.facebook_name || '',
            wechat_openid: body.wechat_openid || null,
            wechat_unionid: body.wechat_unionid || null,
            wechat_name: body.wechat_name || null,
        })

        if (body.role === userBll.MemberType.Student) {
            await userDal.tryAddTags(users[0], [UserTags.Leads], trx)
        }

        await trx.commit()

        ctx.status = 201
        ctx.set('Location', `${ctx.request.URL}/${users[0]}`)
        ctx.body = users[0]
    } catch (error) {
        logger.error(error)

        await trx.rollback()
        ctx.status = 409
        ctx.body = {
            error: 'The user already exists',
        }
    }
}

const updateWechatInfo = async user_id => {
    const wechat_openid = _.get(await knex('user_social_accounts').where({ user_id }), '0.wechat_openid')
    if (!wechat_openid) return
    const wechat_data = await wechat.getUser(wechat_openid)
    if (_.isEmpty(wechat_data)) return
    await knex('user_social_accounts')
        .update({
            wechat_name: wechat_data.nickname,
            wechat_unionid: wechat_data.unionid,
            wechat_data: JSON.stringify(wechat_data),
        }).where({ user_id })
    const user = _.get(await knex('user_profiles').where({ user_id }), '0')
    if (!user) return
    if (_.includes(user.avatar, 'buzzbuzzenglish.com') || _.includes(user.avatar, 'clouddn.com')) return
    const avatar = await qiniu.uploadUrl(wechat_data.headimgurl)
    await knex('user_profiles').update({ avatar }).where({ user_id })
}

const accountSignIn = async ctx => {
    const { account, password } = ctx.request.body

    // 判断用户输入的手机号、邮箱、密码是否为空
    if (!account) {
        return ctx.throw(403, 'Please enter your phone number or email address')
    }

    if (!password) {
        return ctx.throw(403, 'Please enter your password')
    }

    const filterMobile = { 'user_profiles.mobile': account }
    const filterEmail = { 'user_profiles.email': account }

    let users = await selectUsers().where(filterMobile)

    if (!users.length) {
        users = await selectUsers().where(filterEmail)
    }

    if (!users.length) {
        return ctx.throw(404, 'The requested user does not exists')
    }

    if (Password.compare(password, users[0].password)) {
        ctx.cookies.set('user_id', users[0].user_id, {
            httpOnly: true,
            expires: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)),
        })
        await updateWechatInfo(users[0].user_id).catch(e => logger.error('updateWechatInfo', e))
        ctx.body = users[0]
    } else {
        return ctx.throw(403, 'Account or password error')
    }
}

const signIn = async ctx => {
    const { user_id, facebook_id, wechat_openid, wechat_unionid } = ctx.request.body

    if (!user_id) {
        return ctx.throw(403, 'sign in not allowed')
    }

    await updateWechatInfo(user_id).catch(e => logger.error('updateWechatInfo', JSON.stringify(e)))

    const filter = { 'users.user_id': user_id }

    const users = await selectUsers().where(filter)

    if (!users.length) {
        return ctx.throw(404, 'The requested user does not exists')
    }

    // TODO: don't set long term cookies by default:
    const cookieOptions = {
        httpOnly: true,
        expires: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)),
    }

    if (buzzConfig.rootDomain) {
        cookieOptions.domain = buzzConfig.rootDomain
    }
    ctx.cookies.set('user_id', user_id, cookieOptions)
    ctx.body = users[0]
}

function makeUpdations(updations) {
    const result = {}

    Object.keys(updations).map(prop => {
        if (typeof updations[prop] !== 'undefined') {
            if (prop === 'password') {
                result[prop] = Password.encrypt(updations[prop])
            } else {
                result[prop] = updations[prop]
            }
        }

        return prop
    })

    return result
}

const updateUsersTable = async function (body, trx, ctx) {
    if (body.role) {
        // There are many things to be checked to change a user's role
        await userBll.changeUserRole(body, trx, ctx.params.user_id)
    }

    const user = makeUpdations({
        name: body.name,
        remark: body.remark,
    })

    if (Object.keys(user).length > 0) {
        const users = await trx('users')
            .where('user_id', ctx.params.user_id)
            .update(user)
    }
}
const updateUserProfilesTable = async function (body, trx, ctx) {
    let profiles = makeUpdations({
        avatar: body.avatar,
        display_name: body.display_name,
        gender: body.gender,
        date_of_birth: body.date_of_birth,
        description: body.description,
        language: body.language,
        location: body.location,
        grade: body.grade,
        parent_name: body.parent_name,
        update_at: new Date(),
        country: body.country,
        city: body.city,
        state: body.state,
        school_name: body.school_name,
        time_zone: body.time_zone,
        order_remark: body.order_remark,
        youzan_mobile: body.youzan_mobile,
        weekly_schedule_requirements: body.weekly_schedule_requirements,
    })

    if (basicAuth.validate(ctx)) {
        if (body.mobile !== 'undefined' && body.mobile.indexOf('*') < 0) {
            profiles = Object.assign(profiles, makeUpdations({
                mobile: body.mobile,
            }))
        }

        if (body.email !== 'undefined' && body.email.indexOf('*') < 0) {
            profiles = Object.assign(profiles, makeUpdations({
                email: body.email,
            }))
        }

        profiles = Object.assign(profiles, makeUpdations({
            password: body.password,
        }))
    }

    if (Object.keys(profiles).length > 0) {
        const userProfile = await trx('user_profiles')
            .where('user_id', ctx.params.user_id)
            .update(profiles)
    }
}
const updateUserAccountsTable = async function (body, trx, ctx) {
    const accounts = makeUpdations({
        facebook_id: body.facebook_id,
        facebook_name: body.facebook_name,
        wechat_openid: body.wechat_openid,
        wechat_unionid: body.wechat_unionid,
        wechat_data: body.wechat_data,
    })
    if (Object.keys(accounts).length > 0) {
        const userSocialAccounts = await trx('user_social_accounts')
            .where('user_social_accounts.user_id', ctx.params.user_id)
            .update(accounts)
    }
}
const updateUserInterestsTable = async function (body, trx, ctx) {
    if (body.interests) {
        const deleted = await trx('user_interests')
            .where('user_interests.user_id', ctx.params.user_id)
            .del()

        const values = body.interests.map(i => ({ user_id: ctx.params.user_id, interest: i }))

        const inserted = await trx('user_interests')
            .insert(values)
    }
}
const update = async ctx => {
    const trx = await promisify(knex.transaction)

    try {
        const { body } = ctx.request
        await updateUsersTable(body, trx, ctx)
        await updateUserProfilesTable(body, trx, ctx)
        await updateUserAccountsTable(body, trx, ctx)
        await updateUserInterestsTable(body, trx, ctx)
        await trx.commit()

        ctx.status = 200
        ctx.set('Location', `${ctx.request.URL}`)
        ctx.body = await userBll.get(ctx.params.user_id, basicAuth.validate(ctx))
    } catch (error) {
        await trx.rollback()

        if (error instanceof userBll.UserHasConfirmedGroupsCanNotChangeRoleError) {
            ctx.throw(400, error)
        } else {
            logger.error('updating user error: ', error)
            ctx.status = 409
            ctx.body = error
        }
    }
}

const getByUserIdList = async ctx => {
    const { body } = ctx.request
    const userIdList = body.userIdList
    try {
        const userAvatarList = await knex('user_profiles')
            .select('user_id', 'avatar')
            .where('user_id', 'in', userIdList)

        ctx.body = userAvatarList || {}
        ctx.status = 200
    } catch (error) {
        logger.error(error)
    }
}

const deleteByUserID = async ctx => {
    const trx = await promisify(knex.transaction)
    try {
        const userID = ctx.params.user_id

        const deleted = await trx('users')
            .where('user_id', userID)
            .del()

        if (deleted <= 0) {
            throw new Error('The user does not exist!')
        }

        await trx.commit()
        ctx.status = 200
        ctx.body = 'delete success'
    } catch (error) {
        logger.error('delete user error: ', error)

        await trx.rollback()
        ctx.status = 409
        ctx.body = error
    }
}

const getAvailableUsers = async ctx => {
    // role: 'student' or 'companion'
    const { role } = ctx.query
    let { start_time, end_time } = ctx.query
    const schedule = `${role}_class_schedule`
    const hasSchedule = start_time && end_time
    if (hasSchedule) {
        start_time = timeHelper.convertToDBFormat(start_time)
        end_time = timeHelper.convertToDBFormat(end_time)
    }
    // 该时段已排班的用户
    const confirmedUsers = hasSchedule && _.map(await knex(schedule)
        .whereRaw(`status = 'confirmed' AND ((start_time >= '${start_time}' AND start_time < '${end_time}') OR (end_time > '${start_time}' AND end_time <= '${end_time}'))`)
        .select('user_id'), 'user_id')
    const notInQuery = _.isEmpty(confirmedUsers) ? '' : ` NOT IN (${confirmedUsers})`
    let query = knex('users')
    if (role === 'student') {
        query = query.joinRaw('INNER JOIN user_balance ON user_balance.user_id = users.user_id AND user_balance.class_hours > 0')
    }
    if (hasSchedule) {
        query = query.joinRaw(`INNER JOIN ${schedule} ON ${schedule}.user_id = users.user_id AND ${schedule}.status = 'booking' AND ${schedule}.start_time <= '${start_time}' AND ${schedule}.end_time >= '${end_time}'`)
    }
    query = query.leftJoin('user_profiles', 'users.user_id', 'user_profiles.user_id')
        .leftJoin('user_social_accounts', 'users.user_id', 'user_social_accounts.user_id')
        .leftJoin('user_interests', 'users.user_id', 'user_interests.user_id')
        .leftJoin('user_placement_tests', 'users.user_id', 'user_placement_tests.user_id')
        .groupBy('users.user_id')
        .select(
            '*',
            'users.user_id as user_id',
            knex.raw('group_concat(user_interests.interest) as interests'),
        ).whereRaw(`users.role = '${role[0]}' AND users.user_id${notInQuery}`)
    const result = await query
    ctx.body = result
}

const appendOrderRemark = async ctx => {
    try {
        await knex('user_profiles')
            .update({
                order_remark: knex.raw(`CONCAT_WS('\n', '${ctx.request.body.order_remark}', order_remark)`),
            }).where('user_id', ctx.params.user_id)
        ctx.body = 'success'
    } catch (e) {
        ctx.status = 500
        ctx.body = e
    }
}

const isProfileOK = async ctx => {
    ctx.body = await userBll.isProfileOK(ctx.params.user_id)
}
const sendScheduleMsg = async ctx => {
    try {
        const user_id = ctx.params.user_id
        if (!user_id) return
        const user = _.get(await knex('users')
            .leftJoin('user_profiles', 'users.user_id', 'user_profiles.user_id')
            .leftJoin('user_social_accounts', 'users.user_id', 'user_social_accounts.user_id')
            .select('user_profiles.email', 'user_social_accounts.wechat_name', 'user_social_accounts.wechat_openid', 'users.role')
            .where({ 'users.user_id': user_id }), 0)
        if (!user) return
        const role = { s: 'student', c: 'companion' }[user.role]
        const schedule = `${role}_class_schedule`
        const start_time = timeHelper.convertToDBFormat(moment().toISOString())
        const classInfo = await knex(schedule)
            .leftJoin('classes', 'classes.class_id', `${schedule}.class_id`)
            .where({ [`${schedule}.user_id`]: user_id, [`${schedule}.status`]: 'confirmed', 'classes.status': 'opened' })
            .where(`${schedule}.start_time`, '>', start_time)
        if (_.isEmpty(classInfo)) return
        if (user.wechat_openid) {
            await wechat.sendScheduleTpl(user.wechat_openid, user.wechat_name)
        } else if (user.role === 'c' && user.email) {
            await mail.sendScheduleMail(user.email)
        }
        ctx.status = 200
        ctx.body = { done: true }
    } catch (e) {
        console.error(e)
        ctx.throw(500, e)
    }
}

const getSocialAccountProfile = async ctx => {
    ctx.body = await userBll.getSocialAccountProfile(ctx.params.user_id)
}

module.exports = {
    search,
    show,
    getUserInfoByClassId,
    getByFacebookId,
    getByWechat,
    create,
    signIn,
    accountSignIn,
    update,
    getByUserIdList,
    delete: deleteByUserID,
    getAvailableUsers,
    appendOrderRemark,
    isProfileOK,
    sendScheduleMsg,
    getSocialAccountProfile,
    async listAllTags(ctx) {
        ctx.body = await userBll.listAllTags()
    },
    async getTags(ctx) {
        ctx.body = await userBll.getTags(ctx.params.user_id)
    },
    async deleteTags(ctx) {
        ctx.body = (await userBll.deleteTags(ctx.params.user_id, ctx.request.body)) || { message: 'done' }
    },
    async addTags(ctx) {
        ctx.body = (await userBll.addTags(ctx.params.user_id, ctx.request.body)) || { message: 'done' }
    },
}
