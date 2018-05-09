// Configure the environment and require Knex
const moment = require('moment')
const env = process.env.NODE_ENV || 'test'
const config = require('../knexfile')[env]
const server = require('../server/index')
const knex = require('knex')(config)
const PATH = '/api/v1/class-schedule'
// Require and configure the assertion library
const chai = require('chai')
const should = chai.should()
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
const promiseFinally = require('promise.prototype.finally')
promiseFinally.shim()

function create3Classes() {
    return new Promise((resolve, reject) => {
        chai
            .request(server)
            .post(`${PATH}`)
            .send({
                adviser_id: 1,
                companions: [4],
                level: 'aa',
                start_time: '2018-03-02T10:00:00Z',
                end_time: '2018-03-02T11:00:00Z',
                status: 'opened',
                name: 'Test class',
                remark: 'xxx',
                topic: 'animal',
                students: [1, 2, 3],
                exercises: '["yyy","zzz"]',
                room_url: 'http://www.baidu.com',
            }, {
                adviser_id: 2,
                companions: [4, 5, 6],
                level: 'aa',
                start_time: '2018-03-02T10:00:00Z',
                end_time: '2018-03-02T11:00:00Z',
                status: 'opened',
                name: 'Test class',
                remark: 'xxx',
                topic: 'animal',
                students: [1, 2, 3],
                exercises: '["yyy","zzz"]',
                room_url: 'http://www.baidu.com',
            }, {
                adviser_id: 3,
                companions: [4, 5, 6],
                level: 'aa',
                start_time: '2018-03-02T10:00:00Z',
                end_time: '2018-03-02T11:00:00Z',
                status: 'opened',
                name: 'Test class',
                remark: 'xxx',
                topic: 'animal',
                students: [1, 2, 3],
                exercises: '["yyy","zzz"]',
                room_url: 'http://www.baidu.com',
            })
            .end((err, res) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(res)
                }
            })
    })
}

function create1Class() {
    return new Promise((resolve, reject) => {
        chai
            .request(server)
            .post(`${PATH}`)
            .send({
                adviser_id: 1,
                companions: [4],
                level: 'aa',
                start_time: '2018-03-02T10:00:00Z',
                end_time: '2018-03-02T11:00:00Z',
                status: 'opened',
                name: 'Test class',
                remark: 'xxx',
                topic: 'animal',
                students: [1, 2, 3],
                exercises: '["yyy","zzz"]',
                room_url: 'http://www.baidu.com',
            })
            .end((err, res) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(res)
                }
            })
    })
}

function updateClass(classId) {
    return new Promise((resolve, reject) => {
        chai.request(server)
            .post(`${PATH}`)
            .send({
                class_id: classId,
                adviser_id: 1,
                companions: [4],
                start_time: '2018-03-02T10:00:00Z',
                end_time: '2018-03-02T11:00:00Z',
                status: 'opened',
                name: 'Test class',
                remark: 'xxx',
                topic: 'animal',
                students: [33, 44, 55],
                exercises: '["yyy","zzz"]',
                room_url: 'http://www.baidu.com',
            })
            .end((err, res) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(res)
                }
            })
    })
}

// Rollback, commit and populate the test database before each test
describe('routes: class schedules select with attendies info', () => {
    beforeEach(() => knex.migrate
        .rollback()
        .then(() => knex.migrate.latest())
        .then(() => knex.seed.run()))
    // Rollback the migration after each test
    afterEach(() => knex.migrate.rollback())

    describe(`GET ${PATH}`, () => {
        it('should list all the classes', done => {
            create3Classes().then(res => {
                chai
                    .request(server)
                    .get(`${PATH}`)
                    .end((err, res) => {
                        should.not.exist(err)
                        res.status.should.eql(200)
                        res.type.should.eql('application/json')
                        res.body.length.should.gt(3)
                        res.body[0].should.include.keys('room_url', 'companions', 'students')
                        done()
                    })
            })
        })
    })

    describe(`GET ${PATH}/:class_id`, () => {
        it('通过class_id获取到班级信息应该包含 companion_name', done => {
            chai
                .request(server)
                .get(`${PATH}/1`)
                .end((err, res) => {
                    should.not.exist(err)
                    res.status.should.eql(200)
                    res.body[0].should.include.keys('companion_name')
                    done()
                })
        })
    })
    describe(`POST ${PATH}`, () => {
        it('should update students and companions from a class', () => create1Class()
            .then(res => {
                res.status.should.eql(201)
                res.type.should.eql('application/json')
                res.body.adviser_id.should.eql(1)
                res.body.end_time.should.eql('2018-03-02T11:00:00Z')
                res.body.name.should.eql('Test class')
                res.body.start_time.should.eql('2018-03-02T10:00:00Z')
                res.body.status.should.eql('opened')
                res.body.topic.should.eql('animal')

                return res.body.class_id
            }, should.not.exist)
            .then(updateClass, should.not.exist)
            .then(res => {
                res.status.should.eql(200)
                res.body.companions.should.eql('4')
            }, should.not.exist))
    })
})
