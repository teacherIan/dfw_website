/**
 * The handline lab — a dev-only page (served by `npm run dev` at
 * /lab/handline.html, not part of the production build).
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Lab from './Lab';
import './lab.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Lab />
  </StrictMode>
);
