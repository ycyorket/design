<template>
    <div class="sequence">
        <div class="sequence-header">
            <el-col :span="10">
                <el-input v-model="form.search" :placeholder="placeholder" suffix-icon="el-button-search"/>
            </el-col>
            <el-button type="primary" @click="sequence">搜索</el-button>
            <el-col :span="4">
                <el-radio v-model="form.type" label="event">埋点编号</el-radio>
            </el-col>
            <el-col :span="4">
                <el-radio v-model="form.type" label="page">页面编号</el-radio>
            </el-col>
            <el-date-picker
                class="sequence-header-date"
                v-model="form.from"
                align="left"
                type="date"
                placeholder="选择起始日期"
                :picker-options="pickerOptions">
            </el-date-picker>
            -
            <el-date-picker
                class="sequence-header-date"
                v-model="form.to"
                align="right"
                type="date"
                placeholder="选择结束日期"
                :picker-options="pickerOptions">
            </el-date-picker>
        </div>
        <div class="sequence-content" v-show="showContent">
            <el-tabs v-model="chartMode">
                <el-tab-pane label="事件触发量" name="log"></el-tab-pane>
                <el-tab-pane label="浏览量" name="view" :disabled="!useView"></el-tab-pane>
            </el-tabs>
            <div ref="chart" style="margin: 10px; width: 700px; height: 500px;"></div>
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
export default class sequenceAnalysis extends Vue {
    showContent = false;

    showType = 'table';

    logData = null;

    viewData = null;

    handling = false;

    chart: any = null;

    chartMode = 'log';

    useView = false;

    @Watch("chartMode")
    repaint(){
      if(!this.handling)
        this.paint();
    }

    logOption: any = {
      title: {
        text: '事件分析'
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: []
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      toolbox: {
        feature: {
          saveAsImage: {}
        }
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: []
      },
      yAxis: {
        type: 'value'
      },
      series: [
      ]
    };

    viewOption: any = {
      xAxis: {
        type: 'category',
        data: []
      },
      yAxis: {
        type: 'value'
      },
      series: []
    };

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

    process(rawdata: any){
      this.chartMode = 'log';
      this.handling = true;

      const {log, view} = rawdata;
      this.useView = !!view;
      const v = this.viewOption;
      const o = this.logOption;

      const events = Array.from(new Set(log.map((e: any) => e.id)))
      const today = dayjs();
      const days: any[] = [];
      const data: any[][] = [[], [], [], [], [], [], []]
      const statistics: any[] = events.map(e => {
        return {
          name: e,
          type: 'line',
          stack: 'Total',
          data: []
        }
      });
      for(let number = 6; number >= 0; number --){
        days.push(today.subtract(number, 'day'))
      }
      log.forEach((e: any) =>{
        const time = dayjs(e.timestamp)
        for(let i=0; i<=6; i++){
          if(days[i].isSame(time, 'day')){
            data[i].push(e)
          }
        }
      })
      data.forEach((datum: any, index: any) => {
         events.forEach((name: any, i: any) => {
          statistics[i].data[index] = datum.filter((e: any) => name === e.id).length
        })
      })
      console.log(statistics)
      o.legend.data = events as any[];
      o.xAxis.data = days.map(day => day.format('M月D日'))
      o.series = statistics;

      if(view){
        this.viewData = view;
        const events = Array.from(new Set(view.map((e: any) => e.id)))
        const data: any[] = [0, 0, 0, 0, 0, 0, 0];
        view.forEach((e: any) =>{
          const time = dayjs(e.timestamp)
          for(let i=0; i<=6; i++){
            if(days[i].isSame(time, 'day')){
              data[i] += 1;
            }
          }
        })
        this.viewOption.series = [{
          data, 
          type: 'bar', 
          label: {
            show: true,
            position: 'inside'
        }}];
        this.viewOption.xAxis.data = days.map(day => day.format('M月D日'))
      }

      this.handling = false;
      this.paint();
    }

    paint(){
      if(this.chart)
        this.chart.dispose();
      this.chart = echarts.init(this.$refs.chart as HTMLElement);
      this.chart.setOption(this.chartMode === 'log'? this.logOption: this.viewOption);
    }

    sequence(){
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

        report({ userId: 'A', id: 'sequence_c', custom: null });
        axios.post('http://localhost:8081/sequence', this.form)
        .then(res => {
            if(res.data.code === 0){
                this.$message({
                    message: res.data.message,
                    type: 'success'
                });
                this.showContent = true;
                this.process(res.data);
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
.sequence{
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
