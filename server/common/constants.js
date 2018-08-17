export const UserTags = {
    Leads: 'leads',
    NeedCharge: '需续费',
    Refunded: '已退费',
}

export const SystemUserTags = {
    Super: '超级管理员',
    Admin: '系统管理员',
}

export const NotificationTags = {
    ReceiveNotifications: '接收通知',
}

export const SystemUserTagSet = new Set([SystemUserTags.Super, SystemUserTags.Admin])

export const ClassStatusCode = {
    Open: 'opened',
    Cancelled: 'cancelled',
    End: 'ended',
}

export const NeedChargeThreshold = 0

export default class Constants {
}
