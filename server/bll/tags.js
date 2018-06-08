import { SystemUserTags, SystemUserTagSet } from '../common/constants'
import * as userBll from './user'

function containSystemUserTags(tags) {
    return !!tags.filter(x => SystemUserTagSet.has(x)).length
}

export class TagsOperationNotAllowedForAnonymousUsersError extends Error {

}

const onlyNormalTags = function (tags) {
    return !containSystemUserTags(tags)
}
const notAuthenticated = function (context) {
    return !context.state || !context.state.user
}
const currentUserHasNoPrevelege = async function (context) {
    return !containSystemUserTags(await userBll.getTags(context.state.user.user_id))
}

export class TagsOperationNotAllowedForNormalUsersError extends Error {
}

const superUserExists = async function () {
    return (await userBll.getUsersByTag(SystemUserTags.Super)).length > 0
}
export default class Tags {
    static containSystemUserTags(tags) {
        return containSystemUserTags(tags)
    }

    static async checkHttpContext(context, tags) {
        if (onlyNormalTags(tags)) {
            return
        }

        if (notAuthenticated(context)) {
            throw new TagsOperationNotAllowedForAnonymousUsersError()
        }

        if (await superUserExists() && await currentUserHasNoPrevelege(context)) {
            throw new TagsOperationNotAllowedForNormalUsersError()
        }
    }
}
