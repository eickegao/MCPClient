import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:material_design_icons_flutter/material_design_icons_flutter.dart';
import '../providers/app_state.dart';
import '../widgets/status_card.dart';
import '../widgets/service_list_widget.dart';
import '../widgets/task_list_widget.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    // TODO: Load dashboard data
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadDashboardData,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildWelcomeSection(),
              const SizedBox(height: 24),
              _buildStatusCards(),
              const SizedBox(height: 24),
              _buildQuickActions(),
              const SizedBox(height: 24),
              _buildRecentActivity(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWelcomeSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Icon(
              MdiIcons.robot,
              size: 48,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Welcome to MCP Client',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Manage your Model Context Protocol services',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCards() {
    return Consumer<AppState>(
      builder: (context, appState, child) {
        return Row(
          children: [
            Expanded(
              child: StatusCard(
                title: 'Server Status',
                value: appState.isConnected ? 'Connected' : 'Disconnected',
                icon: appState.isConnected
                    ? MdiIcons.checkCircle
                    : MdiIcons.closeCircle,
                color: appState.isConnected
                    ? Colors.green
                    : Colors.red,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: StatusCard(
                title: 'Active Services',
                value: '${appState.services.where((s) => s.isEnabled).length}',
                icon: MdiIcons.server,
                color: Colors.blue,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: StatusCard(
                title: 'Running Tasks',
                value: '${appState.activeTasks.where((t) => t.status == TaskStatus.running).length}',
                icon: MdiIcons.play,
                color: Colors.orange,
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildQuickActions() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Quick Actions',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                _buildActionButton(
                  'Start Chat',
                  MdiIcons.chat,
                  () => _navigateToChat(),
                ),
                _buildActionButton(
                  'Manage Services',
                  MdiIcons.cog,
                  () => _navigateToServices(),
                ),
                _buildActionButton(
                  'View Tasks',
                  MdiIcons.clipboardList,
                  () => _navigateToTasks(),
                ),
                _buildActionButton(
                  'System Settings',
                  MdiIcons.cog,
                  () => _navigateToSettings(),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton(
    String label,
    IconData icon,
    VoidCallback onPressed,
  ) {
    return ElevatedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon),
      label: Text(label),
      style: ElevatedButton.styleFrom(
        padding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 12,
        ),
      ),
    );
  }

  Widget _buildRecentActivity() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Recent Activity',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 16),
        const TaskListWidget(),
        const SizedBox(height: 16),
        const ServiceListWidget(),
      ],
    );
  }

  void _navigateToChat() {
    // TODO: Navigate to chat page
  }

  void _navigateToServices() {
    // TODO: Navigate to service management page
  }

  void _navigateToTasks() {
    // TODO: Navigate to tasks page
  }

  void _navigateToSettings() {
    // TODO: Navigate to settings page
  }
}