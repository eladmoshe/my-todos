# TypeScript React Todo App

This project is a Todo application built with React and TypeScript, using Supabase as a backend.

## Features

- User authentication (sign up, sign in, sign out)
- Create, read, update, and delete todo items
- Organize todos into sections
- Drag and drop functionality for todos and sections
- Responsive design with a notebook-like interface

## Technologies Used

- React
- TypeScript
- Supabase
- react-beautiful-dnd for drag and drop functionality
- Tailwind CSS for styling

## Getting Started

### Prerequisites

- Node.js (version 20.0.0 or later)
- npm

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/typescript-react-todo.git
   ```

2. Navigate to the project directory:
   ```
   cd typescript-react-todo
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Create a `.env` file in the root directory and add your Supabase credentials:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_project_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Start the development server:
   ```
   npm start
   ```

6. Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

## Available Scripts

In the project directory, you can run:

- `npm start`: Runs the app in development mode
- `npm run build`: Builds the app for production
- `npm test`: Launches the test runner
- `npm run eject`: Ejects from Create React App

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License.