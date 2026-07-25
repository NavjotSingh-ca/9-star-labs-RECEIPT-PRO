/**
 * Portal — Renders children into a different DOM node (document.body by default).
 */

import { type ReactNode, useState, useEffect } from 'react';

interface PortalProps {
  children: ReactNode;
  container?: HTMLElement | null;
}

export function Portal({ children, container }: PortalProps) {
  const hostContainer = container || document.body;
  const [el] = useState(() => {
    if (typeof window === 'undefined') return null;
    const e = document.createElement('div');
    hostContainer.appendChild(e);
    return e;
  });

  useEffect(() => {
    return () => {
      if (el && hostContainer.contains(el)) {
        hostContainer.removeChild(el);
      }
    };
  }, [el, hostContainer]);

  if (!el) return null;

  return createPortal(children, el);
}

function createPortal(children: ReactNode, container: HTMLElement) {
  // Use ReactDOM.createPortal if available, otherwise fallback
  if (typeof window !== 'undefined' && window.ReactDOM) {
    return window.ReactDOM.createPortal(children, container);
  }
  // Fallback for environments without ReactDOM
  return <div>{children}</div>;
}

export default Portal;