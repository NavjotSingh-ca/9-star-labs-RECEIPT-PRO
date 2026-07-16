/**
 * Stack-based body scroll lock.
 *
 * Multiple components (drawers, modals, sheets) can independently lock
 * body scroll. The scroll is only restored when ALL locks are released.
 * Restores the original `overflow` value rather than unconditionally resetting to `''`.
 *
 * Usage:
 *   useEffect(() => { lockScroll(); return unlockScroll; }, []);
 */

let lockCount = 0;
let originalOverflow = '';

/**
 * Locks body scroll by setting `overflow: hidden`.
 * Saves the original overflow value on first lock so it can be restored later.
 */
export function lockScroll(): void {
  if (lockCount === 0) {
    originalOverflow = document.body.style.overflow;
  }
  lockCount++;
  document.body.style.overflow = 'hidden';
}

/**
 * Releases one level of scroll lock. Body scroll is restored only when
 * the lock count reaches zero.
 */
export function unlockScroll(): void {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = originalOverflow;
    originalOverflow = '';
  }
}
