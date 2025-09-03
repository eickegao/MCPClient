import 'package:json_annotation/json_annotation.dart';

part 'api_models.g.dart';

// 服务器状态模型
@JsonSerializable()
class ServerStatus {
  final String status;
  final String version;
  final DateTime timestamp;
  final int connectedClients;
  final List<String> availableServices;
  
  const ServerStatus({
    required this.status,
    required this.version,
    required this.timestamp,
    required this.connectedClients,
    required this.availableServices,
  });
  
  factory ServerStatus.fromJson(Map<String, dynamic> json) =>
      _$ServerStatusFromJson(json);
  
  Map<String, dynamic> toJson() => _$ServerStatusToJson(this);
}

// MCP服务信息模型
@JsonSerializable()
class MCPServiceInfo {
  final String id;
  final String name;
  final String description;
  final String version;
  final bool enabled;
  final DateTime installedAt;
  final Map<String, dynamic>? config;
  final ServiceStatus status;
  
  const MCPServiceInfo({
    required this.id,
    required this.name,
    required this.description,
    required this.version,
    required this.enabled,
    required this.installedAt,
    this.config,
    required this.status,
  });
  
  factory MCPServiceInfo.fromJson(Map<String, dynamic> json) =>
      _$MCPServiceInfoFromJson(json);
  
  Map<String, dynamic> toJson() => _$MCPServiceInfoToJson(this);
}

// 服务状态枚举
enum ServiceStatus {
  @JsonValue('running')
  running,
  @JsonValue('stopped')
  stopped,
  @JsonValue('error')
  error,
  @JsonValue('installing')
  installing,
  @JsonValue('uninstalling')
  uninstalling,
}

// 聊天响应模型
@JsonSerializable()
class ChatResponse {
  final String id;
  final String content;
  final DateTime timestamp;
  final List<String>? attachments;
  final Map<String, dynamic>? metadata;
  
  const ChatResponse({
    required this.id,
    required this.content,
    required this.timestamp,
    this.attachments,
    this.metadata,
  });
  
  factory ChatResponse.fromJson(Map<String, dynamic> json) =>
      _$ChatResponseFromJson(json);
  
  Map<String, dynamic> toJson() => _$ChatResponseToJson(this);
}

// 任务信息模型
@JsonSerializable()
class TaskInfo {
  final String id;
  final String name;
  final String description;
  final TaskStatus status;
  final double? progress;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? error;
  final Map<String, dynamic>? result;
  
  const TaskInfo({
    required this.id,
    required this.name,
    required this.description,
    required this.status,
    this.progress,
    required this.createdAt,
    required this.updatedAt,
    this.error,
    this.result,
  });
  
  factory TaskInfo.fromJson(Map<String, dynamic> json) =>
      _$TaskInfoFromJson(json);
  
  Map<String, dynamic> toJson() => _$TaskInfoToJson(this);
}

// 任务状态枚举
enum TaskStatus {
  @JsonValue('pending')
  pending,
  @JsonValue('running')
  running,
  @JsonValue('completed')
  completed,
  @JsonValue('failed')
  failed,
  @JsonValue('cancelled')
  cancelled,
}

// WebSocket消息模型
@JsonSerializable()
class WebSocketMessage {
  final String type;
  final Map<String, dynamic> data;
  final DateTime timestamp;
  
  const WebSocketMessage({
    required this.type,
    required this.data,
    required this.timestamp,
  });
  
  factory WebSocketMessage.fromJson(Map<String, dynamic> json) =>
      _$WebSocketMessageFromJson(json);
  
  Map<String, dynamic> toJson() => _$WebSocketMessageToJson(this);
}

// 服务安装请求模型
@JsonSerializable()
class ServiceInstallRequest {
  final String name;
  final String version;
  final Map<String, dynamic>? config;
  
  const ServiceInstallRequest({
    required this.name,
    required this.version,
    this.config,
  });
  
  factory ServiceInstallRequest.fromJson(Map<String, dynamic> json) =>
      _$ServiceInstallRequestFromJson(json);
  
  Map<String, dynamic> toJson() => _$ServiceInstallRequestToJson(this);
}

// 聊天消息请求模型
@JsonSerializable()
class ChatMessageRequest {
  final String message;
  final String? conversationId;
  final Map<String, dynamic>? context;
  
  const ChatMessageRequest({
    required this.message,
    this.conversationId,
    this.context,
  });
  
  factory ChatMessageRequest.fromJson(Map<String, dynamic> json) =>
      _$ChatMessageRequestFromJson(json);
  
  Map<String, dynamic> toJson() => _$ChatMessageRequestToJson(this);
}

// API响应基类
@JsonSerializable()
class ApiResponse {
  final bool success;
  final String? message;
  final Map<String, dynamic>? data;
  final String? error;
  
  const ApiResponse({
    required this.success,
    this.message,
    this.data,
    this.error,
  });
  
  factory ApiResponse.fromJson(Map<String, dynamic> json) =>
      _$ApiResponseFromJson(json);
  
  Map<String, dynamic> toJson() => _$ApiResponseToJson(this);
}