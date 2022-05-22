<template>
    <div class="log">
        <div class="log-header">
            <el-col :span="10">
                <el-input v-model="form.search" :placeholder="placeholder" suffix-icon="el-button-search"/>
            </el-col>
            <el-button type="primary" @click="log">搜索</el-button>
            <el-col :span="4">
                <el-radio v-model="form.type" label="event">埋点编号</el-radio>
            </el-col>
            <el-col :span="4">
                <el-radio v-model="form.type" label="page">页面编号</el-radio>
            </el-col>
            <el-date-picker
                class="log-header-date"
                v-model="form.from"
                align="left"
                type="date"
                placeholder="选择起始日期"
                :picker-options="pickerOptions">
            </el-date-picker>
            -
            <el-date-picker
                class="log-header-date"
                v-model="form.to"
                align="right"
                type="date"
                placeholder="选择结束日期"
                :picker-options="pickerOptions">
            </el-date-picker>
        </div>
        <div class="log-content" v-if="showContent">
            <el-tabs v-model="showType">
                <el-tab-pane label="表格" name="table"></el-tab-pane>
                <el-tab-pane label="JSON" name="json"></el-tab-pane>
            </el-tabs>
            <el-card>
                <div slot="header" class="clearfix">
                    <span>{{showType==="table"? '表格': 'JSON'}}</span>
                </div>
                <span v-if="showType==='json'">
                    {{JSON.stringify(data)}}
                </span>
                <div v-else-if="showType==='table'">
                    <el-table :data="tableData" style="width: 100%">
                        <el-table-column prop="name" label="事件名" width="110"/>
                        <el-table-column prop="id" label="事件编号" width="110"/>
                        <el-table-column prop="event_type" label="事件类型"/>
                        <el-table-column prop="page_number" label="所在页面编号"/>
                        <el-table-column prop="user_id" label="用户"/>
                        <el-table-column prop="timestamp" label="日期时间" width="180"/>
                        <el-table-column prop="device" label="设备"/>
                        <el-table-column prop="address" label="地址"  width="120"/>
                        <el-table-column prop="custom" label="自定义参数" width="180"/>
                    </el-table>
                </div>
            </el-card>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import axios from 'axios';
import report from 'report';
import dayjs from 'dayjs';

@Component
export default class LogAnalysis extends Vue {
    showContent = false;

    showType = 'table';

    data = null;
    
    get placeholder(){
      return `请输入${{event: '埋点', page: '页面'}[this.form.type]}编号`
    }

    get tableData(){
        return (this.data || []).map((datum: any) => {
            datum.timestamp = dayjs(datum.timestamp).format('YY-MM-DD HH:mm:ss')
            datum.custom = datum.custom? JSON.stringify(datum.custom): '无'
            return datum
        })
    }

    pickerOptions = {
        disabledDate(time: any) {
            return time.getTime() > Date.now();
        },
        shortcuts: [{
            text: '今天',
            onClick(picker: any) {
                picker.$emit('pick', new Date());
            }
        }, {
            text: '昨天',
            onClick(picker: any) {
                const date = new Date();
                date.setTime(date.getTime() - 3600 * 1000 * 24);
                picker.$emit('pick', date);
            }
        }, {
            text: '一周前',
            onClick(picker: any) {
                const date = new Date();
                date.setTime(date.getTime() - 3600 * 1000 * 24 * 7);
                picker.$emit('pick', date);
            }
        }]
    }

    form = {
        search: '',
        type: 'event',
        from: null,
        to: null
    }

    log(){
        if(!this.form.search){
            this.$message({
                message: '请填写查询信息',
                type: 'warning'
            });
            return;
        }
        
        let { from, to } = this.form;

        if(from && to && (from as Date).valueOf() > (to as Date).valueOf()){
            this.$message({
                message: '起始日期不可后于结束日期',
                type: 'warning'
            });
            return;
        }

        report({ userId: 'A', id: 'log_c', custom: null });
        axios.post('http://localhost:8081/log', this.form)
        .then(res => {
            if(res.data.code === 0){
                this.$message({
                    message: res.data.message,
                    type: 'success'
                });
                this.data = res.data.data;
                this.showContent = true;
            }else{
                this.$message({
                    message: res.data.message,
                    type: 'warning'
                });
            }
        })
        .catch(err => {
            console.log(err)
        })
        
    }

}
</script>

<style scoped lang="less">
.log{
    padding: 10px;
    &-header{
        align-items: center;
        display: flex;
        padding: 0 10px;
        &-date{
            margin: 0 10px;
        }
    }
}
</style>
