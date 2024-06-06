import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import '@mantine/core/styles.css';
import './index.css';
import { ReactFlowProvider } from 'reactflow';
import { MantineProvider } from '@mantine/core';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ReactFlowProvider>
      <MantineProvider>
        <App />
      </MantineProvider>
    </ReactFlowProvider>
  </React.StrictMode>
);
