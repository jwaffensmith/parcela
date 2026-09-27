import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeUIProvider } from 'theme-ui'
import App from './App.tsx'
import { theme } from './theme'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
})

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeUIProvider theme={theme}>
        <App />
      </ThemeUIProvider>
    </QueryClientProvider>
  </StrictMode>,
)
