import 'package:flutter/foundation.dart';

class AppState extends ChangeNotifier {
  // 服务器连接状态
  bool _isConnected = false;
  String _serverUrl = 'http://localhost:3000';
  
  // 当前活动的任务
  final List<Task> _activeTasks = [];
  
  // 所有任务
  final List<Task> _tasks = [];
  
  // MCP服务列表
  final List<MCPService> _services = [];
  
  // 聊天消息
  final List<ChatMessage> _messages = [];
  
  // Getters
  bool get isConnected => _isConnected;
  String get serverUrl => _serverUrl;
  List<Task> get activeTasks => List.unmodifiable(_activeTasks);
  List<Task> get tasks => List.unmodifiable(_tasks);
  List<MCPService> get services => List.unmodifiable(_services);
  List<ChatMessage> get messages => List.unmodifiable(_messages);
  
  // 连接到服务器
  Future<void> connectToServer(String url) async {
    try {
      _serverUrl = url;
      // TODO: 实现实际的连接逻辑
      await Future.delayed(const Duration(seconds: 1)); // 模拟连接延迟
      _isConnected = true;
      notifyListeners();
    } catch (e) {
      _isConnected = false;
      notifyListeners();
      rethrow;
    }
  }
  
  // 断开服务器连接
  void disconnectFromServer() {
    _isConnected = false;
    notifyListeners();
  }
  
  // 添加任务
  void addTask(Task task) {
    _tasks.add(task);
    if (task.status == TaskStatus.running) {
      _activeTasks.add(task);
    }
    notifyListeners();
  }
  
  // 更新任务状态
  void updateTask(Task updatedTask) {
    final taskIndex = _tasks.indexWhere((task) => task.id == updatedTask.id);
     if (taskIndex != -1) {
       _tasks[taskIndex] = updatedTask;
       
       final activeIndex = _activeTasks.indexWhere((task) => task.id == updatedTask.id);
       if (updatedTask.status == TaskStatus.running) {
         if (activeIndex == -1) {
           _activeTasks.add(updatedTask);
         } else {
           _activeTasks[activeIndex] = updatedTask;
         }
       } else if (activeIndex != -1) {
         _activeTasks.removeAt(activeIndex);
       }
       
       notifyListeners();
     }
  }
  
  // 移除任务
  void removeTask(String taskId) {
    _tasks.removeWhere((task) => task.id == taskId);
    _activeTasks.removeWhere((task) => task.id == taskId);
    notifyListeners();
  }
  
  // 添加MCP服务
  void addService(MCPService service) {
    _services.add(service);
    notifyListeners();
  }
  
  // 移除MCP服务
  void removeService(String serviceId) {
    _services.removeWhere((service) => service.id == serviceId);
    notifyListeners();
  }
  
  // 添加聊天消息
  void addMessage(ChatMessage message) {
    _messages.add(message);
    notifyListeners();
  }
  
  // 清空聊天消息
  void clearMessages() {
    _messages.clear();
    notifyListeners();
  }
}

// 任务模型
class Task {
  final String id;
  final String name;
  final String description;
  final TaskStatus status;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final double? progress;

  Task({
    required this.id,
    required this.name,
    required this.description,
    required this.status,
    required this.createdAt,
    this.updatedAt,
    this.progress,
  });

  Task copyWith({
    String? id,
    String? name,
    String? description,
    TaskStatus? status,
    DateTime? createdAt,
    DateTime? updatedAt,
    double? progress,
  }) {
    return Task(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      progress: progress ?? this.progress,
    );
  }
}

// 任务状态枚举
enum TaskStatus {
  pending,
  running,
  completed,
  failed,
}

// MCP服务模型
class MCPService {
  final String id;
  final String name;
  final String description;
  final String version;
  final bool isEnabled;
  final DateTime installedAt;
  
  const MCPService({
    required this.id,
    required this.name,
    required this.description,
    required this.version,
    required this.isEnabled,
    required this.installedAt,
  });
}

// 聊天消息模型
class ChatMessage {
  final String id;
  final String content;
  final MessageType type;
  final DateTime timestamp;
  
  const ChatMessage({
    required this.id,
    required this.content,
    required this.type,
    required this.timestamp,
  });
}

// 消息类型枚举
enum MessageType {
  user,
  assistant,
  system,
}