import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { LoadingState, STARTUP_LOADING_MS } from './components/LoadingState';
import '@fontsource-variable/manrope/index.css';
import '@fontsource-variable/source-sans-3/index.css';
import './style.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing application root');
// A new visit starts a fresh decision on the first step.
history.replaceState(history.state, '', location.pathname + location.search + '#inputs');
const applicationRoot = createRoot(root);
applicationRoot.render(<StrictMode><LoadingState /></StrictMode>);
setTimeout(() => applicationRoot.render(<StrictMode><App /></StrictMode>), STARTUP_LOADING_MS);
