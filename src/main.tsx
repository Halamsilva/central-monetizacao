import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { installMissingApiKeyWatcher } from './lib/missingApiKey';
import './index.css';

installMissingApiKeyWatcher();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
