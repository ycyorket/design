const express = require('express')
const expressIp = require('express-ip')
const path = require('path')
const dayjs = require('dayjs')
const server = express()
const rooter = express.Router()
const sql = require('mysql')

let mysql = sql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'design'
})

mysql.connect(e => {
    if(e){
        console.log('数据库连接失败')
        throw e
    }
    console.log('数据库完成连接')
})

function format(item){
    if(typeof item === 'string')
        return `'${item}'`
    else if (typeof item === 'number')
        return item
    else if (Array.isArray(item))
        return `'${item.map(({name, type}) => `${name} ${type}`).join(' ')}'`
    else if (item && typeof item === 'object')
        return `'${Object.entries(item).map(([key, value]) => `${key} ${value}`).join(' ')}'`
    else
        return 'null'
}

function getCity(req){
   const { ipInfo } = req;
   if(!ipInfo || typeof ipInfo === 'string')
        return 'Hangzhou'
    else
        return ipInfo.city || 'Hangzhou'
}

function getTimestampSQL(from, to){
    let f = from? dayjs(from).subtract(8, 'hour').valueOf(): null;
    let t = to? dayjs(to).subtract(8, 'hour').add(1, 'day').valueOf(): null;
    let res = " AND "
    if(f){
        if(t){
            res +=`timestamp between ${f} and ${t} `
        }else{
            res += 'timestamp>=' + f +" "
        }
    }else if(t){
        res += 'timestamp<=' + t +" "
    }else{
        res = ""
    }
    console.log('>>>>>> FROM ', dayjs(f).format(), ' TO ', dayjs(t).format(), '>>>>>>\n')
    return res;
}

function parseCustom(custom){
    if(!custom)
        return null;
    const items = custom.split(' ');
    const res = {};
    for(let i = 0; i < items.length; i += 2){
        res[items[i]] = items[i+1];
    }
    return res;
}

server.set('views', path.join(__dirname, 'views'));
server.set('view engine', 'ejs');
server.use(express.json())
server.use(expressIp().getIpInfoMiddleware)
server.all('*', (req, res, next)=>{
    res.header("Access-Control-Allow-Origin", '*'); 
    res.header("Access-Control-Allow-Methods", "POST, GET"); 
    res.header("Access-Control-Allow-Headers", "X-Requested-With"); 
    res.header("Access-Control-Allow-Headers", "Content-Type"); 
    next();
})

server.get('/', (req, res) => {
    res.send('Hello world!')
})

server.post('/addPage', (req, res) => {
    let err = ''
    let { body } = req
    let { number } = body
    // 不能出现已有的页面
    mysql.query(`SELECT * FROM Page WHERE number='${number}'`, (e, results, fields) => {
        console.log('\nAP@ 确认是否已存在页面号', number)
        console.log('AP@ 结果：', !!results.length)
        if(e) throw e
        if(results.length){
            res.json({
                code: -1,
                message: '编号重复'
            })
        }else{
            const values = [body.name, body.url, body.number, body.admin, body.password, body.description].map(format).join(',')
            mysql.query(`INSERT INTO Page VALUES (${values})`, (e, results, fields) => {
                console.log('\nAP@ 插入 Pages数据表：', values)
                console.log('AP@ 结果：', results.length)
                res.json({
                    code: e? -1: 0,
                    message: e? '创建失败': '创建成功'
                })
            }) 
        }
    })
})

server.post('/addEvent', async (req, res) => {
    let err = ''
    let { body } = req
    let { number, pageNumber } = body

    function report(){
        if(err){
            res.json({ code: -1, message: err })
        }
    }

    // 新建埋点
    const addEvent = () => {
        const values = [body.name, body.number, body.pageNumber, body.eventType, body.description, body.custom].map(format).join(',')
        mysql.query(`INSERT INTO Eventtype VALUES (${values})`, (e, results, fields) => {
            console.log('\nAE@ 插入 Eventtype数据表：', values)
            console.log('AE@ 结果：', results.length)
            res.json({
                code: e? -1: 0,
                message: e? '创建失败': '创建成功'
            })
        })
    }

    // 检查页面
    const checkPage = () => mysql.query(`SELECT * FROM Page WHERE number='${pageNumber}'`, (e, results, fields) => {
        console.log('\nAE@ 确认是否有已存在的页面号', pageNumber)
        console.log('AE@ 结果：', !!results.length)
        if(e){
            err = '数据库错误'
            throw e
        }
        if(results.length){
            let page = results[0]
            if(page.admin !== body.admin){
                err = '管理员账号错误'
            }else if(page.password !== body.password){
                err = '管理员密码错误'
            }
        }else{
            err = '页面不存在，请先创建页面';
        }
        if(err){
            report()
        }else{
            addEvent()
        }
    })

    // 不能出现已有的编号
    mysql.query(`SELECT * FROM Eventtype WHERE number='${number}'`, (e, results, fields) => {
        console.log('\nAE@ 确认是否已存在埋点号', number)
        console.log('AE@ 结果：', !!results.length)
        if(e){
            err = '数据库错误'
            throw e
        }
        if(results.length){
            err = '编号重复';
            report();
        }else{
            checkPage();
        }
    })
})

server.post('/report', (req, res) => {
    let err = ''
    const { body } = req
    let { custom, device, id, timestamp, userId } = body
    const address = getCity(req);

    // 新建事件
    const addEvent = () => {
        const values = [userId, id, device, address, timestamp, custom].map(format).join(',')
        mysql.query(`INSERT INTO Events VALUES (${values})`, (e, results, fields) => {
            console.log('\nR@ 插入 Events数据表：', values)
            console.log('R@ 结果：', results.length)
            res.json({
                code: e? -1: 0,
                message: e? '创建失败': '创建成功'
            })
        })
    }

    // 检查埋点
    const checkEvent = () => mysql.query(`SELECT * FROM Eventtype WHERE number='${id}'`, (e, results, fields) => {
        console.log('\nR@ 确认是否有已存在的埋点号', id)
        console.log('R@ 结果：', !!results.length)
        if(e){
            err = '数据库错误'
            throw e
        }
        if(!results.length){
            err = '埋点不存在，请先创建埋点';
        }
        if(err){
            res.json({ code: -1, message: err })
        }else{
            addEvent()
        }
    })

    checkEvent();
})

server.post('/log', (req, res) => {
    let err = ''
    let { body } = req
    let { from, to, search, type } = body
    timestamp = getTimestampSQL(from, to);
    if(type === 'page')
        // 寻找页面
        mysql.query(`SELECT * FROM Page WHERE number='${search}'`, (e, results, fields) => {
            console.log('\nL@ 确认是否已存在页面号', search)
            console.log('L@ 结果：', !!results.length)
            if(e) throw e
            if(!results.length){
                res.json({
                    code: 1,
                    message: '页面不存在',
                    data: null
                })
            }else{
                const values = [body.name, body.url, body.number, body.admin, body.password, body.description].map(format).join(',')
                mysql.query(`SELECT * FROM EVENTTYPE WHERE page_number='${search}'`, (e, results, fields) => {
                    console.log('\nL@ 确认是否页面号上是否有埋点：', search)
                    console.log('L@ 结果：', (results || []).map(e => e.number))
                    if(!results || !results.length){
                        res.json({
                            code: 0,
                            message: '页面上无埋点',
                            data: []
                        })
                    }else{
                        let numbers = results.map(e => format(e.number)).join(',');
                        console.log(`L@ 查询 SELECT *, t.custom as custom_type, e.custom as custom  FROM EVENTS as e INNER JOIN EVENTTYPE as t ON e.id=t.number WHERE id in(${numbers}) ${timestamp}`);
                        mysql.query(`SELECT *, t.custom as custom_type, e.custom as custom  FROM EVENTS as e INNER JOIN EVENTTYPE as t ON e.id=t.number WHERE id in(${numbers}) ${timestamp}`, (e, results, fields) => {
                            console.log('L@ 结果：', results.length)
                            res.json({
                                code: e? -1: 0,
                                message: e? '查询失败': '查询成功',
                                data: results.map(r => {
                                    r.custom = parseCustom(r.custom)
                                    r.device = "web端"
                                    return r
                                })
                            })
                        })
                    }
                }) 
            }
        })
    else if(type === 'event')
        // 寻找埋点
        mysql.query(`SELECT * FROM Eventtype WHERE number='${search}'`, (e, results, fields) => {
            console.log('L@ \n确认是否已存在页面号', search)
            console.log('L@ 结果：', !!results.length)
            if(e) throw e
            if(!results.length){
                res.json({
                    code: 1,
                    message: '埋点不存在',
                    data: []
                })
            }else{
                console.log(`L@ 查询 SELECT *, t.custom as custom_type, e.custom as custom  FROM EVENTS as e INNER JOIN EVENTTYPE as t ON e.id=t.number WHERE id='${search}' ${timestamp}`);
                mysql.query(`SELECT *, t.custom as custom_type, e.custom as custom  FROM EVENTS as e INNER JOIN EVENTTYPE as t ON e.id=t.number WHERE id='${search}' ${timestamp}`, (e, results, fields) => {
                    console.log('L@ 结果：', results.length)
                    res.json({
                        code: e? -1: 0,
                        message: e? '查询失败': '查询成功',
                        data: results.map(r => {
                            r.custom = parseCustom(r.custom)
                            r.device = "web端"
                            return r
                        })
                    })
                }) 
            }
        })
})

server.post('/sequence', (req, res) => {
    let err = ''
    let { body } = req
    let { from, to, search, type } = body
    timestamp = getTimestampSQL(from, to);
    if(type === 'page')
        // 寻找页面
        mysql.query(`SELECT * FROM Page WHERE number='${search}'`, (e, results, fields) => {
            console.log('\nS@ 确认是否已存在页面号', search)
            console.log('S@ 结果：', !!results.length)
            if(e) throw e
            if(!results.length){
                res.json({
                    code: 1,
                    message: '页面不存在',
                    data: null
                })
            }else{
                const values = [body.name, body.url, body.number, body.admin, body.password, body.description].map(format).join(',')
                mysql.query(`SELECT * FROM EVENTTYPE WHERE page_number='${search}'`, (e, results, fields) => {
                    console.log('\nS@ 确认是否页面号上是否有埋点：', search)
                    console.log('S@ 结果：', (results || []).map(e => e.number))
                    if(!results || !results.length){
                        res.json({
                            code: 0,
                            message: '页面上无埋点',
                            data: []
                        })
                    }else{
                        const viewEvents = results.filter(r => r['event_type'] === 'VIEW').map(e => e.number);
                        let numbers = results.map(e => format(e.number)).join(',');
                        console.log(`S@ 查询 SELECT *, t.custom as custom_type, e.custom as custom  FROM EVENTS as e INNER JOIN EVENTTYPE as t ON e.id=t.number WHERE id in(${numbers}) ${timestamp}`);
                        mysql.query(`SELECT *, t.custom as custom_type, e.custom as custom  FROM EVENTS as e INNER JOIN EVENTTYPE as t ON e.id=t.number WHERE id in(${numbers}) ${timestamp}`, (e, results, fields) => {
                            console.log('S@ 结果：', results.length)
                            const log = results.map(r => {
                                r.custom = parseCustom(r.custom)
                                r.device = "web端"
                                return r
                            });
                            const view = log.filter(r => {
                                return (viewEvents || []).includes(r.id)
                            })
                            res.json({
                                code: e? -1: 0,
                                message: e? '查询失败': '查询成功',
                                log,
                                view
                            })
                        })
                    }
                }) 
            }
        })
    else if(type === 'event')
        // 寻找埋点
        mysql.query(`SELECT * FROM Eventtype WHERE number='${search}'`, (e, results, fields) => {
            console.log('S@ \n确认是否已存在页面号', search)
            console.log('S@ 结果：', !!results.length)
            if(e) throw e
            if(!results.length){
                res.json({
                    code: 1,
                    message: '埋点不存在',
                    log: []
                })
            }else{
                console.log(`S@ 查询 SELECT *, t.custom as custom_type, e.custom as custom  FROM EVENTS as e INNER JOIN EVENTTYPE as t ON e.id=t.number WHERE id='${search}' ${timestamp}`);
                mysql.query(`SELECT *, t.custom as custom_type, e.custom as custom  FROM EVENTS as e INNER JOIN EVENTTYPE as t ON e.id=t.number WHERE id='${search}' ${timestamp}`, (e, results, fields) => {
                    console.log('S@ 结果：', results.length)
                    res.json({
                        code: e? -1: 0,
                        message: e? '查询失败': '查询成功',
                        log: results.map(r => {
                            r.custom = parseCustom(r.custom)
                            r.device = "web端"
                            return r
                        })
                    })
                }) 
            }
        })
})

server.post('/distribution', (req, res) => {
    let err = ''
    let { body } = req
    let { from, to, search, type } = body
    timestamp = getTimestampSQL(from, to);
    if(type === 'page')
        // 寻找页面
        mysql.query(`SELECT * FROM Page WHERE number='${search}'`, (e, results, fields) => {
            console.log('\nD@ 确认是否已存在页面号', search)
            console.log('D@ 结果：', !!results.length)
            if(e) throw e
            if(!results.length){
                res.json({
                    code: 1,
                    message: '页面不存在',
                    data: null
                })
            }else{
                const values = [body.name, body.url, body.number, body.admin, body.password, body.description].map(format).join(',')
                mysql.query(`SELECT * FROM EVENTTYPE WHERE page_number='${search}'`, (e, results, fields) => {
                    console.log('\nD@ 确认是否页面号上是否有埋点：', search)
                    console.log('D@ 结果：', (results || []).map(e => e.number))
                    if(!results || !results.length){
                        res.json({
                            code: 0,
                            message: '页面上无埋点',
                            data: []
                        })
                    }else{
                        let numbers = results.map(e => format(e.number)).join(',');
                        console.log(`D@ 查询 SELECT *, t.custom as custom_type, e.custom as custom  FROM EVENTS as e INNER JOIN EVENTTYPE as t ON e.id=t.number WHERE id in(${numbers}) ${timestamp}`);
                        mysql.query(`SELECT *, t.custom as custom_type, e.custom as custom  FROM EVENTS as e INNER JOIN EVENTTYPE as t ON e.id=t.number WHERE id in(${numbers}) ${timestamp}`, (e, results, fields) => {
                            console.log('D@ 结果：', results.length)
                            res.json({
                                code: e? -1: 0,
                                message: e? '查询失败': '查询成功',
                                data: results.map(r => {
                                    r.custom = parseCustom(r.custom)
                                    r.custom_type = parseCustom(r.custom_type)
                                    r.device = "web端"
                                    return r
                                })
                            })
                        })
                    }
                }) 
            }
        })
    else if(type === 'event')
        // 寻找埋点
        mysql.query(`SELECT * FROM Eventtype WHERE number='${search}'`, (e, results, fields) => {
            console.log('D@ \n确认是否已存在埋点号', search)
            console.log('D@ 结果：', !!results.length)
            if(e) throw e
            if(!results.length){
                res.json({
                    code: 1,
                    message: '埋点不存在',
                    data: []
                })
            }else{
                console.log(`D@ 查询 SELECT *, t.custom as custom_type, e.custom as custom  FROM EVENTS as e INNER JOIN EVENTTYPE as t ON e.id=t.number WHERE id='${search}' ${timestamp}`);
                mysql.query(`SELECT *, t.custom as custom_type, e.custom as custom  FROM EVENTS as e INNER JOIN EVENTTYPE as t ON e.id=t.number WHERE id='${search}' ${timestamp}`, (e, results, fields) => {
                    console.log('D@ 结果：', results.length)
                    res.json({
                        code: e? -1: 0,
                        message: e? '查询失败': '查询成功',
                        data: results.map(r => {
                            r.custom = parseCustom(r.custom)
                            r.custom_type = parseCustom(r.custom_type)
                            r.device = "web端"
                            return r
                        })
                    })
                }) 
            }
        })
})

server.post('/path', (req, res) => {
    let err = ''
    let { body } = req
    let { from, to, search, type } = body
    let pageInfo = null;
    timestamp = getTimestampSQL(from, to);
    mysql.query(`SELECT * FROM Page WHERE number='${search}'`, (e, results, fields) => {
        console.log('\nP@ 确认是否已存在页面号', search)
        console.log('P@ 结果：', !!results.length)
        if(e) throw e
        if(!results.length){
            res.json({
                code: -1,
                message: '页面不存在',
                data: null
            })
        }else{
            pageInfo = results[0]
            delete pageInfo.admin
            delete pageInfo.password

            const values = [body.name, body.url, body.number, body.admin, body.password, body.description].map(format).join(',')
            mysql.query(`SELECT * FROM EVENTTYPE WHERE page_number='${search}'`, (e, results, fields) => {
                console.log('\nP@ 确认是否页面号上是否有埋点：', search)
                console.log('P@ 结果：', (results || []).map(e => e.number))
                const eventTypes =  (results || []).map(e => e['event_type'])
                if(!results || !eventTypes.includes('VIEW') || !eventTypes.includes('EXIT')){
                    res.json({
                        code: 1,
                        message: '页面上缺少配套的VIEW-EXIT的埋点',
                        pageInfo,
                        data: []
                    })
                }else{
                    console.log(`P@ 查询 SELECT *, t.custom as custom_type, e.custom as custom FROM EVENTS as e INNER JOIN EVENTTYPE as t ON e.id=t.number WHERE event_type in('VIEW', 'EXIT') ${timestamp}`);
                    mysql.query(`SELECT *, t.custom as custom_type, e.custom as custom , p.name as page_name, p.description as page_desc
                    FROM EVENTS as e
                    INNER JOIN EVENTTYPE as t ON e.id=t.number
                    INNER JOIN PAGE as p ON p.number=t.page_number
                    WHERE event_type in('VIEW', 'EXIT') ${timestamp}`, (e, results, fields) => {
                        console.log('P@ 结果：', (results || []).length)
                        const data = results.map(r => {
                            r.custom = parseCustom(r.custom)
                            r.custom_type = parseCustom(r.custom_type)
                            r.device = "web端"
                            delete r.admin
                            delete r.password
                            return r
                        });
                        res.json({
                            code: e? -1: 0,
                            message: e? '查询失败': '查询成功',
                            pageInfo,
                            data
                        })
                    })
                }
            }) 
        }
    })
})

server.listen(8081, () => {
    console.log('服务启动')
})

