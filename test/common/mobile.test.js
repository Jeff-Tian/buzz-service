import chai from 'chai'

import Mobile from '../../server/common/mobile'

chai.should()

describe('mobile', () => {
    it('解析手机号', () => {
        Mobile.split('').should.eql({
            country: {
                country_code: '86',
                country_full_name: 'China',
                country_long_name: 'CHN',
                country_short_name: 'CN',
                mobile_begin_with: ['13', '14', '15', '17', '18', '19', '16'],
                mobile_length: [11],
            },
            mobile: '',
        })
    })
})
