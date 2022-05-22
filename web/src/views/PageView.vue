<template>
    <div class="create-page">
        <el-form class="create-page-form" :rules="rules" ref="form" :model="form" label-width="120px">
            <el-form-item label="页面名称" prop="name" required>
                <el-input v-model="form.name" maxlength="50" show-word-limit></el-input>
            </el-form-item>
            <el-form-item label="页面网址" prop="url">
                <el-input v-model="form.url" maxlength="50" show-word-limit></el-input>
            </el-form-item>
            <el-form-item label="页面编号" prop="number" required>
                <el-input v-model="form.number" maxlength="30" show-word-limit></el-input>
            </el-form-item>
            <el-form-item label="管理员账号" prop="admin" required>
                <el-input v-model="form.admin" maxlength="16" show-word-limit></el-input>
            </el-form-item>
            <el-form-item label="管理员密钥" prop="password" required>
                <el-input v-model="form.password" maxlength="16" show-word-limit show-password></el-input>
            </el-form-item>
            <el-form-item label="页面描述" prop="description">
                <el-input type="textarea" v-model="form.description" maxlength="80"></el-input>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="onSubmit('form')">创建页面</el-button>
                <el-button @click="onReset('form')">重置</el-button>
                <el-button @click="onReturn">返回</el-button>
            </el-form-item>
        </el-form>
        <el-upload class="create-page-upload" drag action="localhost:8081/posts/">
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
export default class PageView extends Vue {
    form = {
        name: null,
        url: null,
        number: null,
        admin: null,
        password: null,
        description: null,
    }

    rules = {
        name: [{required: true, message: '请输入页面名称', trigger: 'blur'}],
        number: [{required: true, message: '请输入页面编号', trigger: 'blur'}],
        admin: [{required: true, message: '请输入管理员账号', trigger: 'blur'}],
        password: [{required: true, message: '请输入管理员密钥', trigger: 'blur'}],
    }

    created(){
        report({ userId: 'A', id: 'page_v', custom: null });
    }

    beforeDestroy(){
        report({ userId: 'A', id: 'page_e', custom: null });
    }

    onSubmit(form: string){
        (this.$refs[form] as any).validate((valid: boolean) => {
            console.log(this.form);
            if (valid) {
                report({ userId: 'A', id: 'page_c', custom: null });
                axios.post('http://localhost:8081/addPage', this.form)
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

    onReset(form: string){
        (this.$refs[form] as any).resetFields();
    }

    onReturn(){
        this.$router.push('/register')
    }
}
</script>

<style lang="less">
.create-page{
    margin: 40px;
    display: flex;
    &-form{
        flex: 2;
    }
    &-upload{
        flex: 1;
    }
}
</style>