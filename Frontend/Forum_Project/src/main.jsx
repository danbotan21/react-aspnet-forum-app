import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './AuthContext'
import { NotificationProvider } from './NotificationContext'
import { ChatProvider } from './ChatContext'
import { ToastProvider } from './ToastContext'
import { ConfirmProvider } from './ConfirmContext'

import App from './App.jsx'

const GOOGLE_CLIENT_ID =
  '797222659040-2mmg39vqk6lsg104pneok726ijg5maoa.apps.googleusercontent.com'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <ChatProvider>
              <ToastProvider>
                <ConfirmProvider>
                  <App />
                </ConfirmProvider>
              </ToastProvider>
            </ChatProvider>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
)
