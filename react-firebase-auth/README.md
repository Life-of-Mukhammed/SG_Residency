# React Firebase Authentication

This is a standalone React + Firebase Authentication example built with:

- React functional components and hooks
- Firebase v9 modular SDK
- React Router DOM
- Plain CSS for simple styling

## Features

- Continue with Google
- Email/password registration
- Send email verification after registration
- Block login until email is verified
- Email/password login
- Resend verification email
- Protected dashboard route
- Session stays active after refresh
- Logout
- Loading states and error messages

## Folder Structure

```text
react-firebase-auth/
  .env.example
  index.html
  package.json
  vite.config.js
  src/
    App.jsx
    firebase.js
    main.jsx
    styles.css
    components/
      AuthCard.jsx
    context/
      AuthContext.jsx
    pages/
      DashboardPage.jsx
      LoginPage.jsx
      RegisterPage.jsx
    routes/
      ProtectedRoute.jsx
```

## Step 1: Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click `Add project`.
3. Create a new Firebase project.

## Step 2: Add a Web App

1. Inside your Firebase project, click the web icon `</>`.
2. Register your app.
3. Firebase will show you a config object.
4. Copy those values into a new `.env` file.

Example:

```bash
cp .env.example .env
```

Then update `.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Step 3: Enable authentication methods

### Enable Email/Password

1. Open Firebase Console.
2. Go to `Authentication`.
3. Click `Get started`.
4. Open the `Sign-in method` tab.
5. Enable `Email/Password`.
6. Save.

### Enable Google login

1. In the same `Sign-in method` tab, open `Google`.
2. Click `Enable`.
3. Choose a support email.
4. Save.

## Step 4: Add authorized domain for local development

In Firebase Authentication settings:

1. Open the `Settings` tab.
2. Make sure `localhost` is listed under authorized domains.

## Step 5: Install dependencies

Run inside this folder:

```bash
npm install
```

## Step 6: Start the app

```bash
npm run dev
```

Then open the local URL shown by Vite.

## How It Works

### `src/firebase.js`

- Initializes Firebase
- Creates the auth instance
- Creates `GoogleAuthProvider`
- Sets local persistence so the user stays logged in after refresh

### `src/context/AuthContext.jsx`

This file keeps all auth logic in one place:

- `registerWithEmail`
  - Creates a new user
  - Updates display name
  - Sends email verification
  - Signs the user out until they verify

- `loginWithEmail`
  - Logs the user in
  - Reloads the user from Firebase
  - Checks `emailVerified`
  - If not verified, signs them out and throws an error

- `loginWithGoogle`
  - Opens Google popup login

- `resendVerificationEmail`
  - Signs in temporarily
  - Sends another verification email
  - Signs out again

- `onAuthStateChanged`
  - Watches auth state
  - Restores the user after refresh

### `src/routes/ProtectedRoute.jsx`

- Shows a loading screen while Firebase checks the session
- Redirects unauthenticated users to `/login`
- Allows logged-in users to see `/dashboard`

### `src/pages/DashboardPage.jsx`

After login, the dashboard shows:

- Name
- Email
- Profile picture
- Verification status
- Logout button

## Beginner-Friendly Flow

### Register

1. User enters name, email, and password.
2. Firebase creates the account.
3. Firebase sends verification email.
4. User is logged out until verification is complete.

### Login with Email

1. User enters email and password.
2. App signs them in.
3. App checks if email is verified.
4. If not verified:
   - user is signed out
   - message says `Please verify your email`
   - resend button appears
5. If verified, user goes to dashboard.

### Login with Google

1. User clicks `Continue with Google`.
2. Firebase opens Google popup.
3. On success, user goes to dashboard.

## Notes

- Google accounts are usually already verified by Firebase.
- Email verification requires a real email address to test properly.
- If popup login is blocked, allow popups in your browser.

## Optional Improvements

- Add Tailwind CSS
- Add forgot password flow
- Add Firestore user profile storage
- Add toast notifications
