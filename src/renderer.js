import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app.jsx'; // Importing the component we just made
import './index.css'; // Importing the styles

// Find the HTML element with id="root"
const container = document.getElementById('root');

// Mount the React app inside it
const root = createRoot(container);
root.render(<App />);