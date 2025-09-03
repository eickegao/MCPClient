import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:material_design_icons_flutter/material_design_icons_flutter.dart';
import '../providers/app_state.dart';
import '../widgets/task_list_widget.dart';

class TasksPage extends StatefulWidget {
  const TasksPage({super.key});

  @override
  State<TasksPage> createState() => _TasksPageState();
}

class _TasksPageState extends State<TasksPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  TaskStatus? _filterStatus;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Task Management'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(text: 'All'),
            Tab(text: 'Running'),
            Tab(text: 'Completed'),
            Tab(text: 'Failed'),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(MdiIcons.refresh),
            onPressed: _refreshTasks,
            tooltip: 'Refresh',
          ),
          IconButton(
            icon: Icon(MdiIcons.filterVariant),
            onPressed: _showFilterDialog,
            tooltip: 'Filter',
          ),
          IconButton(
            icon: Icon(MdiIcons.plus),
            onPressed: _showCreateTaskDialog,
            tooltip: 'Create Task',
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSearchAndFilter(),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildTaskList(null),
                _buildTaskList(TaskStatus.running),
                _buildTaskList(TaskStatus.completed),
                _buildTaskList(TaskStatus.failed),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchAndFilter() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search tasks...',
                prefixIcon: Icon(MdiIcons.magnify),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: Icon(MdiIcons.close),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {
                            _searchQuery = '';
                          });
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onChanged: (value) {
                setState(() {
                  _searchQuery = value;
                });
              },
            ),
          ),
          if (_filterStatus != null) ...[
            const SizedBox(width: 8),
            Chip(
              label: Text(_getStatusText(_filterStatus!)),
              onDeleted: () {
                setState(() {
                  _filterStatus = null;
                });
              },
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTaskList(TaskStatus? statusFilter) {
    return Consumer<AppState>(
      builder: (context, appState, child) {
        var tasks = appState.tasks.where((task) {
          // Status filter
          if (statusFilter != null && task.status != statusFilter) {
            return false;
          }
          
          // Additional filter
          if (_filterStatus != null && task.status != _filterStatus) {
            return false;
          }
          
          // Search filter
          if (_searchQuery.isNotEmpty) {
            final query = _searchQuery.toLowerCase();
            return task.name.toLowerCase().contains(query) ||
                task.description.toLowerCase().contains(query);
          }
          
          return true;
        }).toList();

        // Sort by creation time
        tasks.sort((a, b) => b.createdAt.compareTo(a.createdAt));

        if (tasks.isEmpty) {
          return _buildEmptyState(statusFilter);
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: tasks.length,
          itemBuilder: (context, index) {
            final task = tasks[index];
            return TaskCard(
              task: task,
              onTap: () => _showTaskDetails(task),
              onCancel: task.status == TaskStatus.running
                  ? () => _cancelTask(task)
                  : null,
              onRetry: task.status == TaskStatus.failed
                  ? () => _retryTask(task)
                  : null,
            );
          },
        );
      },
    );
  }

  Widget _buildEmptyState(TaskStatus? statusFilter) {
    String title;
    String subtitle;
    IconData icon;

    switch (statusFilter) {
      case TaskStatus.running:
        title = 'No Running Tasks';
        subtitle = 'All tasks are completed or paused';
        icon = MdiIcons.play;
        break;
      case TaskStatus.completed:
        title = 'No Completed Tasks';
        subtitle = 'Completed tasks will appear here';
        icon = MdiIcons.checkCircle;
        break;
      case TaskStatus.failed:
        title = 'No Failed Tasks';
        subtitle = 'Failed tasks will appear here';
        icon = MdiIcons.alertCircle;
        break;
      default:
        title = 'No Tasks';
        subtitle = 'Click the add button in the top right to create a new task';
        icon = MdiIcons.clipboardList;
    }

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 64,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  void _refreshTasks() async {
    // TODO: Implement refresh task list
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Refreshing task list...')),
    );
  }

  void _showFilterDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Filter Tasks'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: TaskStatus.values.map((status) {
            return RadioListTile<TaskStatus?>(
              title: Text(_getStatusText(status)),
              value: status,
              groupValue: _filterStatus,
              onChanged: (value) {
                setState(() {
                  _filterStatus = value;
                });
                Navigator.of(context).pop();
              },
            );
          }).toList()
            ..insert(
              0,
              RadioListTile<TaskStatus?>(
                title: const Text('All'),
                value: null,
                groupValue: _filterStatus,
                onChanged: (value) {
                  setState(() {
                    _filterStatus = value;
                  });
                  Navigator.of(context).pop();
                },
              ),
            ),
        ),
      ),
    );
  }

  void _showCreateTaskDialog() {
    final nameController = TextEditingController();
    final descriptionController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Create Task'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(
                labelText: 'Task Name',
                hintText: 'Enter task name',
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: descriptionController,
              decoration: const InputDecoration(
                labelText: 'Task Description',
                hintText: 'Enter task description',
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (nameController.text.isNotEmpty) {
                _createTask(
                  nameController.text,
                  descriptionController.text,
                );
                Navigator.of(context).pop();
              }
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }

  void _createTask(String name, String description) {
    final appState = Provider.of<AppState>(context, listen: false);
    final task = Task(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      name: name,
      description: description.isEmpty ? 'No description' : description,
      status: TaskStatus.pending,
      createdAt: DateTime.now(),
    );
    
    appState.addTask(task);
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Task "$name" created successfully')),
    );
  }

  void _showTaskDetails(Task task) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  _buildStatusIcon(task.status),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          task.name,
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        Text(
                          _getStatusText(task.status),
                          style: TextStyle(
                            color: _getStatusColor(task.status),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                'Description',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Text(
                task.description,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 16),
              if (task.progress != null && task.status == TaskStatus.running) ...[
                Text(
                  'Progress',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: task.progress,
                  backgroundColor: Colors.grey.withAlpha(51),
                ),
                const SizedBox(height: 4),
                Text(
                  '${(task.progress! * 100).toInt()}%',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: 16),
              ],
              Text(
                'Created',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Text(
                _formatDateTime(task.createdAt),
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  if (task.status == TaskStatus.running)
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.of(context).pop();
                          _cancelTask(task);
                        },
                        child: const Text('Cancel Task'),
                      ),
                    ),
                  if (task.status == TaskStatus.failed) ...[
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.of(context).pop();
                          _retryTask(task);
                        },
                        child: const Text('Retry'),
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.of(context).pop();
                        _deleteTask(task);
                      },
                      child: const Text('Delete'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusIcon(TaskStatus status) {
    IconData icon;
    Color color;
    
    switch (status) {
      case TaskStatus.pending:
        icon = MdiIcons.clockOutline;
        color = Colors.orange;
        break;
      case TaskStatus.running:
        icon = MdiIcons.play;
        color = Colors.blue;
        break;
      case TaskStatus.completed:
        icon = MdiIcons.checkCircle;
        color = Colors.green;
        break;
      case TaskStatus.failed:
        icon = MdiIcons.alertCircle;
        color = Colors.red;
        break;
    }
    
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: color.withAlpha(26),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(
        icon,
        size: 24,
        color: color,
      ),
    );
  }

  Color _getStatusColor(TaskStatus status) {
    switch (status) {
      case TaskStatus.pending:
        return Colors.orange;
      case TaskStatus.running:
        return Colors.blue;
      case TaskStatus.completed:
        return Colors.green;
      case TaskStatus.failed:
        return Colors.red;
    }
  }

  String _getStatusText(TaskStatus status) {
    switch (status) {
      case TaskStatus.pending:
        return 'Pending';
      case TaskStatus.running:
        return 'Running';
      case TaskStatus.completed:
        return 'Completed';
      case TaskStatus.failed:
        return 'Failed';
    }
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.year}/${dateTime.month.toString().padLeft(2, '0')}/${dateTime.day.toString().padLeft(2, '0')} '
        '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  void _cancelTask(Task task) {
    final appState = Provider.of<AppState>(context, listen: false);
    appState.updateTask(task.copyWith(status: TaskStatus.failed));
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Task "${task.name}" cancelled')),
    );
  }

  void _retryTask(Task task) {
    final appState = Provider.of<AppState>(context, listen: false);
    appState.updateTask(task.copyWith(
      status: TaskStatus.pending,
      progress: null,
    ));
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Task "${task.name}" restarted')),
    );
  }

  void _deleteTask(Task task) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Task'),
        content: Text('Are you sure you want to delete task "${task.name}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              final appState = Provider.of<AppState>(context, listen: false);
              appState.removeTask(task.id);
              Navigator.of(context).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Task "${task.name}" deleted')),
              );
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}