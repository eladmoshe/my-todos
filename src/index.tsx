import React from 'react';
import { createRoot } from 'react-dom/client';
import './frontend/index.css';
import App from './frontend/App';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
