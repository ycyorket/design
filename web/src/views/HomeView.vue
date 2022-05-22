<template>
  <div class="home">
    <div v-for="key in pageKeys" @click="goTo(key)" v-show="!shouldDisappear(key)">{{pages[key]}}</div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import report from "report";
 // @ is an alias to /src

@Component({
  components: {
  },
})
export default class HomeView extends Vue {
  @Prop({default: false}) isRegister: boolean = false;

  pages = {
    eventtracking: '创建埋点',
    page: '创建页面',
    statistics: '分析数据'
  }

  pageKeys = Object.keys(this.pages)

  shouldDisappear(key: string){
    return this.isRegister && key === 'statistics';
  }

  created(){
    report({ userId: 'A', id: this.isRegister? 'register_v': 'home_v', custom: null });
  }

  beforeDestroy(){
    report({ userId: 'A', id: this.isRegister? 'register_e': 'home_e', custom: null });
  }

  goTo(url: 'eventtracking' | 'page' | 'statistics'){
    report({ userId: 'A', id: 'entry_c', custom: {
      option: this.pages[url], page:  this.isRegister? '创建入口页': '主页'
    } });
    this.$router.push(url)
  }
}
</script>

<style lang="less">
.home{
  display: flex;
  margin: 50px;
  justify-content: space-around;

  div {
    flex: 1;
    height: 50vh;
    text-align: center;
    line-height: 50vh;
    max-width: 300px;
    margin: 50px;
    border: 2px solid grey;
    border-radius: 10%;
  }

  div:hover {
    font-size: larger;
    background-color: black;
    color: white;
  }
}
</style>
