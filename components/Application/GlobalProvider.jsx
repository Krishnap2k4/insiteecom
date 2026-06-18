'use client'
import { persistor, store } from '@/store/store'
import React, { Suspense } from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient()

/**
 * PersistGate loading fallback is set to null on purpose — redux-persist
 * rehydration is fast (~50ms reading from localStorage) and the brand
 * splash is rendered by the storefront layout (`<Preloader />`). Showing
 * a separate spinner here would cause "earlier spinner → branded splash"
 * stacking on first paint.
 */
const GlobalProvider = ({ children }) => {
    return (
        <QueryClientProvider client={queryClient}>
            <Provider store={store}>
                <PersistGate persistor={persistor} loading={null}>
                    {children}
                </PersistGate>
            </Provider>
            <Suspense fallback={null}>
                <ReactQueryDevtools initialIsOpen={false} />
            </Suspense>
        </QueryClientProvider>
    )
}

export default GlobalProvider