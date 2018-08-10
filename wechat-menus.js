import wechat from 'co-wechat-api'

export default class WechatMenus {
    static async create() {
        console.log(await wechat.api.createMenu({

            button: [

                {

                    type: 'view',

                    name: 'Buy',

                    url: 'https://h5.youzan.com/v2/goods/1y44iz9a3zgsa',

                },

                {

                    type: 'view',

                    name: 'About Us',

                    url: 'http://www.buzzbuzzenglish.com',

                },

                {

                    type: 'view',

                    name: 'L.I.V.E.',

                    url: 'http://live.buzzbuzzenglish.com',

                },

            ],

        }))

        console.log(await wechat.api.addConditionalMenu({

            button: [

                {

                    type: 'view',

                    name: '购买课时',

                    url: 'https://h5.youzan.com/v2/goods/1y44iz9a3zgsa',

                },

                {

                    type: 'view',

                    name: '关于我们',

                    url: 'http://www.buzzbuzzenglish.com',

                },

                {

                    type: 'view',

                    name: '英语角',

                    url: 'http://live.buzzbuzzenglish.com',

                },

            ],

            matchrule: {

                language: 'zh_CN',

            },

        }))

        console.log(await wechat.api.addConditionalMenu({

            button: [

                {

                    type: 'view',

                    name: '購買課時',

                    url: 'https://h5.youzan.com/v2/goods/1y44iz9a3zgsa',

                },

                {

                    type: 'view',

                    name: '關於我們',

                    url: 'http://www.buzzbuzzenglish.com',

                },

                {

                    type: 'view',

                    name: '英語角',

                    url: 'http://live.buzzbuzzenglish.com',

                },

            ],

            matchrule: {

                language: 'zh_TW',

            },

        }))

        console.log(await wechat.api.addConditionalMenu({

            button: [

                {

                    type: 'view',

                    name: '購買課時',

                    url: 'https://h5.youzan.com/v2/goods/1y44iz9a3zgsa',

                },

                {

                    type: 'view',

                    name: '關於我們',

                    url: 'http://www.buzzbuzzenglish.com',

                },

                {

                    type: 'view',

                    name: '語言角',

                    url: 'http://live.buzzbuzzenglish.com',

                },

            ],

            matchrule: {

                language: 'zh_HK',

            },

        }))
    }
}
