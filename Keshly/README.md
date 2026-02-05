# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

## Keshly Project Documentation

### Overview

Keshly is a React Native application using Expo and Supabase for authentication and backend services. The project is structured to support authentication flows and main app features using a modular folder structure and Expo Router for navigation.

### Project Structure

```
app.json
eslint.config.js
expo-env.d.ts
package.json
README.md
tsconfig.json
app/
   _layout.tsx
   +not-found.tsx
   (auth)/
      _layout.tsx
      sign-in.tsx
      sign-up.tsx
   (tabs)/
      _layout.tsx
      index.tsx
      scan.tsx
      stats.tsx
      usersettings.tsx
assets/
   images/
components/
   Account.tsx
   Auth.tsx
   Graph.tsx
   sraper.js
lib/
   supabase.ts
utils/
   supabase.ts
```

### Key Folders and Files

- **app/**: Main application code, including navigation layouts and screens.
  - **\_layout.tsx**: Root layout handling authentication state and navigation.
  - **(auth)/**: Authentication-related screens (sign-in, sign-up).
  - **(tabs)/**: Main app screens (dashboard, scan, stats, user settings).
- **components/**: Reusable React Native components.
- **lib/supabase.ts**: Supabase client setup and configuration.
- **utils/supabase.ts**: Utility functions for Supabase integration.
- **assets/images/**: Static image assets.

### Authentication Flow

- Uses Supabase Auth for user authentication.
- The root layout (`app/_layout.tsx`) manages session state and redirects users based on authentication status:
  - Unauthenticated users are redirected to the sign-in screen.
  - Authenticated users are redirected to the main app tabs.
- Session is refreshed automatically when the app is active.

### Navigation

- Uses [Expo Router](https://docs.expo.dev/router/introduction/) for file-based navigation.
- Auth and main app screens are separated into `(auth)` and `(tabs)` folders for clear routing.

### Getting Started

1. **Install dependencies:**
   ```sh
   npm install
   # or
   yarn install
   ```
2. **Set up environment variables:**
   - Configure Supabase credentials in `lib/supabase.ts`.
3. **Run the app:**
   ```sh
   npx expo start
   ```

### Scripts

- `npm start` / `npx expo start`: Start the Expo development server.
- `npm run lint`: Run ESLint for code quality checks.

### Linting & TypeScript

- ESLint is configured via `eslint.config.js`.
- TypeScript configuration is in `tsconfig.json`.

### Contributing

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Submit a pull request with a clear description of your changes.

### License

See `LICENSE` file for details (if present).

### Contact

For questions or support, please open an issue on the repository.
In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
