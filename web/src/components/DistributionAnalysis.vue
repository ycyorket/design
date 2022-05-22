<template>
    <div class="distribution">
        <div class="distribution-header">
            <el-col :span="10">
                <el-input v-model="form.search" :placeholder="placeholder" suffix-icon="el-button-search"/>
            </el-col>
            <el-button type="primary" @click="distribution">搜索</el-button>
            <el-col :span="4">
                <el-radio v-model="form.type" label="event">埋点编号</el-radio>
            </el-col>
            <el-col :span="4">
                <el-radio v-model="form.type" label="page">页面编号</el-radio>
            </el-col>
            <el-date-picker
                class="distribution-header-date"
                v-model="form.from"
                align="left"
                type="date"
                placeholder="选择起始日期"
                :picker-options="pickerOptions">
            </el-date-picker>
            -
            <el-date-picker
                class="distribution-header-date"
                v-model="form.to"
                align="right"
                type="date"
                placeholder="选择结束日期"
                :picker-options="pickerOptions">
            </el-date-picker>
        </div>
        <div class="distribution-content" v-show="showContent">
            <el-carousel height="600px" :autoplay="false" arrow="hover" :loop="true">
                <el-carousel-item  v-for="chart in charts" :key="chart.name">
                    <div :id="'chart-'+chart.name" style="margin: 10px; width: 100%; height: 500px;"></div>
                </el-carousel-item>
            </el-carousel>
            
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import axios from 'axios';
import report from 'report';
import dayjs from 'dayjs';
import * as echarts from 'echarts';

@Component
export default class distributionAnalysis extends Vue {
    showContent = false;

    charts: any = [];

    get placeholder(){
      return `请输入${{event: '埋点', page: '页面'}[this.form.type]}编号`
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
        from: null,
        type: 'event',
        to: null
    }

    process(data: any){
      /*Address User_id Device Id<Page> Custom<Event>*/
        const statistics: any = {
            address: [],
            user: [],
            device: []
        };

        const cnNames: any = {
            address: 'IP地址所在城市',
            user: '用户',
            device: '设备',
            events: '事件'
        }

        const type = this.form.type;

        const addDatum = (name: string, a: any[]) => {
            const item = a.find(e => e.name === name);
            if(item)
                item.value += 1;
            else{
                a.push({name, value: 1})
            }
        }

        const getItem = (key: any, o: any) => {
            if(o[key]) return o[key]
            else{
                o[key] = [];
                return o[key];
            }
        }
        data.forEach((datum: any) => {
            //地址
            addDatum(datum.address, statistics.address)
            addDatum(datum.user_id, statistics.user)
            addDatum(datum.device, statistics.device)

            if(type === 'event'){
                Object.keys(datum.custom || {}).forEach(
                    key => {
                        if(datum.custom_type[key]){
                            addDatum(datum.custom[key], getItem('自定义参数：'+key, statistics))
                        }
                    }
                )
            }else{
                addDatum(datum.id, getItem('events', statistics))
            }
        })
        Object.entries(statistics).forEach(([k, v]) => {
            this.charts.push({
                name: k,
                instance: null,
                option: {
                    title: {
                        text: cnNames[k] || k,
                        left: 'center'
                    },
                    tooltip: {
                        trigger: 'item'
                    },
                    legend: {
                        orient: 'vertical',
                        left: 'left'
                    },
                    series: [
                        {
                            name: 'Access From',
                            type: 'pie',
                            radius: '50%',
                            data: v,
                            emphasis: {
                                itemStyle: {
                                    shadowBlur: 10,
                                    shadowOffsetX: 0,
                                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                                }
                            }
                        }
                    ]
                }
            })
        })

        this.showContent = true;

        this.paint();
    }

    async paint(){
        await this.$nextTick();
        this.charts.forEach((c: any)=>{
            if(c.instance) c.instance.dispose;
            c.instance = echarts.init(document.getElementById('chart-'+c.name) as HTMLElement);
            c.instance.setOption(c.option);
        })
    }

    distribution(){
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

        report({ userId: 'A', id: 'distribute_c', custom: null });
        axios.post('http://localhost:8081/distribution', this.form)
        .then(res => {
            if(res.data.code === 0){
                this.$message({
                    message: res.data.message,
                    type: 'success'
                });
                this.process(res.data.data);
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
.distribution{
    padding: 10px;
    &-header{
        align-items: center;
        display: flex;
        padding: 0 10px;
        &-date{
            margin: 0 10px;
        }
    }
    &-content{
      padding: 20px;
    }
}
</style>