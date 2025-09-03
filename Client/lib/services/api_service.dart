import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:web_socket_channel/web_socket_channel.dart';
import '../models/api_models.dart';

class ApiService {
  static const String defaultBaseUrl = 'http://localhost:3000';
  late String _baseUrl;
  WebSocketChannel? _wsChannel;
  
  ApiService({String? baseUrl}) {
    _baseUrl = baseUrl ?? defaultBaseUrl;
  }
  
  // HTTP客户端实例
  final http.Client _httpClient = http.Client();
  
  // 设置服务器URL
  void setBaseUrl(String url) {
    _baseUrl = url;
  }
  
  // 获取当前服务器URL
  String get baseUrl => _baseUrl;
  
  // 通用HTTP请求方法
  Future<Map<String, dynamic>> _makeRequest(
    String method,
    String endpoint, {
    Map<String, dynamic>? body,
    Map<String, String>? headers,
  }) async {
    final uri = Uri.parse('$_baseUrl$endpoint');
    final defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (headers != null) {
      defaultHeaders.addAll(headers);
    }
    
    http.Response response;
    
    try {
      switch (method.toUpperCase()) {
        case 'GET':
          response = await _httpClient.get(uri, headers: defaultHeaders);
          break;
        case 'POST':
          response = await _httpClient.post(
            uri,
            headers: defaultHeaders,
            body: body != null ? json.encode(body) : null,
          );
          break;
        case 'PUT':
          response = await _httpClient.put(
            uri,
            headers: defaultHeaders,
            body: body != null ? json.encode(body) : null,
          );
          break;
        case 'DELETE':
          response = await _httpClient.delete(uri, headers: defaultHeaders);
          break;
        default:
          throw Exception('Unsupported HTTP method: $method');
      }
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        if (response.body.isEmpty) {
          return {};
        }
        return json.decode(response.body) as Map<String, dynamic>;
      } else {
        throw ApiException(
          statusCode: response.statusCode,
          message: 'HTTP ${response.statusCode}: ${response.reasonPhrase}',
          body: response.body,
        );
      }
    } catch (e) {
      if (e is ApiException) {
        rethrow;
      }
      throw ApiException(
        statusCode: 0,
        message: 'Network error: ${e.toString()}',
      );
    }
  }
  
  // 测试服务器连接
  Future<ServerStatus> checkServerStatus() async {
    try {
      final response = await _makeRequest('GET', '/api/status');
      return ServerStatus.fromJson(response);
    } catch (e) {
      throw ApiException(
        statusCode: 0,
        message: 'Failed to connect to server: ${e.toString()}',
      );
    }
  }
  
  // 获取MCP服务列表
  Future<List<MCPServiceInfo>> getServices() async {
    try {
      final response = await _makeRequest('GET', '/api/services');
      final List<dynamic> servicesJson = response['services'] ?? [];
      return servicesJson
          .map((json) => MCPServiceInfo.fromJson(json))
          .toList();
    } catch (e) {
      throw ApiException(
        statusCode: 0,
        message: 'Failed to fetch services: ${e.toString()}',
      );
    }
  }
  
  // 安装MCP服务
  Future<void> installService(String serviceName, String version) async {
    try {
      await _makeRequest('POST', '/api/services/install', body: {
        'name': serviceName,
        'version': version,
      });
    } catch (e) {
      throw ApiException(
        statusCode: 0,
        message: 'Failed to install service: ${e.toString()}',
      );
    }
  }
  
  // 卸载MCP服务
  Future<void> uninstallService(String serviceId) async {
    try {
      await _makeRequest('DELETE', '/api/services/$serviceId');
    } catch (e) {
      throw ApiException(
        statusCode: 0,
        message: 'Failed to uninstall service: ${e.toString()}',
      );
    }
  }
  
  // 启用/禁用MCP服务
  Future<void> toggleService(String serviceId, bool enabled) async {
    try {
      await _makeRequest('PUT', '/api/services/$serviceId', body: {
        'enabled': enabled,
      });
    } catch (e) {
      throw ApiException(
        statusCode: 0,
        message: 'Failed to toggle service: ${e.toString()}',
      );
    }
  }
  
  // 发送聊天消息
  Future<ChatResponse> sendMessage(String message) async {
    try {
      final response = await _makeRequest('POST', '/api/chat', body: {
        'message': message,
      });
      return ChatResponse.fromJson(response);
    } catch (e) {
      throw ApiException(
        statusCode: 0,
        message: 'Failed to send message: ${e.toString()}',
      );
    }
  }
  
  // 获取任务列表
  Future<List<TaskInfo>> getTasks() async {
    try {
      final response = await _makeRequest('GET', '/api/tasks');
      final List<dynamic> tasksJson = response['tasks'] ?? [];
      return tasksJson.map((json) => TaskInfo.fromJson(json)).toList();
    } catch (e) {
      throw ApiException(
        statusCode: 0,
        message: 'Failed to fetch tasks: ${e.toString()}',
      );
    }
  }
  
  // WebSocket连接用于实时更新
  void connectWebSocket() {
    try {
      final wsUrl = _baseUrl.replaceFirst('http', 'ws');
      _wsChannel = WebSocketChannel.connect(Uri.parse('$wsUrl/ws'));
    } catch (e) {
      throw ApiException(
        statusCode: 0,
        message: 'Failed to connect WebSocket: ${e.toString()}',
      );
    }
  }
  
  // 获取WebSocket流
  Stream<dynamic>? get webSocketStream => _wsChannel?.stream;
  
  // 发送WebSocket消息
  void sendWebSocketMessage(Map<String, dynamic> message) {
    if (_wsChannel != null) {
      _wsChannel!.sink.add(json.encode(message));
    }
  }
  
  // 关闭WebSocket连接
  void closeWebSocket() {
    _wsChannel?.sink.close();
    _wsChannel = null;
  }
  
  // 释放资源
  void dispose() {
    _httpClient.close();
    closeWebSocket();
  }
}

// API异常类
class ApiException implements Exception {
  final int statusCode;
  final String message;
  final String? body;
  
  const ApiException({
    required this.statusCode,
    required this.message,
    this.body,
  });
  
  @override
  String toString() {
    return 'ApiException: $message (Status: $statusCode)';
  }
}