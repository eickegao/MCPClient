// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'api_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ServerStatus _$ServerStatusFromJson(Map<String, dynamic> json) => ServerStatus(
  status: json['status'] as String,
  version: json['version'] as String,
  timestamp: DateTime.parse(json['timestamp'] as String),
  connectedClients: (json['connectedClients'] as num).toInt(),
  availableServices: (json['availableServices'] as List<dynamic>)
      .map((e) => e as String)
      .toList(),
);

Map<String, dynamic> _$ServerStatusToJson(ServerStatus instance) =>
    <String, dynamic>{
      'status': instance.status,
      'version': instance.version,
      'timestamp': instance.timestamp.toIso8601String(),
      'connectedClients': instance.connectedClients,
      'availableServices': instance.availableServices,
    };

MCPServiceInfo _$MCPServiceInfoFromJson(Map<String, dynamic> json) =>
    MCPServiceInfo(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      version: json['version'] as String,
      enabled: json['enabled'] as bool,
      installedAt: DateTime.parse(json['installedAt'] as String),
      config: json['config'] as Map<String, dynamic>?,
      status: $enumDecode(_$ServiceStatusEnumMap, json['status']),
    );

Map<String, dynamic> _$MCPServiceInfoToJson(MCPServiceInfo instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'description': instance.description,
      'version': instance.version,
      'enabled': instance.enabled,
      'installedAt': instance.installedAt.toIso8601String(),
      'config': instance.config,
      'status': _$ServiceStatusEnumMap[instance.status]!,
    };

const _$ServiceStatusEnumMap = {
  ServiceStatus.running: 'running',
  ServiceStatus.stopped: 'stopped',
  ServiceStatus.error: 'error',
  ServiceStatus.installing: 'installing',
  ServiceStatus.uninstalling: 'uninstalling',
};

ChatResponse _$ChatResponseFromJson(Map<String, dynamic> json) => ChatResponse(
  id: json['id'] as String,
  content: json['content'] as String,
  timestamp: DateTime.parse(json['timestamp'] as String),
  attachments: (json['attachments'] as List<dynamic>?)
      ?.map((e) => e as String)
      .toList(),
  metadata: json['metadata'] as Map<String, dynamic>?,
);

Map<String, dynamic> _$ChatResponseToJson(ChatResponse instance) =>
    <String, dynamic>{
      'id': instance.id,
      'content': instance.content,
      'timestamp': instance.timestamp.toIso8601String(),
      'attachments': instance.attachments,
      'metadata': instance.metadata,
    };

TaskInfo _$TaskInfoFromJson(Map<String, dynamic> json) => TaskInfo(
  id: json['id'] as String,
  name: json['name'] as String,
  description: json['description'] as String,
  status: $enumDecode(_$TaskStatusEnumMap, json['status']),
  progress: (json['progress'] as num?)?.toDouble(),
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt: DateTime.parse(json['updatedAt'] as String),
  error: json['error'] as String?,
  result: json['result'] as Map<String, dynamic>?,
);

Map<String, dynamic> _$TaskInfoToJson(TaskInfo instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'description': instance.description,
  'status': _$TaskStatusEnumMap[instance.status]!,
  'progress': instance.progress,
  'createdAt': instance.createdAt.toIso8601String(),
  'updatedAt': instance.updatedAt.toIso8601String(),
  'error': instance.error,
  'result': instance.result,
};

const _$TaskStatusEnumMap = {
  TaskStatus.pending: 'pending',
  TaskStatus.running: 'running',
  TaskStatus.completed: 'completed',
  TaskStatus.failed: 'failed',
  TaskStatus.cancelled: 'cancelled',
};

WebSocketMessage _$WebSocketMessageFromJson(Map<String, dynamic> json) =>
    WebSocketMessage(
      type: json['type'] as String,
      data: json['data'] as Map<String, dynamic>,
      timestamp: DateTime.parse(json['timestamp'] as String),
    );

Map<String, dynamic> _$WebSocketMessageToJson(WebSocketMessage instance) =>
    <String, dynamic>{
      'type': instance.type,
      'data': instance.data,
      'timestamp': instance.timestamp.toIso8601String(),
    };

ServiceInstallRequest _$ServiceInstallRequestFromJson(
  Map<String, dynamic> json,
) => ServiceInstallRequest(
  name: json['name'] as String,
  version: json['version'] as String,
  config: json['config'] as Map<String, dynamic>?,
);

Map<String, dynamic> _$ServiceInstallRequestToJson(
  ServiceInstallRequest instance,
) => <String, dynamic>{
  'name': instance.name,
  'version': instance.version,
  'config': instance.config,
};

ChatMessageRequest _$ChatMessageRequestFromJson(Map<String, dynamic> json) =>
    ChatMessageRequest(
      message: json['message'] as String,
      conversationId: json['conversationId'] as String?,
      context: json['context'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$ChatMessageRequestToJson(ChatMessageRequest instance) =>
    <String, dynamic>{
      'message': instance.message,
      'conversationId': instance.conversationId,
      'context': instance.context,
    };

ApiResponse _$ApiResponseFromJson(Map<String, dynamic> json) => ApiResponse(
  success: json['success'] as bool,
  message: json['message'] as String?,
  data: json['data'] as Map<String, dynamic>?,
  error: json['error'] as String?,
);

Map<String, dynamic> _$ApiResponseToJson(ApiResponse instance) =>
    <String, dynamic>{
      'success': instance.success,
      'message': instance.message,
      'data': instance.data,
      'error': instance.error,
    };
