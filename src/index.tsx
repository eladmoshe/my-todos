import React from 'react';
import { createRoot } from 'react-dom/client';
import './frontend/index.css';
import App from './frontend/App';

// Handle GitHub Pages base path
const basename = process.env.PUBLIC_URL || '';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App basename={basename} />
  </React.StrictMode>
);
