<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="coffee-beans"></div>
    </div>
    <div class="login-card">
      <div class="login-logo">
        <span class="coffee-icon">☕</span>
        <h1>咖啡角后台管理</h1>
        <p>后台管理系统</p>
      </div>
      <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-button
          type="primary"
          size="large"
          :loading="loading"
          class="login-btn"
          @click="handleLogin"
        >
          登 录
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref()
const loading = ref(false)

const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  await formRef.value.validate()
  loading.value = true
  try {
    await authStore.login(form.username, form.password)
    ElMessage.success('登录成功，欢迎回来！')
    router.push('/dashboard')
  } catch (err) {
    const msg = err.response?.data?.message || err.message || '登录失败，请检查网络或账号密码'
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2c1a0e 0%, #6b4226 50%, #c4956a 100%);
  position: relative;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  inset: 0;
  opacity: 0.05;
  background-image: radial-gradient(circle, #fff 1px, transparent 1px);
  background-size: 30px 30px;
}

.login-card {
  background: rgba(255, 255, 255, 0.97);
  border-radius: 20px;
  padding: 48px 44px;
  width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

.login-logo {
  text-align: center;
  margin-bottom: 36px;
}

.coffee-icon {
  font-size: 56px;
  display: block;
  margin-bottom: 8px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.login-logo h1 {
  font-size: 24px;
  font-weight: 700;
  color: #4a2c0a;
  margin-bottom: 4px;
}

.login-logo p {
  font-size: 13px;
  color: #999;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  letter-spacing: 4px;
  background: linear-gradient(135deg, #6b4226, #c4956a);
  border: none;
  border-radius: 10px;
  margin-top: 8px;
}
.login-btn:hover {
  background: linear-gradient(135deg, #4a2c0a, #6b4226);
}
</style>
