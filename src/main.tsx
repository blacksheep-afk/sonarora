import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { LoadingState, MIN_LOADING_MS } from './components/LoadingState';
import '@fontsource-variable/manrope/index.css';
import '@fontsource-variable/source-sans-3/index.css';
import './style.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing application root');
const applicationRoot = createRoot(root);
applicationRoot.render(<StrictMode><LoadingState /></StrictMode>);
setTimeout(() => applicationRoot.render(<StrictMode><App /></StrictMode>), MIN_LOADING_MS);
