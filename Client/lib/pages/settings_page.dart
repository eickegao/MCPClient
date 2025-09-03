import 'package:flutter/material.dart';
import 'package:material_design_icons_flutter/material_design_icons_flutter.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  bool _darkMode = false;
  bool _notifications = true;
  bool _autoStart = false;
  bool _minimizeToTray = true;
  double _fontSize = 14.0;
  String _language = 'zh_CN';
  String _theme = 'system';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: ListView(
        children: [
          _buildSection(
            title: 'Appearance',
            icon: MdiIcons.palette,
            children: [
              _buildThemeSelector(),
              _buildSwitchTile(
                title: 'Dark Mode',
                subtitle: 'Use dark theme',
                icon: MdiIcons.themeLightDark,
                value: _darkMode,
                onChanged: (value) {
                  setState(() {
                    _darkMode = value;
                  });
                },
              ),
              _buildSliderTile(
                title: 'Font Size',
                subtitle: 'Adjust interface font size',
                icon: MdiIcons.formatSize,
                value: _fontSize,
                min: 12.0,
                max: 20.0,
                divisions: 8,
                onChanged: (value) {
                  setState(() {
                    _fontSize = value;
                  });
                },
              ),
              _buildLanguageSelector(),
            ],
          ),
          _buildSection(
            title: 'Notifications',
            icon: MdiIcons.bell,
            children: [
              _buildSwitchTile(
                title: 'Enable Notifications',
                subtitle: 'Receive task and service status notifications',
                icon: MdiIcons.bellRing,
                value: _notifications,
                onChanged: (value) {
                  setState(() {
                    _notifications = value;
                  });
                },
              ),
              _buildListTile(
                title: 'Notification Settings',
                subtitle: 'Configure notification types and frequency',
                icon: MdiIcons.bellCog,
                onTap: _showNotificationSettings,
              ),
            ],
          ),
          _buildSection(
            title: 'Application Behavior',
            icon: MdiIcons.cog,
            children: [
              _buildSwitchTile(
                title: 'Auto Start',
                subtitle: 'Automatically run application on system startup',
                icon: MdiIcons.powerOn,
                value: _autoStart,
                onChanged: (value) {
                  setState(() {
                    _autoStart = value;
                  });
                },
              ),
              _buildSwitchTile(
                title: 'Minimize to Tray',
                subtitle: 'Minimize to system tray when closing window',
                icon: MdiIcons.windowMinimize,
                value: _minimizeToTray,
                onChanged: (value) {
                  setState(() {
                    _minimizeToTray = value;
                  });
                },
              ),
            ],
          ),
          _buildSection(
            title: 'Connection',
            icon: MdiIcons.connection,
            children: [
              _buildListTile(
                title: 'Server Configuration',
                subtitle: 'Configure MCP server connection',
                icon: MdiIcons.server,
                onTap: _showServerSettings,
              ),
              _buildListTile(
                title: 'Proxy Settings',
                subtitle: 'Configure network proxy',
                icon: MdiIcons.server,
                onTap: _showProxySettings,
              ),
              _buildListTile(
                title: 'Connection Test',
                subtitle: 'Test server connection status',
                icon: MdiIcons.testTube,
                onTap: _testConnection,
              ),
            ],
          ),
          _buildSection(
            title: 'Data',
            icon: MdiIcons.database,
            children: [
              _buildListTile(
                title: 'Clear Cache',
                subtitle: 'Clear application cache data',
                icon: MdiIcons.broom,
                onTap: _clearCache,
              ),
              _buildListTile(
                title: 'Export Data',
                subtitle: 'Export chat history and settings',
                icon: MdiIcons.export,
                onTap: _exportData,
              ),
              _buildListTile(
                title: 'Import Data',
                subtitle: 'Import data from file',
                icon: MdiIcons.import,
                onTap: _importData,
              ),
            ],
          ),
          _buildSection(
            title: 'About',
            icon: MdiIcons.information,
            children: [
              _buildListTile(
                title: 'Version Info',
                subtitle: 'MCP Client v1.0.0',
                icon: MdiIcons.informationOutline,
                onTap: _showVersionInfo,
              ),
              _buildListTile(
                title: 'Check for Updates',
                subtitle: 'Check for application updates',
                icon: MdiIcons.update,
                onTap: _checkForUpdates,
              ),
              _buildListTile(
                title: 'Help Documentation',
                subtitle: 'View usage help',
                icon: MdiIcons.helpCircle,
                onTap: _showHelp,
              ),
              _buildListTile(
                title: 'Feedback',
                subtitle: 'Submit issues or suggestions',
                icon: MdiIcons.messageText,
                onTap: _showFeedback,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSection({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
          child: Row(
            children: [
              Icon(
                icon,
                size: 20,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(width: 8),
              Text(
                title,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Theme.of(context).colorScheme.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        ...children,
      ],
    );
  }

  Widget _buildListTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required VoidCallback onTap,
    Widget? trailing,
  }) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: trailing ?? Icon(MdiIcons.chevronRight),
      onTap: onTap,
    );
  }

  Widget _buildSwitchTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return SwitchListTile(
      secondary: Icon(icon),
      title: Text(title),
      subtitle: Text(subtitle),
      value: value,
      onChanged: onChanged,
    );
  }

  Widget _buildSliderTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required double value,
    required double min,
    required double max,
    required int divisions,
    required ValueChanged<double> onChanged,
  }) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(subtitle),
          Slider(
            value: value,
            min: min,
            max: max,
            divisions: divisions,
            label: value.round().toString(),
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }

  Widget _buildThemeSelector() {
    return ListTile(
      leading: Icon(MdiIcons.palette),
      title: const Text('Theme'),
      subtitle: Text(_getThemeText(_theme)),
      trailing: Icon(MdiIcons.chevronRight),
      onTap: () {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Select Theme'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                RadioListTile<String>(
                  title: const Text('Follow System'),
                  value: 'system',
                  groupValue: _theme,
                  onChanged: (value) {
                    setState(() {
                      _theme = value!;
                    });
                    Navigator.of(context).pop();
                  },
                ),
                RadioListTile<String>(
                  title: const Text('Light'),
                  value: 'light',
                  groupValue: _theme,
                  onChanged: (value) {
                    setState(() {
                      _theme = value!;
                    });
                    Navigator.of(context).pop();
                  },
                ),
                RadioListTile<String>(
                  title: const Text('Dark'),
                  value: 'dark',
                  groupValue: _theme,
                  onChanged: (value) {
                    setState(() {
                      _theme = value!;
                    });
                    Navigator.of(context).pop();
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildLanguageSelector() {
    return ListTile(
      leading: Icon(MdiIcons.translate),
      title: const Text('Language'),
      subtitle: Text(_getLanguageText(_language)),
      trailing: Icon(MdiIcons.chevronRight),
      onTap: () {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Select Language'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                RadioListTile<String>(
                  title: const Text('Simplified Chinese'),
                  value: 'zh_CN',
                  groupValue: _language,
                  onChanged: (value) {
                    setState(() {
                      _language = value!;
                    });
                    Navigator.of(context).pop();
                  },
                ),
                RadioListTile<String>(
                  title: const Text('English'),
                  value: 'en_US',
                  groupValue: _language,
                  onChanged: (value) {
                    setState(() {
                      _language = value!;
                    });
                    Navigator.of(context).pop();
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _getThemeText(String theme) {
    switch (theme) {
      case 'system':
        return 'Follow System';
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'Follow System';
    }
  }

  String _getLanguageText(String language) {
    switch (language) {
      case 'zh_CN':
        return 'Simplified Chinese';
      case 'en_US':
        return 'English';
      default:
        return 'English';
    }
  }

  void _showNotificationSettings() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Notification Settings',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            SwitchListTile(
              title: const Text('Task Completion Notifications'),
              value: true,
              onChanged: (value) {},
            ),
            SwitchListTile(
              title: const Text('Service Status Notifications'),
              value: true,
              onChanged: (value) {},
            ),
            SwitchListTile(
              title: const Text('Error Notifications'),
              value: true,
              onChanged: (value) {},
            ),
          ],
        ),
      ),
    );
  }

  void _showServerSettings() {
    // TODO: Implement server settings
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Server settings feature under development...')),
    );
  }

  void _showProxySettings() {
    // TODO: Implement proxy settings
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Proxy settings feature under development...')),
    );
  }

  void _testConnection() async {
    // TODO: Implement connection test
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Testing connection...')),
    );
    
    await Future.delayed(const Duration(seconds: 2));
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Connection test successful'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  void _clearCache() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Cache'),
        content: const Text('Are you sure you want to clear all cache data?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Cache cleared')),
              );
            },
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
  }

  void _exportData() {
    // TODO: Implement data export
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Data export feature under development...')),
    );
  }

  void _importData() {
    // TODO: Implement data import
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Data import feature under development...')),
    );
  }

  void _showVersionInfo() {
    showAboutDialog(
      context: context,
      applicationName: 'MCP Client',
      applicationVersion: '1.0.0',
      applicationIcon: Icon(
        MdiIcons.robot,
        size: 48,
      ),
      children: [
        const Text('A modern MCP client application'),
        const SizedBox(height: 8),
        const Text('Built with Flutter'),
      ],
    );
  }

  void _checkForUpdates() async {
    // TODO: Implement update check
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Checking for updates...')),
    );
    
    await Future.delayed(const Duration(seconds: 2));
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('You are using the latest version')),
      );
    }
  }

  void _showHelp() {
    // TODO: Implement help documentation
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Help documentation feature under development...')),
    );
  }

  void _showFeedback() {
    // TODO: Implement feedback feature
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Feedback feature under development...')),
    );
  }
}