import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './index.css';
import { ReactFlowProvider } from 'reactflow';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ReactFlowProvider>
      <MantineProvider>
        <Notifications />
        <App />
      </MantineProvider>
    </ReactFlowProvider>
  </React.StrictMode>
);
