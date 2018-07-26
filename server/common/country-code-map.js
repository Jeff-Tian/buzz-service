import { iso3166_data } from 'phone'

export const countryCodeMap = {}
iso3166_data.map(i => {
    countryCodeMap[i.alpha3] = i.country_code
    return i
})

export default class {

}
