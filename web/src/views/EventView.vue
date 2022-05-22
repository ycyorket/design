<template>
    <div class="create-event">
        <el-form class="create-event-form" :rules="rules" ref="form" :model="form" label-width="120px">
            <el-form-item label="埋点名称" prop="name" required>
                <el-col :span="15">
                    <el-input v-model="form.name" maxlength="25" show-word-limit></el-input>
                </el-col>
            </el-form-item>
            <el-form-item label="埋点编号" prop="number" required>
                <el-col :span="15">
                    <el-input v-model="form.number" maxlength="30" show-word-limit></el-input>
                </el-col>
            </el-form-item>
            <el-form-item label="所在页面编号" prop="pageNumber" required>
                <el-col :span="10">
                    <el-input v-model="form.pageNumber" maxlength="30" show-word-limit></el-input>
                </el-col>
            </el-form-item>
            <el-form-item label="埋点事件类型" prop="eventType" required>
                <el-col :span="5">
                    <el-select v-model="form.eventType" placeholder="请选择" class="create-event-select">
                        <el-option v-for="item in eventTypeOptions" :key="item.value" :label="item.label" :value="item.value"/>
                    </el-select>
                </el-col>
            </el-form-item>
            <el-form-item label="管理员账号" prop="admin" required>
                <el-col :span="10">
                    <el-input v-model="form.admin" maxlength="16" show-word-limit></el-input>
                </el-col>
            </el-form-item>
            <el-form-item label="管理员密钥" prop="password" required>
                <el-col :span="10">
                    <el-input v-model="form.password" maxlength="16" show-word-limit show-password></el-input>
                </el-col>
            </el-form-item>
            <el-form-item
                v-for="(custom, index) in form.custom"
                :label="'自定义参数' + (index + 1)"
                :key="custom.type + index"
                :prop="'custom.' + index + '.name'"
                :rules="[{ required: true, message: '自定义参数名不能为空', trigger: 'change' }]"
            >
                <el-col :span="10">
                    <el-input v-model="custom.name" maxlength="16" show-word-limit></el-input>
                </el-col>
                <el-col :span="2">类型</el-col>
                <el-col :span="5">
                    <el-select v-model="custom.type" placeholder="请选择" class="create-event-select">
                        <el-option v-for="item in customTypeOptions" :key="item.value" :label="item.label" :value="item.value"/>
                    </el-select>
                </el-col>
                <el-col :span="3">
                    <el-button type="text" @click.prevent="addCustom" icon="el-icon-plus"/>
                    <el-button type="text" @click.prevent="removeCustom(custom)" icon="el-icon-close"/>
                </el-col>
            </el-form-item>
            <el-form-item label="埋点描述" prop="description">
                <el-input type="textarea" maxlength="80" show-word-limit v-model="form.description"></el-input>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="onSubmit('form')">创建埋点</el-button>
                <el-button @click="addCustom">增加自定义参数</el-button>
                <el-button @click="onReset('form')">重置</el-button>
                <el-button @click="onReturn">返回</el-button>
            </el-form-item>
        </el-form>
        <el-upload class="create-event-upload" drag action="localhost:8081/posts/">
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">将图片拖到此处，或<em>点击上传</em></div>
            <div class="el-upload__tip" slot="tip">只能上传jpg/png文件，且不超过500kb</div>
        </el-upload>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import axios from 'axios';
import report from 'report';

@Component({
  components: { },
})
export default class EventView extends Vue {
    form = {
        name: null,
        pageNumber: null,
        number: null,
        eventType: null,
        admin: null,
        custom: [{ name: null, type: 'string' }],
        password: null,
        description: null,
    }

    rules = {
        name: [{required: true, message: '请输入埋点名称', trigger: 'blur'}],
        pageNumber: [{required: true, message: '请输入所在页面编号', trigger: 'blur'}],
        number: [{required: true, message: '请输入埋点编号', trigger: 'blur'}],
        admin: [{required: true, message: '请输入管理员账号', trigger: 'blur'}],
        eventType: [{required: true, message: '请选择事件类型', trigger: 'blur'}],
        password: [{required: true, message: '请输入管理员密钥', trigger: 'blur'}],
    }

    eventTypeOptions = [{
        label: '点击事件',
        value: 'CLICK'
    }, {
        label: '曝光事件',
        value: 'VIEW'
    }, {
        label: '退出事件',
        value: 'EXIT'
    }]

    customTypeOptions =  [{
        label: '数值',
        value: 'number'
    }, {
        label: '字符串',
        value: 'string'
    }, {
        label: '布尔值',
        value: 'boolean'
    }]
    
    created(){
        report({ userId: 'A', id: 'event_v', custom: null });
    }

    beforeDestroy(){
        report({ userId: 'A', id: 'event_e', custom: null });
    }

    onSubmit(form: string){
        (this.$refs[form] as any).validate((valid: boolean) => {
            console.log(this.form);
            if (valid) {
                report({ userId: 'A', id: 'event_c', custom: null });
                axios.post('http://localhost:8081/addEvent', this.form)
                .then(res => {
                    if(res.data.code === 0){
                        this.$message({
                            message: res.data.message,
                            type: 'success'
                        });
                        this.$router.push('home')
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
            } else {
                this.$message({
                    message: '请填写必填的表单项',
                    type: 'warning'
                });
                return false;
            }
        });
    }

    removeCustom(item: never) {
        const index = this.form.custom.indexOf(item)
        if (index !== -1)
          this.form.custom.splice(index, 1)
    }

    addCustom() {
        if(this.form.custom.length >= 3)
            this.$message({ message: '至多添加三个自定义参数', type: 'warning' });
        else
            this.form.custom.push({ name: null, type: 'string' });
    }

    onReset(form: string){
        (this.$refs[form] as any).resetFields();
    }

    onReturn(){
        this.$router.push('/register')
    }
}
</script>

<style lang="less">
.create-event{
    margin: 50px;
    display: flex;
    &-form{
        flex: 2;
    }
    &-upload{
        flex: 1;
    }
}
.create-event-select{
    width: 100%;
}
</style>