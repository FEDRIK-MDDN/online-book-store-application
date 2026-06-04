# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm run test:backend`

Tests the Spring Boot backend connectivity and admin login.\
Checks if backend is running on port 8080 and admin endpoints work.

### `npm run test:admin`

PowerShell-based admin login tester (Windows).\
Comprehensive test of both Spring Boot and Mock API backends.

### `npm run mock-api`

Starts the mock API server on port 5050.\
Use this as a fallback when Spring Boot backend is unavailable.

### `npm run dev`

Starts both mock API and React app together.\
Mock API runs on port 5050, React on port 3010.

## Backend API configuration

- This app expects auth endpoints at `/api/login` and `/api/register`.
- If your API is on another origin (e.g. `http://localhost:5000`), set an environment variable so requests go to the right place:

	1. Copy `.env.example` to `.env.local` and adjust the URL:

		 ```
		 REACT_APP_API_URL=http://localhost:5000
		 ```

	2. Restart `npm start` after changing environment variables.

- Alternatively, you can add a `"proxy": "http://localhost:5000"` field in `package.json` for development so `/api/*` calls are proxied by the dev server.

## Local Mock API & Auth Endpoints

This repo includes a lightweight Express mock backend in `mock-api/server.js` exposing both `/api/*` and `/users/*` variants of auth endpoints used by `src/api.js`.

### Quick start (recommended)

```bash
npm install
npm run dev
```

The `dev` script starts:
- Mock API on `http://localhost:5050`
- React Dev Server on `http://localhost:3010` (port overridden so 3000 stays free)

The React dev server proxies relative requests (`/users/*`) to `http://localhost:5050` via the `proxy` field in `package.json`.

### Manual start (alternative)

In two terminals:

```bash
npm run mock-api   # starts backend on :5050
npm start          # starts frontend (defaults to :3000 unless PORT set)
```

If you use `npm start` without setting `PORT=3010`, the frontend runs at `:3000` which is still allowed by the CORS config.

### Health check

Verify the backend is up:

```
curl http://localhost:5050/api/health
```
Expected JSON: `{"status":"ok","service":"mock-api"}`.

### Environment variable override

If you prefer an explicit base URL (skips fallback probing) set:

```
REACT_APP_API_URL=http://localhost:5050
```

On Windows PowerShell for a single command:

```powershell
$env:REACT_APP_API_URL = "http://localhost:5050"; npm start
```

### Troubleshooting "Cannot reach backend"

The error `Cannot reach backend. Tried bases: ... Last error: Failed to fetch` indicates network-level failure (no server response). Check:
1. Backend running? Look for `Mock API listening on http://localhost:5050` in its terminal.
2. Port conflict? Ensure nothing else is bound to 5050 (`netstat -ano | findstr :5050`).
3. Firewall / VPN blocking localhost requests.
4. Correct origin? Frontend on `:3000` or `:3010` is whitelisted in CORS. If you changed the port, add it to the `origin` array in `mock-api/server.js`.
5. Wrong env var? If `REACT_APP_API_URL` points to a non-running host, remove or fix it so fallbacks can succeed.

After fixing, reload the page and retry registration.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
