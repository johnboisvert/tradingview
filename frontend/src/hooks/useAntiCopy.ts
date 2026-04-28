import { useEffect } from 'react';

/**
 * useAntiCopy
 * ------------
 * Dissuasive anti-copy protections:
 *  - Blocks right-click (contextmenu)
 *  - Blocks common save / view-source / devtools shortcuts
 *  - Blocks drag on images
 *
 * Admins are exempt: pass { enabled: false } when user.role === 'admin'.
 */
export function useAntiCopy(options: { enabled: boolean }) {
  const { enabled } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleContextMenu = (e: MouseEvent) => {
      // Allow right-click inside input/textarea/contenteditable for UX
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // F12 -> DevTools
      if (key === 'f12') {
        e.preventDefault();
        return;
      }

      // Ctrl+S (save), Ctrl+U (view source), Ctrl+P (print)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        if (['s', 'u', 'p'].includes(key)) {
          e.preventDefault();
          return;
        }
      }

      // Ctrl+Shift+I / J / C -> DevTools panes
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        if (['i', 'j', 'c'].includes(key)) {
          e.preventDefault();
          return;
        }
      }
    };

    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.tagName === 'IMG') {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, [enabled]);
}

export default useAntiCopy;