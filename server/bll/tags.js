import { SystemUserTagSet } from '../common/constants'

export class TagsOperationNotAllowedError extends Error {

}

export default class Tags {
    static containsSystemUserTags(tags) {
        return !!tags.filter(x => SystemUserTagSet.has(x)).length
    }

    static checkHttpContext(context, tags) {
        if (Tags.containsSystemUserTags(tags)) {
            if (!context.state || !context.state.user) {
                throw new TagsOperationNotAllowedError()
            }
        } else {
            return true
        }
    }
}
