import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import {BrowserRouter} from 'react-router';
import './index.css';
import App from './App.jsx';
import {Provider} from 'react-redux';
import {store} from './store/store.js';
import { setupInterceptors } from './utils/axiosClient.js';
import ServerStatusProvider from './features/serverStatus/ServerStatusProvider.jsx';
import { sessionCleared, openAuthModal, guestSessionEnded } from './features/auth/authSlice.js';

setupInterceptors(store, { sessionCleared, openAuthModal, guestSessionEnded });

createRoot(document.getElementById('root')).render(
<StrictMode>
<Provider store={store}>
<BrowserRouter>
<ServerStatusProvider>
<App/>
</ServerStatusProvider>
</BrowserRouter>
</Provider>
</StrictMode>
)
