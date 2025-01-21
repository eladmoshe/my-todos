# TypeScript React Todo App

A modern, feature-rich Todo application built with React and TypeScript, using Supabase as a backend. The app includes offline support, drag-and-drop functionality, and a responsive notebook-like interface.

## Features

- User authentication (sign up, sign in, sign out)
- Create, read, update, and delete todo items
- Organize todos into sections with drag-and-drop reordering
- Offline support with automatic sync when back online
- URL preview for links in todo items
- Age indicators for todos
- Development environment indicator
- Responsive design with a notebook-like interface
- Progressive Web App (PWA) support

## Technologies Used

- React 18
- TypeScript 4.9
- Supabase for backend and authentication
- Express.js for API server
- IndexedDB for offline storage
- Tailwind CSS for styling
- Workbox for service worker and PWA features
- Jest and React Testing Library for testing

## Prerequisites

- Node.js (version 20.0.0 or later)
- npm
- Supabase account and project

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/typescript-react-todo.git
   ```

2. Navigate to the project directory:
   ```bash
   cd typescript-react-todo
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file in the root directory and add your Supabase credentials:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_project_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Start the development server:
   ```bash
   npm start
   ```

6. Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

## Available Scripts

- `npm start`: Runs both the React app and Express server concurrently
- `npm run build`: Builds the app for production
- `npm test`: Runs tests in CI mode
- `npm run test:watch`: Runs tests in watch mode
- `npm run lint`: Lints the source code
- `npm run eject`: Ejects from Create React App

## Project Structure

```
src/
├── frontend/           # React frontend code
│   ├── components/     # React components
│   └── utils/         # Frontend utilities
├── server/            # Express backend code
├── utils/             # Shared utilities
└── types/             # TypeScript type definitions
```

## Development

The project uses different schemas for development and production:
- Development: `dev` schema
- Production: `public` schema

A development banner appears at the top of the app when running in development mode.

## Testing

The project includes comprehensive tests using Jest and React Testing Library. Run the tests using:

```bash
npm test
```

## Continuous Integration

GitHub Actions workflows are configured for:
- Running tests
- Linting code
- Building the application

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.
