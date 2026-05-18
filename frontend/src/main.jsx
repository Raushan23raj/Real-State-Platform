import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthPorvider } from './context/authcontext'
import { ChatProvider } from './context/ChatContext'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthPorvider>
      <ChatProvider>
        <App/>
      </ChatProvider>  
    </AuthPorvider>
  </BrowserRouter>
  
)
