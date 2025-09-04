const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 服务器控制
  getServerStatus: () => ipcRenderer.invoke('get-server-status'),
  startServer: () => ipcRenderer.invoke('start-server'),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  restartServer: () => ipcRenderer.invoke('restart-server'),
  
  // 日志管理
  getLogs: () => ipcRenderer.invoke('get-logs'),
  
  // 配置管理
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  
  // 窗口控制
  minimize: () => ipcRenderer.invoke('minimize-window'),
  close: () => ipcRenderer.invoke('close-window'),
  
  // 事件监听
  onServerStatusChange: (callback) => {
    ipcRenderer.on('server-status-changed', callback);
    return () => ipcRenderer.removeListener('server-status-changed', callback);
  },
  
  onLogUpdate: (callback) => {
    ipcRenderer.on('log-updated', callback);
    return () => ipcRenderer.removeListener('log-updated', callback);
  }
});