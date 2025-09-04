// 应用状态
let serverStatus = {
    isRunning: false,
    process: null
};

let currentPage = 'dashboard';
let refreshInterval = null;

// DOM 元素
const elements = {
    navItems: document.querySelectorAll('.nav-item'),
    pages: document.querySelectorAll('.page'),
    statusCard: document.getElementById('server-status'),
    statusText: document.getElementById('status-text'),
    statusDetails: document.getElementById('status-details'),
    statusDot: document.querySelector('.status-dot'),
    startBtn: document.getElementById('start-btn'),
    stopBtn: document.getElementById('stop-btn'),
    restartBtn: document.getElementById('restart-btn'),
    logContent: document.getElementById('log-content'),
    refreshLogsBtn: document.getElementById('refresh-logs'),
    settingsForm: document.getElementById('settings-form'),
    portInput: document.getElementById('port'),
    wsPortInput: document.getElementById('ws-port'),
    logLevelSelect: document.getElementById('log-level'),
    autoStartCheckbox: document.getElementById('auto-start')
};

// 初始化应用
async function initApp() {
    setupNavigation();
    setupEventListeners();
    await loadServerStatus();
    await loadSettings();
    
    // 根据URL hash设置初始页面
    const hash = window.location.hash.substring(1);
    if (hash && ['dashboard', 'logs', 'settings'].includes(hash)) {
        switchPage(hash);
    }
    
    // 开始定期刷新状态
    startStatusRefresh();
}

// 设置导航
function setupNavigation() {
    elements.navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            switchPage(page);
        });
    });
}

// 切换页面
function switchPage(page) {
    // 更新导航状态
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });
    
    // 更新页面显示
    elements.pages.forEach(pageEl => {
        pageEl.classList.toggle('active', pageEl.id === page);
    });
    
    currentPage = page;
    window.location.hash = page;
    
    // 页面特定的初始化
    if (page === 'logs') {
        loadLogs();
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 服务器控制按钮
    elements.startBtn.addEventListener('click', startServer);
    elements.stopBtn.addEventListener('click', stopServer);
    elements.restartBtn.addEventListener('click', restartServer);
    
    // 日志刷新
    elements.refreshLogsBtn.addEventListener('click', loadLogs);
    
    // 设置表单
    elements.settingsForm.addEventListener('submit', saveSettings);
}

// 加载服务器状态
async function loadServerStatus() {
    try {
        const status = await window.electronAPI.getServerStatus();
        updateServerStatus(status);
    } catch (error) {
        console.error('Failed to load server status:', error);
        showError('Failed to load server status');
    }
}

// 更新服务器状态显示
function updateServerStatus(status) {
    serverStatus = status;
    
    const isRunning = status.isRunning;
    
    // 更新状态卡片
    elements.statusCard.classList.toggle('stopped', !isRunning);
    elements.statusDot.classList.toggle('stopped', !isRunning);
    
    // 更新状态文本
    elements.statusText.textContent = `Server Status: ${isRunning ? 'Running' : 'Stopped'}`;
    
    if (isRunning && status.process) {
        elements.statusDetails.textContent = `PID: ${status.process.pid} | Connected: ${status.process.connected}`;
    } else {
        elements.statusDetails.textContent = isRunning ? 'Server is running' : 'Server is not running';
    }
    
    // 更新按钮状态
    elements.startBtn.disabled = isRunning;
    elements.stopBtn.disabled = !isRunning;
    elements.restartBtn.disabled = !isRunning;
    
    // 更新统计信息
    updateStats(status);
}

// 更新统计信息
function updateStats(status) {
    // 这里可以添加更多的统计信息
    document.getElementById('uptime').textContent = status.isRunning ? 'Running' : 'Stopped';
    document.getElementById('requests').textContent = '0'; // 需要从服务器获取
    document.getElementById('services').textContent = '3'; // 需要从服务器获取
    document.getElementById('memory').textContent = '--'; // 需要从服务器获取
}

// 启动服务器
async function startServer() {
    try {
        showLoading(elements.startBtn, 'Starting...');
        const success = await window.electronAPI.startServer();
        
        if (success) {
            showSuccess('Server started successfully');
            await loadServerStatus();
        } else {
            showError('Failed to start server');
        }
    } catch (error) {
        console.error('Error starting server:', error);
        showError('Error starting server');
    } finally {
        hideLoading(elements.startBtn, 'Start Server');
    }
}

// 停止服务器
async function stopServer() {
    try {
        showLoading(elements.stopBtn, 'Stopping...');
        const success = await window.electronAPI.stopServer();
        
        if (success) {
            showSuccess('Server stopped successfully');
            await loadServerStatus();
        } else {
            showError('Failed to stop server');
        }
    } catch (error) {
        console.error('Error stopping server:', error);
        showError('Error stopping server');
    } finally {
        hideLoading(elements.stopBtn, 'Stop Server');
    }
}

// 重启服务器
async function restartServer() {
    try {
        showLoading(elements.restartBtn, 'Restarting...');
        const success = await window.electronAPI.restartServer();
        
        if (success) {
            showSuccess('Server restarted successfully');
            await loadServerStatus();
        } else {
            showError('Failed to restart server');
        }
    } catch (error) {
        console.error('Error restarting server:', error);
        showError('Error restarting server');
    } finally {
        hideLoading(elements.restartBtn, 'Restart Server');
    }
}

// 加载日志
async function loadLogs() {
    try {
        elements.logContent.innerHTML = '<div class="loading"><div class="spinner"></div>Loading logs...</div>';
        
        const logs = await window.electronAPI.getLogs();
        
        if (logs && logs.length > 0) {
            let logText = '';
            logs.forEach(log => {
                logText += `=== ${log.file} ===\n${log.content}\n\n`;
            });
            elements.logContent.textContent = logText;
        } else {
            elements.logContent.textContent = 'No logs available';
        }
        
        // 滚动到底部
        elements.logContent.scrollTop = elements.logContent.scrollHeight;
    } catch (error) {
        console.error('Error loading logs:', error);
        elements.logContent.textContent = 'Error loading logs: ' + error.message;
    }
}

// 加载设置
async function loadSettings() {
    try {
        const config = await window.electronAPI.getConfig();
        
        elements.portInput.value = config.port || 3001;
        elements.wsPortInput.value = config.wsPort || 3002;
        elements.logLevelSelect.value = config.logLevel || 'info';
        elements.autoStartCheckbox.checked = config.autoStart || false;
    } catch (error) {
        console.error('Error loading settings:', error);
        showError('Failed to load settings');
    }
}

// 保存设置
async function saveSettings(event) {
    event.preventDefault();
    
    try {
        const config = {
            port: parseInt(elements.portInput.value),
            wsPort: parseInt(elements.wsPortInput.value),
            logLevel: elements.logLevelSelect.value,
            autoStart: elements.autoStartCheckbox.checked
        };
        
        const success = await window.electronAPI.saveConfig(config);
        
        if (success) {
            showSuccess('Settings saved successfully');
        } else {
            showError('Failed to save settings');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        showError('Error saving settings');
    }
}

// 开始状态刷新
function startStatusRefresh() {
    // 每5秒刷新一次状态
    refreshInterval = setInterval(loadServerStatus, 5000);
}

// 停止状态刷新
function stopStatusRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// 显示加载状态
function showLoading(button, text) {
    button.disabled = true;
    button.innerHTML = `<div class="spinner" style="width: 16px; height: 16px; margin-right: 8px; display: inline-block;"></div>${text}`;
}

// 隐藏加载状态
function hideLoading(button, text) {
    button.disabled = false;
    button.textContent = text;
}

// 显示成功消息
function showSuccess(message) {
    showNotification(message, 'success');
}

// 显示错误消息
function showError(message) {
    showNotification(message, 'error');
}

// 显示通知
function showNotification(message, type) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        ${type === 'success' ? 'background: #48bb78;' : 'background: #f56565;'}
    `;
    
    // 添加动画样式
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    stopStatusRefresh();
});

// 初始化应用
document.addEventListener('DOMContentLoaded', initApp);