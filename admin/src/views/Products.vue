<template>
  <div>
    <div class="page-header">
      <h2>商品管理</h2>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增商品</el-button>
    </div>

    <!-- 筛选栏 -->
    <el-card class="filter-bar">
      <el-row :gutter="16" align="middle">
        <el-col :xs="24" :sm="12" :md="6" style="margin-bottom: 8px;">
          <el-select v-model="filterCategory" placeholder="选择分类" clearable @change="loadData" style="width: 100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <el-input v-model="keyword" placeholder="搜索商品名称..." clearable :prefix-icon="Search" @input="loadData" />
        </el-col>
      </el-row>
    </el-card>

    <!-- 商品列表 -->
    <el-card>
      <!-- 桌面端表格 -->
      <el-table :data="products" v-loading="loading" class="desktop-table">
        <el-table-column label="商品图片" width="80">
          <template #default="{ row }">
            <el-image
              :src="row.image || '/placeholder.png'"
              style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover;"
              fit="cover"
            >
              <template #error><div class="img-placeholder">☕</div></template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" />
        <el-table-column prop="category_name" label="分类" width="100" />
        <el-table-column prop="base_price" label="基础价格" width="100">
          <template #default="{ row }">¥{{ row.base_price }}</template>
        </el-table-column>
        <el-table-column label="规格" width="120">
          <template #default="{ row }">
            <el-tag size="small" v-if="row.size_options?.length">{{ row.size_options.length }}个规格</el-tag>
            <span v-else style="color: #ccc;">无</span>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="90">
          <template #default="{ row }">
            <el-switch
              v-model="row.is_active"
              :active-value="1"
              :inactive-value="0"
              @change="handleToggle(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="openDialog(row)">编辑</el-button>
            <el-popconfirm title="确定删除该商品吗？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button text type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 移动端卡片 -->
      <div class="mobile-cards" v-loading="loading">
        <div v-for="product in products" :key="product.id" class="product-card">
          <div class="product-main">
            <el-image
              :src="product.image || '/placeholder.png'"
              class="product-img"
              fit="cover"
            >
              <template #error><div class="img-placeholder">☕</div></template>
            </el-image>
            <div class="product-info">
              <div class="product-name">{{ product.name }}</div>
              <div class="product-meta">
                <span class="product-category">{{ product.category_name }}</span>
                <span class="product-price">¥{{ product.base_price }}</span>
              </div>
              <div class="product-tags">
                <el-tag size="small" v-if="product.size_options?.length">{{ product.size_options.length }}个规格</el-tag>
                <el-tag size="small" :type="product.is_active ? 'success' : 'info'">{{ product.is_active ? '上架' : '下架' }}</el-tag>
              </div>
            </div>
          </div>
          <div class="product-actions">
            <el-switch
              v-model="product.is_active"
              :active-value="1"
              :inactive-value="0"
              @change="handleToggle(product)"
              size="small"
            />
            <div class="action-btns">
              <el-button text type="primary" size="small" @click="openDialog(product)">编辑</el-button>
              <el-popconfirm title="确定删除该商品吗？" @confirm="handleDelete(product.id)">
                <template #reference>
                  <el-button text type="danger" size="small">删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>
        </div>
      </div>

      <div class="pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="limit"
          :total="total"
          layout="total, prev, pager, next"
          @change="loadData"
        />
      </div>
    </el-card>

    <!-- 商品表单弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑商品' : '新增商品'"
      width="760px"
      :fullscreen="isMobile"
      :close-on-click-modal="false"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="商品名称" prop="name">
              <el-input v-model="form.name" placeholder="如：燕麦拿铁" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="所属分类" prop="category_id">
              <el-select v-model="form.category_id" placeholder="请选择分类" style="width: 100%">
                <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="基础价格" prop="base_price">
              <el-input-number v-model="form.base_price" :min="0" :precision="2" :step="1" style="width: 100%">
                <template #prefix>¥</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="排序权重">
              <el-input-number v-model="form.sort_order" :min="0" :max="999" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="商品描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="商品描述..." />
        </el-form-item>

        <el-form-item label="商品图片">
          <div style="display:flex;gap:16px;flex-wrap:wrap;">
            <div v-for="img in imageFields" :key="img.field" class="img-upload-block">
              <div class="img-upload-label">{{ img.label }}</div>
              <el-upload
                accept="image/*"
                :show-file-list="false"
                :before-upload="beforeUpload"
                :http-request="(opt) => handleUploadField(opt, img.field)"
              >
                <div class="upload-btn" v-if="!form[img.field]">
                  <el-icon :size="28"><Plus /></el-icon>
                  <span>{{ img.label }}</span>
                </div>
                <div class="img-preview" v-else>
                  <img :src="form[img.field]" />
                  <div class="img-overlay" @click.stop="form[img.field] = ''">
                    <el-icon><Delete /></el-icon>
                  </div>
                </div>
              </el-upload>
            </div>
          </div>
          <div style="margin-top:6px;color:#999;font-size:12px;">商品图：列表封面图 &nbsp;|&nbsp; 中杯图/大杯图：详情页随杯型切换 &nbsp;|&nbsp; 包装图：固定展示</div>
        </el-form-item>

        <!-- 规格配置 -->
        <el-divider content-position="left">
          <span style="color: #6b4226; font-weight: 600;">☕ 规格选项配置</span>
        </el-divider>

        <el-row :gutter="20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="糖度选项">
              <div class="tag-editor">
                <el-tag
                  v-for="(tag, i) in form.sugar_options"
                  :key="i"
                  closable
                  @close="form.sugar_options.splice(i, 1)"
                  style="margin: 2px"
                >{{ tag }}</el-tag>
                <el-input
                  v-if="sugarInputVisible"
                  ref="sugarInputRef"
                  v-model="sugarInputVal"
                  size="small"
                  style="width: 80px; margin: 2px"
                  @keyup.enter="addSugar"
                  @blur="addSugar"
                />
                <el-button v-else size="small" @click="sugarInputVisible = true; $nextTick(()=>sugarInputRef?.focus())">
                  + 添加
                </el-button>
              </div>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="冰度选项">
              <div class="tag-editor">
                <el-tag
                  v-for="(tag, i) in form.ice_options"
                  :key="i"
                  closable
                  type="info"
                  @close="form.ice_options.splice(i, 1)"
                  style="margin: 2px"
                >{{ tag }}</el-tag>
                <el-input
                  v-if="iceInputVisible"
                  ref="iceInputRef"
                  v-model="iceInputVal"
                  size="small"
                  style="width: 80px; margin: 2px"
                  @keyup.enter="addIce"
                  @blur="addIce"
                />
                <el-button v-else size="small" @click="iceInputVisible = true; $nextTick(()=>iceInputRef?.focus())">
                  + 添加
                </el-button>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 杯型规格（写死中杯/大杯，只开放加价修改） -->
        <el-form-item label="杯型规格">
          <div class="size-editor">
            <div class="size-item">
              <span class="size-fixed-name">中杯 360ml</span>
              <el-input-number v-model="form.size_options[0].price" :min="0" :precision="2" :step="1" size="small" style="width:130px">
                <template #prefix>+¥</template>
              </el-input-number>
              <span style="color:#999;font-size:12px;">加价（0=不加价）</span>
            </div>
            <div class="size-item">
              <span class="size-fixed-name">大杯 500ml</span>
              <el-input-number v-model="form.size_options[1].price" :min="0" :precision="2" :step="1" size="small" style="width:130px">
                <template #prefix>+¥</template>
              </el-input-number>
              <span style="color:#999;font-size:12px;">加价（0=不加价）</span>
            </div>
          </div>
        </el-form-item>

        <!-- 加料选项（带价格） -->
        <el-form-item label="加料选项">
          <div class="size-editor">
            <div v-for="(a, i) in form.addon_options" :key="i" class="size-item">
              <el-input v-model="a.name" placeholder="加料名" size="small" style="width: 90px" />
              <el-input v-model.number="a.price" placeholder="价格" size="small" style="width: 80px">
                <template #prefix>+¥</template>
              </el-input>
              <el-button :icon="Delete" size="small" text type="danger" @click="form.addon_options.splice(i,1)" />
            </div>
            <el-button size="small" @click="form.addon_options.push({ name: '', price: 0 })">+ 添加加料</el-button>
          </div>
        </el-form-item>

        <el-form-item label="上架状态">
          <el-switch v-model="form.is_active" :active-value="1" :inactive-value="0" active-text="上架" inactive-text="下架" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存商品</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { Plus, Search, Delete } from '@element-plus/icons-vue'
import { productApi, categoryApi } from '@/api'
import { ElMessage } from 'element-plus'

// 移动端检测
const isMobile = ref(window.innerWidth <= 768)
function checkMobile() { isMobile.value = window.innerWidth <= 768 }
onMounted(() => window.addEventListener('resize', checkMobile))
onUnmounted(() => window.removeEventListener('resize', checkMobile))

const products = ref([])
const categories = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref(null)
const formRef = ref()
const page = ref(1)
const limit = ref(10)
const total = ref(0)
const filterCategory = ref('')
const keyword = ref('')

const sugarInputVisible = ref(false)
const sugarInputVal = ref('')
const sugarInputRef = ref()
const iceInputVisible = ref(false)
const iceInputVal = ref('')
const iceInputRef = ref()

const imageFields = [
  { field: 'image', label: '商品图' },
  { field: 'medium_image', label: '中杯图' },
  { field: 'large_image', label: '大杯图' },
  { field: 'package_image', label: '包装图' }
]

const defaultForm = () => ({
  category_id: '',
  name: '',
  description: '',
  image: '',
  medium_image: '',
  large_image: '',
  package_image: '',
  base_price: 0,
  is_active: 1,
  sort_order: 0,
  sugar_options: ['无糖', '少糖', '半糖', '七分糖', '全糖'],
  ice_options: ['去冰', '少冰', '正常冰', '多冰'],
  size_options: [{ name: '中杯', label: '中杯 360ml', price: 0 }, { name: '大杯', label: '大杯 500ml', price: 5 }],
  addon_options: []
})

const form = reactive(defaultForm())
const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择分类', trigger: 'change' }],
  base_price: [{ required: true, message: '请输入价格', trigger: 'blur' }]
}

function addSugar() {
  if (sugarInputVal.value.trim()) form.sugar_options.push(sugarInputVal.value.trim())
  sugarInputVal.value = ''
  sugarInputVisible.value = false
}
function addIce() {
  if (iceInputVal.value.trim()) form.ice_options.push(iceInputVal.value.trim())
  iceInputVal.value = ''
  iceInputVisible.value = false
}

async function loadData() {
  loading.value = true
  try {
    const res = await productApi.getList({
      page: page.value, limit: limit.value,
      category_id: filterCategory.value || undefined,
      keyword: keyword.value || undefined
    })
    products.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  const res = await categoryApi.getAll()
  categories.value = res.data
}

function openDialog(row = null) {
  editingId.value = row?.id || null
  const def = defaultForm()
  if (row) {
    const existingSizes = row.size_options || []
    const sizeOptions = [
      { name: '中杯', label: '中杯 360ml', price: parseFloat(existingSizes[0]?.price ?? 0) },
      { name: '大杯', label: '大杯 500ml', price: parseFloat(existingSizes[1]?.price ?? 5) }
    ]
    Object.assign(form, {
      category_id: row.category_id,
      name: row.name,
      description: row.description || '',
      image: row.image || '',
      medium_image: row.medium_image || '',
      large_image: row.large_image || '',
      package_image: row.package_image || '',
      base_price: parseFloat(row.base_price),
      is_active: row.is_active,
      sort_order: row.sort_order,
      sugar_options: [...(row.sugar_options || def.sugar_options)],
      ice_options: [...(row.ice_options || def.ice_options)],
      size_options: sizeOptions,
      addon_options: JSON.parse(JSON.stringify(row.addon_options || []))
    })
  } else {
    Object.assign(form, def)
  }
  dialogVisible.value = true
}

async function handleSave() {
  await formRef.value.validate()
  saving.value = true
  try {
    const data = { ...form }
    if (editingId.value) {
      await productApi.update(editingId.value, data)
      ElMessage.success('更新成功')
    } else {
      await productApi.create(data)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

async function handleToggle(row) {
  try {
    await productApi.toggle(row.id)
    ElMessage.success(row.is_active ? '已上架' : '已下架')
  } catch {
    row.is_active = row.is_active === 1 ? 0 : 1
  }
}

async function handleDelete(id) {
  try {
    await productApi.remove(id)
    ElMessage.success('删除成功')
    loadData()
  } catch {}
}

function beforeUpload(file) {
  const isImg = /image\/(jpeg|jpg|png|webp)/.test(file.type)
  if (!isImg) { ElMessage.error('只支持jpg/png/webp格式'); return false }
  if (file.size > 5 * 1024 * 1024) { ElMessage.error('图片不能超过5MB'); return false }
  return true
}

async function handleUpload({ file }) {
  const fd = new FormData()
  fd.append('image', file)
  try {
    const res = await productApi.upload(fd)
    form.image = res.data.url
    ElMessage.success('上传成功')
  } catch {}
}

async function handleUploadField({ file }, field) {
  const fd = new FormData()
  fd.append('image', file)
  try {
    const res = await productApi.upload(fd)
    form[field] = res.data.url
    ElMessage.success('上传成功')
  } catch {}
}

onMounted(() => { loadData(); loadCategories() })
</script>

<style scoped>
.filter-bar { margin-bottom: 16px; }
.filter-bar :deep(.el-card__body) { padding: 12px 20px; }

.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }

.img-placeholder {
  width: 50px; height: 50px; background: #f5e6d3;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; border-radius: 8px;
}

.upload-area { }
.upload-btn {
  width: 120px; height: 120px; border: 2px dashed #d9c4ad;
  border-radius: 12px; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 8px;
  cursor: pointer; color: #999; font-size: 13px;
  transition: border-color 0.2s;
}
.upload-btn:hover { border-color: #6b4226; color: #6b4226; }

.img-preview {
  width: 120px; height: 120px; border-radius: 12px; position: relative; overflow: hidden;
}
.img-preview img { width: 100%; height: 100%; object-fit: cover; }
.img-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.2s; cursor: pointer; color: #fff; font-size: 20px;
}
.img-preview:hover .img-overlay { opacity: 1; }

.tag-editor { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }

.size-editor { display: flex; flex-direction: column; gap: 8px; }
.size-item { display: flex; align-items: center; gap: 8px; }

.size-fixed-name {
  display: inline-block; width: 90px; font-size: 13px;
  font-weight: 600; color: #6b4226;
}

.img-upload-block {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
}
.img-upload-label {
  font-size: 12px; color: #666; font-weight: 600;
}

/* 桌面端/移动端切换 */
.desktop-table { display: table; }
.mobile-cards { display: none; }

/* 移动端卡片样式 */
.product-card {
  background: #fafafa;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #f0e6da;
}

.product-main {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.product-img {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  flex-shrink: 0;
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-weight: 600;
  font-size: 14px;
  color: #333;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 13px;
}

.product-category {
  color: #999;
}

.product-price {
  font-weight: 700;
  color: #6b4226;
}

.product-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.product-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #f0e6da;
}

.action-btns {
  display: flex;
  gap: 8px;
}

/* 移动端响应式 */
@media (max-width: 768px) {
  .desktop-table { display: none !important; }
  .mobile-cards { display: block; }
}
</style>
