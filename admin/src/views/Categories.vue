<template>
  <div>
    <div class="page-header">
      <h2>分类管理</h2>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增分类</el-button>
    </div>

    <el-card>
      <!-- 桌面端表格 -->
      <el-table :data="categories" v-loading="loading" row-key="id" class="desktop-table">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="分类名称" />
        <el-table-column prop="sort_order" label="排序" width="80" />
        <el-table-column prop="is_active" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="openDialog(row)">编辑</el-button>
            <el-popconfirm title="确定删除该分类吗？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button text type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 移动端卡片 -->
      <div class="mobile-cards" v-loading="loading">
        <div v-for="category in categories" :key="category.id" class="category-card">
          <div class="category-main">
            <div class="category-id">#{{ category.id }}</div>
            <div class="category-name">{{ category.name }}</div>
            <div class="category-meta">
              <span>排序: {{ category.sort_order }}</span>
              <el-tag :type="category.is_active ? 'success' : 'info'" size="small">
                {{ category.is_active ? '启用' : '禁用' }}
              </el-tag>
            </div>
          </div>
          <div class="category-actions">
            <el-button text type="primary" size="small" @click="openDialog(category)">编辑</el-button>
            <el-popconfirm title="确定删除该分类吗？" @confirm="handleDelete(category.id)">
              <template #reference>
                <el-button text type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑分类' : '新增分类'" width="440px" :fullscreen="isMobile">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="如：拿铁系列" />
        </el-form-item>
        <el-form-item label="排序权重" prop="sort_order">
          <el-input-number v-model="form.sort_order" :min="0" :max="999" />
          <span style="margin-left: 8px; color: #999; font-size: 12px;">数字越小越靠前</span>
        </el-form-item>
        <el-form-item label="状态" prop="is_active">
          <el-switch v-model="form.is_active" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { categoryApi } from '@/api'
import { ElMessage } from 'element-plus'

// 移动端检测
const isMobile = ref(window.innerWidth <= 768)
function checkMobile() { isMobile.value = window.innerWidth <= 768 }
onMounted(() => window.addEventListener('resize', checkMobile))
onUnmounted(() => window.removeEventListener('resize', checkMobile))

const categories = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref(null)
const formRef = ref()

const form = reactive({ name: '', sort_order: 0, is_active: 1 })
const rules = { name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }] }

async function loadData() {
  loading.value = true
  try {
    const res = await categoryApi.getAll()
    categories.value = res.data
  } finally {
    loading.value = false
  }
}

function openDialog(row = null) {
  editingId.value = row?.id || null
  if (row) {
    Object.assign(form, { name: row.name, sort_order: row.sort_order, is_active: row.is_active })
  } else {
    Object.assign(form, { name: '', sort_order: 0, is_active: 1 })
  }
  dialogVisible.value = true
}

async function handleSave() {
  await formRef.value.validate()
  saving.value = true
  try {
    if (editingId.value) {
      await categoryApi.update(editingId.value, form)
      ElMessage.success('更新成功')
    } else {
      await categoryApi.create(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

async function handleDelete(id) {
  try {
    await categoryApi.remove(id)
    ElMessage.success('删除成功')
    loadData()
  } catch {}
}

onMounted(loadData)
</script>

<style scoped>
/* 桌面端/移动端切换 */
.desktop-table { display: table; }
.mobile-cards { display: none; }

/* 移动端卡片样式 */
.category-card {
  background: #fafafa;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #f0e6da;
}

.category-main {
  margin-bottom: 12px;
}

.category-id {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.category-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.category-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #666;
}

.category-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0e6da;
}

/* 移动端响应式 */
@media (max-width: 768px) {
  .desktop-table { display: none !important; }
  .mobile-cards { display: block; }
}
</style>
