(function initializeOperatorsNativeShell() {
  const capacitor = window.Capacitor;
  if (!capacitor?.isNativePlatform?.()) return;

  document.documentElement.classList.add('native-app');

  const appPlugin = capacitor.Plugins?.App;
  if (!appPlugin?.addListener || window.top !== window) return;

  appPlugin.addListener('backButton', ({ canGoBack }) => {
    const journalFrame = document.getElementById('journalFrame');
    try {
      const journalWindow = journalFrame?.contentWindow;
      const openOverlay = journalWindow?.document?.querySelector(
        '.modal-overlay, .target-modal-backdrop, .chart-viewer, .day-details-overlay',
      );
      if (openOverlay) {
        openOverlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        return;
      }
    } catch (_error) {
      // The normal browser history fallback below remains available.
    }

    if (canGoBack || window.history.length > 1) {
      window.history.back();
      return;
    }

    appPlugin.minimizeApp?.();
  });
})();
