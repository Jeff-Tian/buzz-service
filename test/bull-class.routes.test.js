// Configure the environment and require Knex
const moment = require('moment')
const env = process.env.NODE_ENV || 'test'
console.log('env = ', env)
const config = require('../knexfile')[env]
const server = require('../server/index')
const knex = require('knex')(config)
const PATH = '/api/v1/class-schedule'
// Require and configure the assertion library
const chai = require('chai')
const should = chai.should()
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
// Rollback, commit and populate the test database before each test
describe('routes: class schedules with bull service', () => {
    beforeEach(() => knex.migrate
        .rollback()
        .then(() => knex.migrate.latest())
        .then(() => knex.seed.run()))
    // Rollback the migration after each test
    afterEach(() => knex.migrate.rollback())

    describe.skip('班级测试 - 需要创建任务的场景', () => {
        it('创建一个5秒后结束的班级，5 秒后状态应该被改成 ended ', done => {
            const end_time = moment().add(5, 's')
            console.log(end_time)
            chai
                .request(server)
                .post(`${PATH}`)
                .send({
                    adviser_id: 1,
                    companions: [4, 5, 6],
                    level: 'aa',
                    start_time: '2018-03-02T10:00:00Z',
                    end_time,
                    status: 'opened',
                    name: 'Test class',
                    remark: 'xxx',
                    topic: 'animal',
                    students: [1, 2, 3],
                    exercises: '["yyy","zzz"]',
                    room_url: 'http://www.baidu.com',
                })
                .end(async (err, res) => {
                    should.not.exist(err)
                    res.status.should.eql(201)
                    const classId = res.body.class_id

                    await new Promise(resolve => setTimeout(resolve, 10000))

                    chai
                        .request(server)
                        .get(`${PATH}/${classId}`)
                        .end((err, res) => {
                            should.not.exist(err)
                            res.status.should.eql(200)
                            res.body[0].status.should.eql('ended')

                            done()
                        })
                })
        })
    })

    describe.skip('班级测试 - 需要创建任务，然后进行修改任务结束时间', () => {
        it('创建一个5秒后结束的班级，然后将班级结束时间改为5秒后结束 ', done => {
            const end_time = moment().add(5, 's')
            console.log(end_time)
            chai
                .request(server)
                .post(`${PATH}`)
                .send({
                    adviser_id: 1,
                    companions: [4, 5, 6],
                    level: 'aa',
                    start_time: '2018-03-02T10:00:00Z',
                    end_time,
                    status: 'opened',
                    name: 'Test class',
                    remark: 'xxx',
                    topic: 'animal',
                    students: [1, 2, 3],
                    exercises: '["yyy","zzz"]',
                    room_url: 'http://www.baidu.com',
                })
                .end(async (err, res) => {
                    should.not.exist(err)
                    res.status.should.eql(201)
                    const classId = res.body.class_id
                    chai
                        .request(server)
                        .post(`${PATH}`)
                        .send({
                            class_id: classId,
                            end_time: moment().add(5, 's'),
                            students: [1, 2, 3, 4],
                        })
                        .end((err, res) => {
                            should.not.exist(err)
                            res.status.should.eql(200)
                        })

                    await new Promise(resolve => setTimeout(resolve, 15000))

                    chai
                        .request(server)
                        .get(`${PATH}/${classId}`)
                        .end((err, res) => {
                            should.not.exist(err)
                            res.status.should.eql(200)
                            res.body[0].status.should.eql('ended')

                            done()
                        })
                })
        })
    })
})

