<template>
    <div class="path">
        <div class="path-header">
            <el-col :span="10">
                <el-input v-model="form.search" :placeholder="placeholder" suffix-icon="el-button-search"/>
            </el-col>
            <el-button type="primary" @click="path">搜索</el-button>
            <el-date-picker
                class="path-header-date"
                v-model="form.from"
                align="left"
                type="date"
                placeholder="选择起始日期"
                :picker-options="pickerOptions">
            </el-date-picker>
            -
            <el-date-picker
                class="path-header-date"
                v-model="form.to"
                align="right"
                type="date"
                placeholder="选择结束日期"
                :picker-options="pickerOptions">
            </el-date-picker>
        </div>
        <div class="path-content" v-show="showContent">
            <span>{{pageInfo.name}}来源页</span>
            <div ref="referChart" style="margin: 10px; width: 700px; height: 500px;"></div>
            <span>{{pageInfo.name}}去向页</span>
            <div ref="nextChart" style="margin: 10px; width: 700px; height: 500px;"></div>
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
export default class pathAnalysis extends Vue {
    showContent = false;

    referChart: any = null;

    nextChart: any = null;

    handling = false;

    pageInfo = {
      name: '未知页'
    };

    @Watch("chartMode")
    repaint(){
      if(!this.handling)
        this.paint();
    }

    get placeholder(){
      return `请输入页面编号`
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

    referOption: any = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        top: '5%',
        left: 'center'
      },
      series: [
        {
          name: '来自',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '40',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: [
          ]
        }
      ]
    }

    nextOption: any = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        top: '5%',
        left: 'center'
      },
      series: [
        {
          name: '去往',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '40',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: [
          ]
        }
      ]
    }

    form = {
        search: '',
        from: null,
        to: null
    }

    process(data: any){
      this.handling = true;

      let between: any[] = [];
      let index = 0;
      const r = this.referOption;
      const n = this.nextOption;
      const statistics = {
        refer: {},
        next: {}
      }
      const addToObject = (key: string, obj: any) => {
        if(obj[key]) obj[key] += 1;
        else obj[key] = 1;
      }

      data.forEach((e: any, i: number)=>{
        if(e.event_type === 'EXIT' && e.page_number !== this.form.search)
          return;
        between[index] = {
          start: e,
          data: [],
          end: null
        };
        i++;
        while(i < data.length){
          if(data[i].page_number === e.page_number){
            between[index].end = data[i]
            if(data[i].id === e.id){
              addToObject('未知页',statistics.next)
              addToObject('未知页',statistics.refer)
            }
            break;
          }
          between[index].data.push(data[i])
          i++;
        }
        index += 1;
      })
      between = between.filter(e => e.end && e.start.id !== e.end.id)
      between.forEach(b => {
        b.data.forEach((e: any) => {
          addToObject(e.page_name + '|' + e.page_number, e.event_type === 'VIEW'? statistics.next: statistics.refer)
        })
      })
      const arrayify = (obj: any) => {
        const res: any[] = [];
        Object.entries(obj).forEach(([name, value])=>{
          res.push({name, value})
        })
        return res;
      }
      r.series[0].data = arrayify(statistics.refer);
      n.series[0].data = arrayify(statistics.next);

      this.handling = false;
      this.paint();
    }

    paint(){
      if(this.referChart)
        this.referChart.dispose();
      this.referChart = echarts.init(this.$refs.referChart as HTMLElement);
      this.referChart.setOption(this.referOption);

      if(this.nextChart)
        this.nextChart.dispose();
      this.nextChart = echarts.init(this.$refs.nextChart as HTMLElement);
      this.nextChart.setOption(this.nextOption);
    }

    path(){
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

        report({ userId: 'A', id: 'path_c', custom: null });
        axios.post('http://localhost:8081/path', this.form)
        .then(res => {
            if(res.data.code >= 0)
                this.pageInfo = res.data.pageInfo;
            if(res.data.code === 0){
                this.$message({
                    message: res.data.message,
                    type: 'success'
                });
                this.showContent = true;
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
.path{
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
