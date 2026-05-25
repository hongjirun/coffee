<template>
  <div>
    <div class="page-header">
      <h2>订单管理</h2>
    </div>

    <!-- 筛选 -->
    <el-card class="filter-bar">
      <el-row :gutter="16" align="middle">
        <el-col :xs="24" :sm="8" :md="5" style="margin-bottom: 8px;">
          <el-select v-model="filterStatus" placeholder="所有状态" clearable @change="loadData" style="width: 100%">
            <el-option label="待制作" value="pending" />
            <el-option label="制作中" value="preparing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8" style="margin-bottom: 8px;">
          <el-input v-model="keyword" placeholder="订单号/客户名/手机号..." clearable @input="loadData" />
        </el-col>
        <el-col :xs="24" :sm="4" :md="4">
          <el-button @click="loadData" :icon="Refresh" style="width: 100%">刷新</el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card>
      <!-- 桌面端表格 -->
      <el-table :data="orders" v-loading="loading" @row-click="viewOrder" class="desktop-table">
        <el-table-column prop="order_no" label="订单号" width="160" />
        <el-table-column prop="customer_name" label="客户姓名" width="100">
          <template #default="{ row }">{{ row.customer_name || '匿名' }}</template>
        </el-table-column>
        <el-table-column prop="customer_phone" label="手机号" width="120">
          <template #default="{ row }">{{ row.customer_phone || '-' }}</template>
        </el-table-column>
        <el-table-column prop="total_amount" label="订单金额" width="100">
          <template #default="{ row }">
            <span style="font-weight: 600; color: #6b4226;">¥{{ row.total_amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="110">
          <template #default="{ row }">
            <span :class="['status-badge', row.status]">
              {{ statusMap[row.status] }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="地址" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.remark?.replace(/^地址：/, '') || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="下单时间" width="160">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right" @click.stop>
          <template #default="{ row }">
            <div style="display: flex; gap: 8px; align-items: center;">
              <template v-if="row.status === 'pending'">
                <el-button size="small" type="primary" @click.stop="updateStatus(row, 'preparing')">开始制作</el-button>
                <el-button size="small" type="danger" plain @click.stop="updateStatus(row, 'cancelled')">取消</el-button>
              </template>
              <template v-else-if="row.status === 'preparing'">
                <el-button size="small" type="success" @click.stop="updateStatus(row, 'completed')">完成</el-button>
              </template>
              <template v-else>
                <el-tag :type="row.status === 'completed' ? 'success' : 'info'" size="small">
                  {{ statusMap[row.status] }}
                </el-tag>
              </template>
              <el-popconfirm title="确定删除吗？" @confirm.stop="handleDelete(row.id)">
                <template #reference>
                  <el-button size="small" text type="danger" @click.stop>删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 移动端卡片 -->
      <div class="mobile-cards" v-loading="loading">
        <div v-for="order in orders" :key="order.id" class="order-card" @click="viewOrder(order)">
          <div class="order-header">
            <span class="order-no">{{ order.order_no }}</span>
            <span :class="['status-badge', order.status]">{{ statusMap[order.status] }}</span>
          </div>
          <div class="order-info">
            <div class="order-customer">
              <span>{{ order.customer_name || '匿名' }}</span>
              <span v-if="order.customer_phone">{{ order.customer_phone }}</span>
            </div>
            <div class="order-amount">¥{{ order.total_amount }}</div>
          </div>
          <div class="order-footer">
            <span class="order-time">{{ formatTime(order.created_at) }}</span>
            <div class="order-actions" @click.stop>
              <template v-if="order.status === 'pending'">
                <el-button size="small" type="primary" @click.stop="updateStatus(order, 'preparing')">开始制作</el-button>
                <el-button size="small" type="danger" plain @click.stop="updateStatus(order, 'cancelled')">取消</el-button>
              </template>
              <template v-else-if="order.status === 'preparing'">
                <el-button size="small" type="success" @click.stop="updateStatus(order, 'completed')">完成</el-button>
              </template>
              <el-popconfirm title="确定删除该订单吗？" @confirm.stop="handleDelete(order.id)">
                <template #reference>
                  <el-button size="small" text type="danger" @click.stop>删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>
          <div v-if="order.remark" class="order-remark">备注：{{ order.remark }}</div>
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

    <!-- 订单详情弹窗 -->
    <el-drawer v-model="drawerVisible" title="订单详情" :size="isMobile ? '100%' : '440px'">
      <div class="order-detail" v-if="currentOrder">
        <div class="order-meta">
          <div class="meta-row">
            <span class="meta-label">订单号</span>
            <span class="meta-val mono">{{ currentOrder.order_no }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">客户</span>
            <span class="meta-val">{{ currentOrder.customer_name || '匿名' }}</span>
          </div>
          <div class="meta-row" v-if="currentOrder.customer_phone">
            <span class="meta-label">手机</span>
            <span class="meta-val">{{ currentOrder.customer_phone }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">状态</span>
            <span :class="['status-badge', currentOrder.status]">{{ statusMap[currentOrder.status] }}</span>
          </div>
          <div class="meta-row" v-if="currentOrder.remark">
            <span class="meta-label">地址</span>
            <span class="meta-val addr-text">{{ currentOrder.remark }}</span>
            <el-button size="small" type="primary" plain @click="copyAddress(currentOrder.remark + (currentOrder.customer_note ? ' （备注：' + currentOrder.customer_note + '）' : ''))" style="margin-left: 8px; flex-shrink: 0;">📋 复制地址</el-button>
          </div>
          <div class="meta-row note-row" v-if="currentOrder.customer_note">
            <span class="meta-label">地址备注</span>
            <span class="meta-val" style="color: #e6813a; font-weight: 500;">{{ currentOrder.customer_note }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">下单时间</span>
            <span class="meta-val">{{ formatTime(currentOrder.created_at) }}</span>
          </div>
        </div>

        <div class="items-title">订单商品</div>
        <div class="order-items">
          <div class="order-item" v-for="item in currentOrder.items" :key="item.id">
            <div class="item-img">
              <img :src="item.product_image || ''" v-if="item.product_image" />
              <div class="img-empty" v-else>☕</div>
            </div>
            <div class="item-info">
              <div class="item-name">{{ item.product_name }}</div>
              <div class="item-opts">
                <span v-if="item.size">{{ item.size }}</span>
                <span v-if="item.sugar">{{ item.sugar }}</span>
                <span v-if="item.ice">{{ item.ice }}</span>
                <template v-if="item.addons?.length">
                  <span v-for="a in item.addons" :key="a.name">加{{ a.name }}</span>
                </template>
              </div>
              <div class="item-note" v-if="item.item_note"><span class="note-tag">📌 备注</span>{{ item.item_note }}</div>
              <div class="item-price-row">
                <span class="item-qty">x{{ item.quantity }}</span>
                <span class="item-price">¥{{ item.subtotal }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="order-total">
          <span>合计金额</span>
          <span class="total-amt">¥{{ currentOrder.total_amount }}</span>
        </div>
      </div>
      <div v-else style="text-align: center; padding-top: 40px; color: #999;">加载中...</div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { orderApi } from '@/api'
import { ElMessage } from 'element-plus'

// 移动端检测
const isMobile = ref(window.innerWidth <= 768)
function checkMobile() { isMobile.value = window.innerWidth <= 768 }
onMounted(() => window.addEventListener('resize', checkMobile))
onUnmounted(() => window.removeEventListener('resize', checkMobile))

const orders = ref([])
const loading = ref(false)
const page = ref(1)
const limit = ref(15)
const total = ref(0)
const filterStatus = ref('')
const keyword = ref('')
const drawerVisible = ref(false)
const currentOrder = ref(null)

function formatTime(val) {
  if (!val) return '-'
  const d = new Date(val)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const statusMap = {
  pending: '待制作',
  preparing: '制作中',
  completed: '已完成',
  cancelled: '已取消'
}

async function loadData() {
  loading.value = true
  try {
    const res = await orderApi.getList({
      page: page.value, limit: limit.value,
      status: filterStatus.value || undefined,
      keyword: keyword.value || undefined
    })
    orders.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

async function updateStatus(row, status) {
  try {
    await orderApi.updateStatus(row.id, status)
    ElMessage.success('状态更新成功')
    loadData()
  } catch {}
}

async function handleDelete(id) {
  try {
    await orderApi.delete(id)
    ElMessage.success('订单删除成功')
    loadData()
  } catch {}
}

function copyAddress(text) {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('地址已复制，可直接导航')
  }).catch(() => {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    ElMessage.success('地址已复制，可直接导航')
  })
}

async function viewOrder(row) {
  drawerVisible.value = true
  currentOrder.value = null
  try {
    const res = await orderApi.getById(row.id)
    currentOrder.value = res.data
  } catch {}
}

onMounted(loadData)
</script>

<style scoped>
.filter-bar { margin-bottom: 16px; }
.filter-bar :deep(.el-card__body) { padding: 12px 20px; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }

.order-detail { padding: 0 4px; }

.order-meta {
  background: #fdf6f0;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #f0e6da;
}
.meta-row:last-child { border-bottom: none; }
.meta-label { color: #999; font-size: 13px; }
.meta-val { font-size: 13px; color: #333; }
.mono { font-family: monospace; }

.items-title { font-weight: 600; color: #6b4226; margin-bottom: 12px; font-size: 14px; }

.order-items { display: flex; flex-direction: column; gap: 10px; }

.order-item {
  display: flex;
  gap: 12px;
  background: #fafafa;
  border-radius: 10px;
  padding: 10px;
  border: 1px solid #f0e6da;
}

.item-img {
  width: 54px; height: 54px; border-radius: 8px; overflow: hidden;
  background: #f5e6d3; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.item-img img { width: 100%; height: 100%; object-fit: cover; }
.img-empty { font-size: 24px; }

.item-info { flex: 1; }
.item-name { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
.item-opts { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
.item-opts span {
  background: #f0e6da; color: #6b4226;
  padding: 1px 8px; border-radius: 10px; font-size: 11px;
}

.item-note {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 12px;
  color: #e6813a;
}
.note-tag {
  background: #fff3e0;
  color: #e6813a;
  border: 1px solid #f5cfa0;
  border-radius: 8px;
  padding: 1px 7px;
  font-size: 11px;
  white-space: nowrap;
  flex-shrink: 0;
}

.addr-text { color: #333; word-break: break-all; flex: 1; }

.note-row .meta-label { color: #e6813a; }
.note-row .meta-val { color: #e6813a; font-weight: 500; }

.item-price-row { display: flex; justify-content: space-between; }
.item-qty { color: #999; font-size: 13px; }
.item-price { font-weight: 600; color: #6b4226; }

.order-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding: 12px 16px;
  background: #fdf0e0;
  border-radius: 10px;
  font-weight: 600;
}
.total-amt { font-size: 20px; color: #6b4226; }

/* 桌面端/移动端切换 */
.desktop-table { display: table; }
.mobile-cards { display: none; }

/* 移动端订单卡片 */
.order-card {
  background: #fafafa;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #f0e6da;
  cursor: pointer;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.order-no {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.order-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.order-customer {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #666;
}

.order-amount {
  font-size: 18px;
  font-weight: 700;
  color: #6b4226;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0e6da;
}

.order-time {
  font-size: 12px;
  color: #999;
}

.order-actions {
  display: flex;
  gap: 8px;
}

.order-remark {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #f0e6da;
  font-size: 12px;
  color: #e6a23c;
}

/* 状态标签 */
.status-badge {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
.status-badge.pending { background: #fff3e0; color: #e6a23c; }
.status-badge.preparing { background: #e6f7ff; color: #1890ff; }
.status-badge.completed { background: #f6ffed; color: #52c41a; }
.status-badge.cancelled { background: #fff2f0; color: #ff4d4f; }

/* 移动端响应式 */
@media (max-width: 768px) {
  .desktop-table { display: none !important; }
  .mobile-cards { display: block; }
}
</style>
