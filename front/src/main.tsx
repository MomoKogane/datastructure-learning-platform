import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import AppErrorBoundary from './components/AppErrorBoundary/AppErrorBoundary.tsx'
import 'antd/dist/reset.css'
import './index.css'
import './styles/buttons.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
)
