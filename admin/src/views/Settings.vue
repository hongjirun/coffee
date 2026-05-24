<template>
  <div>
    <div class="page-header">
      <h2>系统设置</h2>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="12">
        <el-card style="margin-bottom: 20px;">
          <template #header><span style="font-weight: 600;">小程序模式切换</span></template>
          <el-form label-width="120px">
            <el-form-item label="正常运营模式">
              <el-switch 
                v-model="settings.normal_mode" 
                active-text="开启"
                inactive-text="关闭"
                @change="handleNormalModeToggle"
              />
              <div style="font-size: 12px; color: #999; margin-top: 8px;">
                开启后：商品可点击下单，显示分享按钮（日常运营使用）
              </div>
            </el-form-item>
            <el-divider />
            <el-form-item label="审核模式">
              <el-switch 
                v-model="settings.review_mode" 
                active-text="开启"
                inactive-text="关闭"
                active-color="#e6a23c"
                @change="handleReviewModeToggle"
              />
              <div style="font-size: 12px; color: #999; margin-top: 8px;">
                开启后：商品点击展示详情页，隐藏下单和分享功能（提交审核前开启）
              </div>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="12">
        <el-card style="margin-bottom: 20px;">
          <template #header><span style="font-weight: 600;">小程序二维码</span></template>
          <div class="qrcode-section">
            <div class="qrcode-item">
              <div class="qrcode-label">微信群聊二维码</div>
              <el-upload
                class="qrcode-uploader"
                :show-file-list="false"
                :before-upload="file => beforeQrcodeUpload('wechat_group', file)"
                accept="image/*"
              >
                <img v-if="qrcodes.wechat_group_qrcode" :src="qrcodes.wechat_group_qrcode" class="qrcode-img" />
                <div v-else class="qrcode-placeholder">
                  <el-icon><Plus /></el-icon>
                  <span>点击上传群二维码</span>
                </div>
              </el-upload>
              <el-button 
                v-if="qrcodes.wechat_group_qrcode" 
                type="danger" 
                size="small" 
                text 
                @click="removeQrcode('wechat_group_qrcode')"
              >
                删除
              </el-button>
            </div>
            
            <el-divider />
            
            <div class="qrcode-item">
              <div class="qrcode-label">微信支付二维码</div>
              <el-upload
                class="qrcode-uploader"
                :show-file-list="false"
                :before-upload="file => beforeQrcodeUpload('wechat_pay', file)"
                accept="image/*"
              >
                <img v-if="qrcodes.wechat_pay_qrcode" :src="qrcodes.wechat_pay_qrcode" class="qrcode-img" />
                <div v-else class="qrcode-placeholder">
                  <el-icon><Plus /></el-icon>
                  <span>点击上传支付二维码</span>
                </div>
              </el-upload>
              <el-button 
                v-if="qrcodes.wechat_pay_qrcode" 
                type="danger" 
                size="small" 
                text 
                @click="removeQrcode('wechat_pay_qrcode')"
              >
                删除
              </el-button>
            </div>
          </div>
        </el-card>

        <el-card>
          <template #header><span style="font-weight: 600;">关于系统</span></template>
          <div class="about-info">
            <div class="about-item">
              <span class="about-icon">☕</span>
              <div>
                <div class="about-title">咖啡角</div>
                <div class="about-sub">后台管理系统 v1.0.0</div>
              </div>
            </div>
            <el-divider />
            <div class="info-list">
              <div class="info-row">
                <span>技术栈</span>
                <span>Vue3 + Element Plus + Node.js</span>
              </div>
              <div class="info-row">
                <span>数据库</span>
                <span>MySQL 8.0</span>
              </div>
              <div class="info-row">
                <span>API文档</span>
                <a href="/api/health" target="_blank" style="color: #6b4226;">访问API健康检查</a>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { authApi, settingsApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const authStore = useAuthStore()
const pwdFormRef = ref()
const pwdLoading = ref(false)
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })

// 用户名修改
const usernameFormRef = ref()
const usernameLoading = ref(false)
const usernameForm = reactive({ username: authStore.admin?.username || '' })
const usernameRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ]
}

async function handleChangeUsername() {
  await usernameFormRef.value.validate()
  usernameLoading.value = true
  try {
    const res = await authApi.updateUsername({ username: usernameForm.username })
    authStore.updateAdmin({ username: res.data.username })
    ElMessage.success('用户名修改成功')
  } finally {
    usernameLoading.value = false
  }
}
const pwdRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, val, cb) => {
        if (val !== pwdForm.newPassword) cb(new Error('两次密码不一致'))
        else cb()
      },
      trigger: 'blur'
    }
  ]
}

async function handleChangePwd() {
  await pwdFormRef.value.validate()
  pwdLoading.value = true
  try {
    await authApi.updatePassword({ oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword })
    ElMessage.success('密码修改成功，请重新登录')
    Object.assign(pwdForm, { oldPassword: '', newPassword: '', confirmPassword: '' })
  } finally {
    pwdLoading.value = false
  }
}

// 二维码管理
const qrcodes = reactive({
  wechat_group_qrcode: '',
  wechat_pay_qrcode: ''
})

// 功能开关设置
const settings = reactive({
  normal_mode: true,
  review_mode: false
})

async function handleNormalModeToggle(val) {
  try {
    // 互斥：开启正常模式则关闭审核模式
    settings.review_mode = !val
    await settingsApi.update({
      normal_mode: val ? 'true' : 'false',
      review_mode: val ? 'false' : 'true'
    })
    ElMessage.success(val ? '已切换为正常运营模式' : '正常模式已关闭')
  } catch {
    ElMessage.error('设置保存失败')
  }
}

async function handleReviewModeToggle(val) {
  try {
    // 互斥：开启审核模式则关闭正常模式
    settings.normal_mode = !val
    await settingsApi.update({
      review_mode: val ? 'true' : 'false',
      normal_mode: val ? 'false' : 'true'
    })
    ElMessage.success(val ? '已切换为审核模式，请重新编译小程序' : '审核模式已关闭')
  } catch {
    ElMessage.error('设置保存失败')
  }
}

async function loadQrcodes() {
  try {
    const res = await settingsApi.getAll()
    Object.assign(qrcodes, res.data)
    // 加载模式开关设置
    if (res.data.normal_mode !== undefined) {
      settings.normal_mode = res.data.normal_mode !== 'false'
    }
    if (res.data.review_mode !== undefined) {
      settings.review_mode = res.data.review_mode === 'true'
    }
  } catch {}
}

async function beforeQrcodeUpload(type, file) {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
    return false
  }
  
  try {
    const res = await settingsApi.uploadQrcode(type, file)
    qrcodes[type === 'wechat_group' ? 'wechat_group_qrcode' : 'wechat_pay_qrcode'] = res.data.url
    ElMessage.success('上传成功')
  } catch {
    ElMessage.error('上传失败')
  }
  return false // 阻止默认上传
}

async function removeQrcode(key) {
  await ElMessageBox.confirm('确定删除该二维码吗？', '提示', { type: 'warning' })
  try {
    await settingsApi.uploadQrcode(key === 'wechat_group_qrcode' ? 'wechat_group' : 'wechat_pay', '')
    qrcodes[key] = ''
    ElMessage.success('删除成功')
  } catch {}
}

onMounted(() => {
  loadQrcodes()
})
</script>

<style scoped>
.about-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}
.about-icon { font-size: 48px; }
.about-title { font-size: 18px; font-weight: 700; color: #4a2c0a; }
.about-sub { font-size: 12px; color: #999; }

.info-list { display: flex; flex-direction: column; gap: 12px; }
.info-row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
.info-row span:first-child { color: #999; }

/* 二维码上传样式 */
.qrcode-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.qrcode-item {
  text-align: center;
}

.qrcode-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.qrcode-uploader {
  display: inline-block;
  cursor: pointer;
}

.qrcode-img {
  width: 200px;
  height: 200px;
  object-fit: contain;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
}

.qrcode-placeholder {
  width: 200px;
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  background: #fafafa;
  color: #999;
  font-size: 14px;
}

.qrcode-placeholder:hover {
  border-color: #6b4226;
  color: #6b4226;
}

.qrcode-placeholder .el-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .qrcode-img,
  .qrcode-placeholder {
    width: 150px;
    height: 150px;
  }
}
</style>
