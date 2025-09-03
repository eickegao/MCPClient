import 'package:go_router/go_router.dart';
import 'pages/home_page.dart';

final GoRouter router = GoRouter(
  initialLocation: '/dashboard',
  routes: [
    GoRoute(
      path: '/dashboard',
      builder: (context, state) => const HomePage(),
    ),
    GoRoute(
      path: '/chat',
      builder: (context, state) => const HomePage(),
    ),
    GoRoute(
      path: '/services',
      builder: (context, state) => const HomePage(),
    ),
    GoRoute(
      path: '/tasks',
      builder: (context, state) => const HomePage(),
    ),
    GoRoute(
      path: '/settings',
      builder: (context, state) => const HomePage(),
    ),
  ],
);