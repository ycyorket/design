<template>
  <HomeView :isRegister="true"/>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import HomeView from './HomeView.vue'

@Component({
  components: { HomeView },
})
export default class RegisterView extends Vue {
}
</script>