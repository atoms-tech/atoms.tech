'use client';

import { useEffect, useState } from 'react';

interface ServiceWorkerState {
    isSupported: boolean;
    isRegistered: boolean;
    isOnline: boolean;
    updateAvailable: boolean;
}

interface ServiceWorkerProviderProps {
    children: React.ReactNode;
    enabled?: boolean;
}

export function ServiceWorkerProvider({
    children,
    enabled = process.env.NODE_ENV === 'production',
}: ServiceWorkerProviderProps) {
    const [swState, setSwState] = useState<ServiceWorkerState>({
        isSupported: false,
        isRegistered: false,
        isOnline: true,
        updateAvailable: false,
    });

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        const isSupported = 'serviceWorker' in navigator;
        setSwState((prev) => ({ ...prev, isSupported }));

        if (!isSupported) {
            console.log('🚫 Service Worker not supported');
            return;
        }

        registerServiceWorker();
        setupOnlineOfflineHandlers();
    }, [enabled]);

    const registerServiceWorker = async () => {
        try {
            console.log('🔧 Registering Service Worker...');

            const registration = await navigator.serviceWorker.register(
                '/sw.js',
                {
                    scope: '/',
                },
            );

            setSwState((prev) => ({ ...prev, isRegistered: true }));
            console.log('✅ Service Worker registered:', registration.scope);

            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (
                            newWorker.state === 'installed' &&
                            navigator.serviceWorker.controller
                        ) {
                            setSwState((prev) => ({
                                ...prev,
                                updateAvailable: true,
                            }));
                            console.log('🔄 Service Worker update available');
                        }
                    });
                }
            });

            // Handle messages from service worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                const { type, payload } = event.data;

                switch (type) {
                    case 'CACHE_UPDATED':
                        console.log('📦 Cache updated:', payload);
                        break;
                    case 'OFFLINE_READY':
                        console.log('📴 App ready for offline use');
                        break;
                    default:
                        console.log('📨 SW Message:', event.data);
                }
            });
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
        }
    };

    const setupOnlineOfflineHandlers = () => {
        const updateOnlineStatus = () => {
            const isOnline = navigator.onLine;
            setSwState((prev) => ({ ...prev, isOnline }));

            if (isOnline) {
                console.log('🌐 Back online - syncing data...');
                // Trigger background sync
                if (
                    'serviceWorker' in navigator &&
                    navigator.serviceWorker.controller
                ) {
                    navigator.serviceWorker.ready
                        .then((registration) => {
                            return (registration as any).sync?.register(
                                'background-sync-home-data',
                            );
                        })
                        .catch((error) => {
                            console.log(
                                'Background sync not supported:',
                                error,
                            );
                        });
                }
            } else {
                console.log('📴 Gone offline - using cached data');
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        // Initial check
        updateOnlineStatus();

        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    };

    const updateServiceWorker = async () => {
        if (!swState.isSupported) return;

        try {
            const registration =
                await navigator.serviceWorker.getRegistration();
            if (registration && registration.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to update service worker:', error);
        }
    };

    const clearCache = async () => {
        if (!swState.isSupported) return;

        try {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map((cacheName) => caches.delete(cacheName)),
            );
            console.log('🗑️ All caches cleared');
            window.location.reload();
        } catch (error) {
            console.error('Failed to clear cache:', error);
        }
    };

    // Expose utilities globally for debugging
    useEffect(() => {
        if (enabled && typeof window !== 'undefined') {
            (window as any).swUtils = {
                state: swState,
                update: updateServiceWorker,
                clearCache,
                checkCaches: async () => {
                    const cacheNames = await caches.keys();
                    console.log('📦 Available caches:', cacheNames);
                    return cacheNames;
                },
            };
        }
    }, [swState, enabled]);

    return (
        <>
            {children}

            {/* Update notification */}
            {swState.updateAvailable && (
                <div className="fixed bottom-4 left-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
                    <div className="flex items-center gap-3">
                        <div>
                            <p className="font-medium">Update Available</p>
                            <p className="text-sm opacity-90">
                                A new version of the app is ready.
                            </p>
                        </div>
                        <button
                            onClick={updateServiceWorker}
                            className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100"
                        >
                            Update
                        </button>
                    </div>
                </div>
            )}

            {/* Offline indicator */}
            {!swState.isOnline && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        <span className="text-sm font-medium">
                            You're offline - using cached data
                        </span>
                    </div>
                </div>
            )}
        </>
    );
}
