import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:material_design_icons_flutter/material_design_icons_flutter.dart';
import '../providers/app_state.dart';
import '../widgets/service_list_widget.dart';

class ServicesPage extends StatefulWidget {
  const ServicesPage({super.key});

  @override
  State<ServicesPage> createState() => _ServicesPageState();
}

class _ServicesPageState extends State<ServicesPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
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
        title: const Text('MCP Services'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Installed'),
            Tab(text: 'Available'),
            Tab(text: 'Running'),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(MdiIcons.refresh),
            onPressed: _refreshServices,
            tooltip: 'Refresh',
          ),
          IconButton(
            icon: Icon(MdiIcons.plus),
            onPressed: _showAddServiceDialog,
            tooltip: 'Add Service',
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSearchBar(),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildInstalledServices(),
                _buildAvailableServices(),
                _buildRunningServices(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: 'Search services...',
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
    );
  }

  Widget _buildInstalledServices() {
    return Consumer<AppState>(
      builder: (context, appState, child) {
        final services = appState.services
            .where((service) => _matchesSearch(service))
            .toList();

        if (services.isEmpty) {
          return _buildEmptyState(
            icon: MdiIcons.packageVariant,
            title: 'No installed services',
            subtitle: 'Click the add button in the top right to install new services',
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: services.length,
          itemBuilder: (context, index) {
            final service = services[index];
            return ServiceCard(
              service: service,
              onTap: () => _showServiceDetails(service),
              onToggle: () => _toggleService(service),
              onConfigure: () => _configureService(service),
              onRemove: () => _removeService(service),
            );
          },
        );
      },
    );
  }

  Widget _buildAvailableServices() {
    // 模拟可用服务数据
    final availableServices = [
      _createMockService('File Manager', 'Manage local file system', '1.0.0', false),
      _createMockService('Data Analyzer', 'Analyze and process data', '2.1.0', false),
      _createMockService('Web Scraper', 'Scrape web page data', '1.5.0', false),
      _createMockService('Image Processor', 'Process and edit images', '3.0.0', false),
    ];

    final filteredServices = availableServices
        .where((service) => _matchesSearch(service))
        .toList();

    if (filteredServices.isEmpty) {
      return _buildEmptyState(
        icon: MdiIcons.cloudDownload,
        title: 'No available services',
            subtitle: 'Check network connection or try again later',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: filteredServices.length,
      itemBuilder: (context, index) {
        final service = filteredServices[index];
        return Card(
          child: ListTile(
            leading: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: Colors.blue.withAlpha(25),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                MdiIcons.puzzle,
                color: Colors.blue,
              ),
            ),
            title: Text(service.name),
            subtitle: Text(service.description),
            trailing: ElevatedButton(
              onPressed: () => _installService(service),
              child: const Text('Install'),
            ),
          ),
        );
      },
    );
  }

  Widget _buildRunningServices() {
    return Consumer<AppState>(
      builder: (context, appState, child) {
        final runningServices = appState.services
            .where((service) => service.isEnabled && _matchesSearch(service))
            .toList();

        if (runningServices.isEmpty) {
          return _buildEmptyState(
            icon: MdiIcons.play,
            title: 'No running services',
            subtitle: 'Enable installed services to start using them',
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: runningServices.length,
          itemBuilder: (context, index) {
            final service = runningServices[index];
            return Card(
              child: ListTile(
                leading: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: Colors.green.withAlpha(25),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    MdiIcons.play,
                    color: Colors.green,
                  ),
                ),
                title: Text(service.name),
                subtitle: Text('Running time: ${_getRunningTime(service)}'),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: Icon(MdiIcons.pause),
                      onPressed: () => _toggleService(service),
                      tooltip: 'Pause',
                    ),
                    IconButton(
                      icon: Icon(MdiIcons.chartLine),
                      onPressed: () => _showServiceStats(service),
                      tooltip: 'Statistics',
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
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

  bool _matchesSearch(MCPService service) {
    if (_searchQuery.isEmpty) return true;
    final query = _searchQuery.toLowerCase();
    return service.name.toLowerCase().contains(query) ||
        service.description.toLowerCase().contains(query);
  }

  MCPService _createMockService(
      String name, String description, String version, bool isEnabled) {
    return MCPService(
      id: name.toLowerCase().replaceAll(' ', '_'),
      name: name,
      description: description,
      version: version,
      isEnabled: isEnabled,
      installedAt: DateTime.now(),
    );
  }

  String _getRunningTime(MCPService service) {
    final duration = DateTime.now().difference(service.installedAt);
    if (duration.inHours > 0) {
      return '${duration.inHours}h ${duration.inMinutes % 60}m';
    } else {
      return '${duration.inMinutes}m';
    }
  }

  void _refreshServices() async {
    // TODO: Implement refresh service list
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Refreshing service list...')),
    );
  }

  void _showAddServiceDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Service'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(MdiIcons.web),
              title: Text('Install from URL'),
              onTap: () {
                Navigator.of(context).pop();
                _showInstallFromUrlDialog();
              },
            ),
            ListTile(
              leading: Icon(MdiIcons.fileUpload),
              title: Text('Install from File'),
              onTap: () {
                Navigator.of(context).pop();
                _installFromFile();
              },
            ),
            ListTile(
              leading: Icon(MdiIcons.store),
              title: Text('Install from Store'),
              onTap: () {
                Navigator.of(context).pop();
                _tabController.animateTo(1);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showInstallFromUrlDialog() {
    final urlController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Install from URL'),
        content: TextField(
          controller: urlController,
          decoration: const InputDecoration(
            labelText: 'Service URL',
            hintText: 'https://example.com/service.json',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              _installFromUrl(urlController.text);
            },
            child: const Text('Install'),
          ),
        ],
      ),
    );
  }

  void _installFromUrl(String url) {
    // TODO: Implement install service from URL
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Installing service from $url...')),
    );
  }

  void _installFromFile() {
    // TODO: Implement install service from file
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Selecting file...')),
    );
  }

  void _installService(MCPService service) {
    Provider.of<AppState>(context, listen: false).addService(service.copyWith(isEnabled: false));
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('${service.name} installed successfully')),
    );
  }

  void _showServiceDetails(MCPService service) {
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
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: service.isEnabled
                          ? Colors.green.withAlpha(26)
                          : Colors.grey.withAlpha(26),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      MdiIcons.puzzle,
                      color: service.isEnabled ? Colors.green : Colors.grey,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          service.name,
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        Text(
                          'v${service.version}',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                service.description,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => _toggleService(service),
                      child: Text(service.isEnabled ? 'Disable' : 'Enable'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _configureService(service),
                      child: const Text('Configure'),
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

  void _toggleService(MCPService service) {
    // TODO: Implement updateService method
    // Provider.of<AppState>(context, listen: false).updateService(service.copyWith(isEnabled: !service.isEnabled));
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          '${service.name} ${service.isEnabled ? "disabled" : "enabled"}',
        ),
      ),
    );
  }

  void _configureService(MCPService service) {
    // TODO: Implement service configuration
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Configuring ${service.name}...')),
    );
  }

  void _removeService(MCPService service) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Service'),
        content: Text('Are you sure you want to remove ${service.name}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              final appState = Provider.of<AppState>(context, listen: false);
              appState.removeService(service.id);
              Navigator.of(context).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('${service.name} removed')),
              );
            },
            child: const Text('Remove'),
          ),
        ],
      ),
    );
  }

  void _showServiceStats(MCPService service) {
    // TODO: Implement service statistics
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Viewing ${service.name} statistics...')),
    );
  }
}

extension on MCPService {
  MCPService copyWith({
    String? id,
    String? name,
    String? description,
    String? version,
    bool? isEnabled,
    DateTime? installedAt,
  }) {
    return MCPService(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      version: version ?? this.version,
      isEnabled: isEnabled ?? this.isEnabled,
      installedAt: installedAt ?? this.installedAt,
    );
  }
}