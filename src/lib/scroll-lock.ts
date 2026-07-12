/**
 * Stack-based body scroll lock.
 *
 * Multiple components (drawers, modals, sheets) can independently lock
 * body scroll. The scroll is only restored when ALL locks are released.
 *
 * Usage:
 *   useEffect(() => { lockScroll(); return unlockScroll; }, []);
 */

let lockCount = 0;

export function lockScroll(): void {
  lockCount++;
  document.body.style.overflow = 'hidden';
}

export function unlockScroll(): void {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = '';
  }
}
