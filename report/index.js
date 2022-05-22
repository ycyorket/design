import axios from 'axios'

export default function report(data){
    let { userId, id, custom } = data
    const device = 0
    const timestamp = Date.now()
    if(userId && id){
        if(typeof custom === 'object' && custom){
            Object.entries(custom).forEach(([k, v]) => {
                if(!v) delete custom[k]
            })
        }
        const form = {userId, id, custom, timestamp, device };
        if([ 'object', 'undefined', 'null' ].includes(typeof custom)){
            axios.post('http://localhost:8081/report', form).catch(res => {
                if(res.data.code === 0){
                    console.log('上报成功！')
                }else{
                    console.log('上报失败，原因：', res.data.message)
                }
            })
        }
    }
}