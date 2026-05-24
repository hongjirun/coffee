<template>
  <el-container class="layout-container">
    <!-- 移动端遮罩 -->
    <div v-if="isMobile && !isCollapsed" class="mobile-overlay" @click="isCollapsed = true"></div>
    
    <!-- 侧边栏 -->
    <el-aside 
      :width="isCollapsed ? '64px' : '220px'" 
      class="sidebar"
      :class="{ 'mobile-sidebar': isMobile, 'mobile-hidden': isMobile && isCollapsed }"
    >
      <div class="logo-area">
        <div class="logo-icon">☕</div>
        <transition name="fade">
          <div v-if="!isCollapsed" class="logo-text">
            <span class="logo-title">咖啡角</span>
            <span class="logo-subtitle">后台管理系统</span>
          </div>
        </transition>
      </div>

      <el-menu
        :default-active="$route.path"
        :collapse="isCollapsed"
        router
        class="sidebar-menu"
        background-color="transparent"
        text-color="#c4956a"
        active-text-color="#ffffff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>数据概览</template>
        </el-menu-item>
        <el-menu-item index="/categories">
          <el-icon><Menu /></el-icon>
          <template #title>分类管理</template>
        </el-menu-item>
        <el-menu-item index="/products">
          <el-icon><Goods /></el-icon>
          <template #title>商品管理</template>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon><List /></el-icon>
          <template #title>订单管理</template>
        </el-menu-item>
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <template #title>系统设置</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container class="main-container">
      <!-- 顶部导航 -->
      <el-header class="topbar">
        <div class="topbar-left">
          <!-- 桌面端折叠按钮 -->
          <el-icon v-if="!isMobile" class="collapse-btn" @click="isCollapsed = !isCollapsed">
            <Fold v-if="!isCollapsed" />
            <Expand v-else />
          </el-icon>
          <!-- 移动端汉堡菜单 -->
          <el-icon v-else class="mobile-menu-btn" @click="isCollapsed = !isCollapsed">
            <Fold v-if="!isCollapsed" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </el-header>

      <!-- 内容区域 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const isCollapsed = ref(false)
const isMobile = ref(false)

// 检测是否为移动端
function checkMobile() {
  isMobile.value = window.innerWidth <= 768
  if (isMobile.value) {
    isCollapsed.value = true
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  if (!authStore.admin) {
    try { authStore.fetchInfo() } catch {}
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const titleMap = {
  '/dashboard': '数据概览',
  '/categories': '分类管理',
  '/products': '商品管理',
  '/orders': '订单管理',
  '/settings': '系统设置'
}
const currentTitle = computed(() => titleMap[route.path] || '')


async function handleCommand(cmd) {
  if (cmd === 'logout') {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
    authStore.logout()
    router.push('/login')
  } else if (cmd === 'settings') {
    router.push('/settings')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  background: linear-gradient(180deg, #4a2c0a 0%, #6b4226 100%);
  transition: width 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.logo-area {
  display: flex;
  align-items: center;
  padding: 20px 16px;
  gap: 12px;
  border-bottom: 1px solid rgba(196, 149, 106, 0.2);
  min-height: 72px;
}

.logo-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.logo-text {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.logo-title {
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
}

.logo-subtitle {
  color: #c4956a;
  font-size: 11px;
  white-space: nowrap;
}

.sidebar-menu {
  border-right: none;
  flex: 1;
  padding: 8px 0;
}

.sidebar-menu :deep(.el-menu-item) {
  border-radius: 8px;
  margin: 2px 8px;
  height: 44px;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: rgba(196, 149, 106, 0.3) !important;
  color: #fff !important;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: rgba(196, 149, 106, 0.15) !important;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #f0e6da;
  padding: 0 20px;
  height: 60px;
  box-shadow: 0 1px 4px rgba(107, 66, 38, 0.08);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #6b4226;
  transition: color 0.2s;
}
.collapse-btn:hover { color: #c4956a; }

.topbar-right { display: flex; align-items: center; }

.admin-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}
.admin-info:hover { background: #f5e6d3; }

.admin-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.main-content {
  background: #fdf6f0;
  overflow-y: auto;
  padding: 24px;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* 移动端适配 */
.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
}

.mobile-sidebar {
  position: fixed !important;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  height: 100vh;
}

.mobile-hidden {
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.mobile-menu-btn {
  font-size: 20px;
  cursor: pointer;
  color: #6b4226;
  margin-right: 12px;
}

@media (max-width: 768px) {
  .topbar {
    padding: 0 12px;
  }
  
  .admin-name {
    display: none;
  }
  
  .el-breadcrumb {
    display: none;
  }
  
  .main-content {
    padding: 12px;
  }
}
</style>
