<template>
  <div class="dashboard">
    <div class="page-header">
      <h2>数据概览</h2>
      <span class="date-label">{{ currentDate }}</span>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :xs="12" :sm="12" :md="6" v-for="card in statCards" :key="card.key">
        <div class="stat-card" :style="{ borderTop: `3px solid ${card.color}` }">
          <div class="stat-icon" :style="{ background: card.color + '15', color: card.color }">
            <el-icon :size="24"><component :is="card.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ card.value }}</div>
            <div class="stat-label">{{ card.label }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 快捷入口 -->
    <el-row :gutter="20" class="quick-actions">
      <el-col :span="24">
        <el-card class="action-card">
          <template #header>
            <span style="font-weight: 600; color: #6b4226;">快捷操作</span>
          </template>
          <div class="actions-grid">
            <div class="action-item" @click="$router.push('/products')">
              <div class="action-icon" style="background: #fff3cd;">☕</div>
              <span>添加商品</span>
            </div>
            <div class="action-item" @click="$router.push('/categories')">
              <div class="action-icon" style="background: #cce5ff;">📂</div>
              <span>管理分类</span>
            </div>
            <div class="action-item" @click="$router.push('/orders')">
              <div class="action-icon" style="background: #d4edda;">📋</div>
              <span>查看订单</span>
            </div>
            <div class="action-item" @click="$router.push('/settings')">
              <div class="action-icon" style="background: #f8d7da;">⚙️</div>
              <span>系统设置</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 待处理订单 -->
    <el-card class="pending-orders" v-if="pendingOrders.length > 0">
      <template #header>
        <div style="display:flex; align-items:center; gap:8px;">
          <el-badge :value="pendingOrders.length" type="danger">
            <span style="font-weight: 600; color: #6b4226;">待处理订单</span>
          </el-badge>
        </div>
      </template>
      
      <!-- 桌面端表格 -->
      <el-table :data="pendingOrders" size="small" class="desktop-table">
        <el-table-column prop="order_no" label="订单号" width="160" />
        <el-table-column prop="customer_name" label="客户" width="100" />
        <el-table-column prop="total_amount" label="金额" width="80">
          <template #default="{ row }">¥{{ row.total_amount }}</template>
        </el-table-column>
        <el-table-column prop="created_at" label="下单时间" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleStartPrepare(row)">开始制作</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 移动端卡片 -->
      <div class="mobile-cards">
        <div v-for="order in pendingOrders" :key="order.id" class="order-card">
          <div class="order-header">
            <span class="order-no">{{ order.order_no }}</span>
            <span class="order-amount">¥{{ order.total_amount }}</span>
          </div>
          <div class="order-info">
            <span v-if="order.customer_name">{{ order.customer_name }}</span>
            <span class="order-time">{{ order.created_at }}</span>
          </div>
          <el-button size="small" type="primary" class="order-action" @click="handleStartPrepare(order)">
            开始制作
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { orderApi } from '@/api'
import { ElMessage } from 'element-plus'

const stats = ref({})
const pendingOrders = ref([])

const currentDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
})

const statCards = computed(() => [
  { key: 'today', label: '今日订单', value: stats.value.today_orders || 0, icon: 'ShoppingCart', color: '#6b4226' },
  { key: 'today_amount', label: '今日营业额', value: `¥${stats.value.today_amount || 0}`, icon: 'Money', color: '#c4956a' },
  { key: 'pending', label: '待处理订单', value: stats.value.pending_orders || 0, icon: 'Bell', color: '#e6a23c' },
  { key: 'products', label: '在售商品', value: stats.value.active_products || 0, icon: 'Goods', color: '#67c23a' }
])

async function loadData() {
  try {
    const [dashRes, ordersRes] = await Promise.all([
      orderApi.getDashboard(),
      orderApi.getList({ status: 'pending', limit: 5 })
    ])
    stats.value = dashRes.data
    pendingOrders.value = ordersRes.data.list
  } catch {}
}

async function handleStartPrepare(row) {
  try {
    await orderApi.updateStatus(row.id, 'preparing')
    ElMessage.success('已开始制作')
    loadData()
  } catch {}
}

onMounted(loadData)
</script>

<style scoped>
.dashboard { }

.date-label { color: #999; font-size: 14px; }

.stat-cards { margin-bottom: 20px; }

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(107, 66, 38, 0.08);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-value { font-size: 20px; font-weight: 700; color: #333; }
.stat-label { font-size: 12px; color: #999; margin-top: 2px; }

.quick-actions { margin-bottom: 20px; }

.action-card :deep(.el-card__body) { padding: 16px; }

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #f0e6da;
}
.action-item:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(107, 66, 38, 0.12); }

.action-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.action-item span { font-size: 12px; color: #666; font-weight: 500; }

.pending-orders { margin-top: 0; }

/* 桌面端表格 */
.desktop-table { display: table; }
.mobile-cards { display: none; }

/* 移动端卡片 */
.order-card {
  background: #fafafa;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #f0e6da;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.order-no {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.order-amount {
  font-size: 16px;
  font-weight: 700;
  color: #6b4226;
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
}

.order-time {
  font-size: 11px;
}

.order-action {
  width: 100%;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .desktop-table { display: none; }
  .mobile-cards { display: block; }
  .stat-cards .el-col {
    margin-bottom: 12px;
  }
  
  .stat-card {
    padding: 12px;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
  }
  
  .stat-value { font-size: 18px; }
  
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .action-item {
    padding: 14px 8px;
  }
  
  .action-icon {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }
}
</style>
