import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { PlantelProvider } from './context/PlantelContext.jsx'
import { FormacionProvider } from './context/FormacionContext.jsx'
import { ChatProvider } from './context/ChatContext.jsx'
import { TacticaProvider } from './context/TacticaContext.jsx'
import { JugadasProvider } from './context/JugadasContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PlantelProvider>
      <FormacionProvider>
        <TacticaProvider>
          <JugadasProvider>
            <ChatProvider>
              <App />
            </ChatProvider>
          </JugadasProvider>
        </TacticaProvider>
      </FormacionProvider>
    </PlantelProvider>
  </React.StrictMode>,
)