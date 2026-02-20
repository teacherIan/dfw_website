import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import BabylonTest from './BabylonTest';

// biome-ignore lint/style/noNonNullAssertion: root element always exists
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BabylonTest />
  </StrictMode>
);
