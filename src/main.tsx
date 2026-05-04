import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Handle Auth callbacks and clean URLs for HashRouter
if (window.location.pathname !== '/' && window.location.pathname !== '/index.html' && !window.location.hash) {
  const cleanPath = window.location.pathname;
  const search = window.location.search;
  window.history.replaceState(null, '', '/');
  window.location.hash = `#${cleanPath}${search}`;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
