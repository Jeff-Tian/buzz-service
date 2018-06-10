import { SystemUserTags, SystemUserTagSet } from '../common/constants'
import TagDal from '../dal/tag'

function containSystemUserTags(tags) {
    return !!tags.filter(x => SystemUserTagSet.has(x)).length
}

export class TagsOperationNotAllowedForAnonymousUsersError extends Error {

}

const onlyNormalTags = function (tags) {
    return !containSystemUserTags(tags)
}
const notAuthenticated = function (context) {
    return !context || !context.state || !context.state.user
}
const currentUserHasNoPrevelege = function (currentUserTags) {
    return !containSystemUserTags(currentUserTags)
}

export class TagsOperationNotAllowedForNormalUsersError extends Error {
}

export class OnlySuperUserCanManageSystemUserTagsError extends Error {
}

const superUserExists = async function () {
    return (await TagDal.getUsersByTag(SystemUserTags.Super)).length > 0
}

function currentUserIsNotSuper(currentUserTags) {
    return !currentUserTags.filter(x => new Set([SystemUserTags.Super]).has(x)).length
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

        const superUserExistsInSystem = await superUserExists()
        const currentUserTags = (await TagDal.getTagsByUserId(context.state.user.user_id)).map(t => t.tag)

        if (superUserExistsInSystem && currentUserHasNoPrevelege(currentUserTags)) {
            throw new TagsOperationNotAllowedForNormalUsersError()
        }

        if (superUserExistsInSystem && currentUserIsNotSuper(currentUserTags)) {
            throw new OnlySuperUserCanManageSystemUserTagsError()
        }
    }
}
