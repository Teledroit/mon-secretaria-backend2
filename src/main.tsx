import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { cacheManager } from './lib/performance/cache-manager';
import { performanceMonitor } from './lib/optimization/performance-monitor';

// Initialize performance monitoring
cacheManager.startCleanupInterval();
performanceMonitor.startMonitoring();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

