import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:material_design_icons_flutter/material_design_icons_flutter.dart';
import 'dashboard_page.dart';
import 'chat_page.dart';
import 'services_page.dart';
import 'tasks_page.dart';
import 'settings_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedIndex = 0;
  
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _updateSelectedIndex();
  }
  
  void _updateSelectedIndex() {
    final location = GoRouterState.of(context).uri.path;
    switch (location) {
      case '/dashboard':
        _selectedIndex = 0;
        break;
      case '/chat':
        _selectedIndex = 1;
        break;
      case '/services':
        _selectedIndex = 2;
        break;
      case '/tasks':
        _selectedIndex = 3;
        break;
      case '/settings':
        _selectedIndex = 4;
        break;
      default:
        _selectedIndex = 0;
    }
  }

  final List<NavigationDestination> _destinations = [
    NavigationDestination(
      icon: Icon(MdiIcons.viewDashboard),
      label: 'Dashboard',
    ),
    NavigationDestination(
      icon: Icon(MdiIcons.chat),
      label: 'Chat',
    ),
    NavigationDestination(
      icon: Icon(MdiIcons.server),
      label: 'Services',
    ),
    NavigationDestination(
      icon: Icon(MdiIcons.clipboardList),
      label: 'Tasks',
    ),
    NavigationDestination(
      icon: Icon(MdiIcons.cog),
      label: 'Settings',
    ),
  ];

  final List<String> _routes = [
    '/dashboard',
    '/chat',
    '/services',
    '/tasks',
    '/settings',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('MCP Client'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: _buildBody(),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) {
          setState(() {
            _selectedIndex = index;
          });
          context.go(_routes[index]);
        },
        destinations: _destinations,
      ),
    );
  }

  Widget _buildBody() {
    switch (_selectedIndex) {
      case 0:
        return const DashboardPage();
      case 1:
        return const ChatPage();
      case 2:
        return const ServicesPage();
      case 3:
        return const TasksPage();
      case 4:
        return const SettingsPage();
      default:
        return const DashboardPage();
    }
  }
}

// Temporary view components, will be replaced with actual pages later
class DashboardView extends StatelessWidget {
  const DashboardView({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.dashboard, size: 64),
          SizedBox(height: 16),
          Text('Dashboard Page', style: TextStyle(fontSize: 24)),
          Text('Display system status and overview information'),
        ],
      ),
    );
  }
}

class ChatView extends StatelessWidget {
  const ChatView({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.chat, size: 64),
          SizedBox(height: 16),
          Text('Chat Page', style: TextStyle(fontSize: 24)),
          Text('Interact with LLM through conversations'),
        ],
      ),
    );
  }
}

class ServicesView extends StatelessWidget {
  const ServicesView({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.settings, size: 64),
          SizedBox(height: 16),
          Text('Service Management Page', style: TextStyle(fontSize: 24)),
          Text('Manage MCP service configurations'),
        ],
      ),
    );
  }
}

class TasksView extends StatelessWidget {
  const TasksView({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.list, size: 64),
          SizedBox(height: 16),
          Text('Task Monitoring Page', style: TextStyle(fontSize: 24)),
          Text('Real-time display of task execution progress'),
        ],
      ),
    );
  }
}

class SettingsView extends StatelessWidget {
  const SettingsView({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.settings, size: 64),
          SizedBox(height: 16),
          Text('Settings Page', style: TextStyle(fontSize: 24)),
        Text('Application settings and configuration'),
        ],
      ),
    );
  }
}