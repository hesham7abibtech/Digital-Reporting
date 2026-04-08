'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistry() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register the service worker
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('SW registered: ', registration);

            // Check for updates periodically
            const checkUpdate = async () => {
              try {
                const response = await fetch('/version.json', { cache: 'no-store' });
                const data = await response.json();
                
                // We can store the current version in localStorage
                const currentVersion = localStorage.getItem('app_version');
                
                if (currentVersion && data.version !== currentVersion) {
                  console.log('New version detected!', data.version);
                  localStorage.setItem('app_version', data.version);
                  
                  // Notify user or just reload
                  // For "zero manual effort", we'll reload when the user is idle or the next navigation
                  // But for now, let's trigger a reload if we are sure
                  window.location.reload();
                } else {
                  localStorage.setItem('app_version', data.version);
                }
              } catch (error) {
                console.error('Failed to check for version update:', error);
              }
            };

            // Initial check
            checkUpdate();

            // Set up polling (every 5 minutes)
            const interval = setInterval(checkUpdate, 5 * 60 * 1000);
            
            // Also check when the page becomes visible again
            document.addEventListener('visibilitychange', () => {
              if (document.visibilityState === 'visible') {
                checkUpdate();
              }
            });

            return () => clearInterval(interval);
          },
          (registrationError) => {
            console.log('SW registration failed: ', registrationError);
          }
        );
      });

      // Handle the controllerchange event (reload all tabs if SW updates)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  return null;
}
