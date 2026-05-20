import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { UnheadProvider, createHead } from '@unhead/react/client';
import './index.css';
import App from './App.tsx';

const head = createHead();

// biome-ignore lint/style/noNonNullAssertion: root element always exists
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UnheadProvider head={head}>
      <App />
    </UnheadProvider>
  </StrictMode>
);
