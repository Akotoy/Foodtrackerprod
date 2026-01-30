
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// Инициализация Telegram WebApp
// @ts-ignore
if (window.Telegram?.WebApp) {
    // @ts-ignore
    window.Telegram.WebApp.ready();
    // @ts-ignore
    window.Telegram.WebApp.expand();
    // Отключаем свайп вниз для закрытия (улучшает UX скролла)
    // @ts-ignore
    try { window.Telegram.WebApp.disableVerticalSwipes(); } catch(e) {}
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
