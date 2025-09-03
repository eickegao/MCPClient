# MCP Client - Model Context Protocol Desktop Application

A cross-platform desktop application built with Flutter that serves as a client for Model Context Protocol (MCP) services. This application provides an intuitive interface for interacting with Large Language Models and managing MCP services.

## Features

### 🖥️ Desktop Application
- **Cross-platform**: Supports macOS, Windows, and Linux
- **Modern UI**: Material Design with English interface
- **Responsive**: Adaptive layout for different screen sizes

### 📱 Core Pages
- **Dashboard**: Main control panel with service status and task overview
- **Chat**: Interactive interface for communicating with MCP services
- **Services**: Manage and configure MCP services
- **Monitor**: Real-time task execution monitoring
- **Settings**: Configure LLM providers and application preferences

### 🔧 Technical Features
- **State Management**: Provider pattern for efficient state handling
- **HTTP Client**: Integrated dio library for network communication
- **Navigation**: Sidebar navigation with smooth transitions
- **Theming**: Customizable Material Design theme

## Project Structure

```
MCPClient/
├── Client/                 # Flutter Desktop Application
│   └── mcp_client/
│       ├── lib/
│       │   ├── main.dart
│       │   ├── pages/      # Application pages
│       │   ├── services/   # HTTP client and services
│       │   └── providers/  # State management
│       └── pubspec.yaml
├── Server/                 # Future MCP Server Implementation
└── .trae/
    └── documents/         # Project documentation
```

## Getting Started

### Prerequisites
- Flutter SDK (latest stable version)
- Dart SDK
- Platform-specific development tools:
  - **macOS**: Xcode
  - **Windows**: Visual Studio with C++ tools
  - **Linux**: Build essentials

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/MCPClient.git
cd MCPClient
```

2. Navigate to the client directory:
```bash
cd Client/mcp_client
```

3. Install dependencies:
```bash
flutter pub get
```

4. Run the application:
```bash
flutter run -d macos    # For macOS
flutter run -d windows  # For Windows
flutter run -d linux    # For Linux
```

## Development

### Hot Reload
- Press `r` for hot reload
- Press `R` for hot restart
- Press `h` for help

### Debug Tools
- Flutter DevTools available at: http://127.0.0.1:9102
- Dart VM Service for debugging

## Architecture

The application follows a modular architecture:

- **Presentation Layer**: Flutter widgets and pages
- **Business Logic**: Provider-based state management
- **Data Layer**: HTTP services and local storage
- **Platform Layer**: Native platform integrations

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Roadmap

- [ ] Implement MCP Server backend
- [ ] Add real-time WebSocket communication
- [ ] Integrate with popular LLM providers
- [ ] Add plugin system for custom MCP services
- [ ] Implement user authentication
- [ ] Add data persistence and caching

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in `.trae/documents/`

---

## 🚀 Quick Start Guide for GitHub

To push this project to GitHub:

### 1. Create a new repository on GitHub
- Go to https://github.com/new
- Repository name: `MCPClient`
- Description: `Model Context Protocol Desktop Client - Flutter Application`
- Choose Public or Private
- **DO NOT** initialize with README, .gitignore, or license (we already have these)

### 2. Add GitHub remote and push
```bash
# Add your GitHub repository as remote origin
git remote add origin https://github.com/YOUR_USERNAME/MCPClient.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 3. Verify the upload
- Visit your repository on GitHub
- Ensure all files are uploaded correctly
- Check that the README displays properly

### 4. Optional: Set up GitHub Pages or Releases
- Enable GitHub Pages for documentation
- Create releases for version management
- Set up GitHub Actions for CI/CD

Your MCP Client project is now ready on GitHub! 🎉