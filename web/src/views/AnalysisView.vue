<template>
    <el-row>
        <el-col :span="5">
            <el-menu default-active="3" class="vertical-menu" @select="onSelect">
                <el-menu-item index="1">
                    <i class="el-icon-s-order"></i>
                    <span slot="title">日志分析</span>
                </el-menu-item>
                <el-menu-item index="2">
                    <i class="el-icon-timer"></i>
                    <span slot="title">时序事件分析</span>
                </el-menu-item>
                <el-menu-item index="3">
                    <i class="el-icon-s-data"></i>
                    <span slot="title">事件分布分析</span>
                </el-menu-item>
                <el-menu-item index="4">
                    <i class="el-icon-copy-document"></i>
                    <span slot="title">路径分析</span>
                </el-menu-item>
            </el-menu>
        </el-col>
        <el-col :span="15">
            <LogAnalysis v-if="index === 1"/>
            <SequentialAnalysis v-if="index === 2"/>
            <DistributionAnalysis v-if="index === 3"/>
            <PathAnalysis v-if="index === 4"/>
        </el-col>
    </el-row>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import axios from 'axios';
import report from 'report';
import LogAnalysis from '../components/LogAnalysis.vue';
import SequentialAnalysis from '../components/SequentialAnalysis.vue';
import DistributionAnalysis from '../components/DistributionAnalysis.vue';
import PathAnalysis from '../components/PathAnalysis.vue';

@Component({
  components: { LogAnalysis, SequentialAnalysis, DistributionAnalysis, PathAnalysis },
})
export default class AnalysisView extends Vue {
    index = 3

    onSelect(index: number, indexPath: any){
        this.index = Number(index);
    }

    created(){
        report({ userId: 'A', id: 'analysis_v', custom: null });
    }

    beforeDestroy(){
        report({ userId: 'A', id: 'analysis_e', custom: null });
    }
}
</script>