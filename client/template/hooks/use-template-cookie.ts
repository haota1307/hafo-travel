'use client';

import { useCallback, useSyncExternalStore } from 'react';

import { getCookie, setCookie, removeCookie } from '../lib/cookies';

const eventName = 'template-preferences-change';

function subscribe(onChange: () => void) {
  window.addEventListener(eventName, onChange);

  return () => window.removeEventListener(eventName, onChange);
}

// Server defaults keep hydration stable; saved preferences apply afterwards.
export function useTemplateCookie<T extends string>(name: string, fallback: T) {
  const value = useSyncExternalStore(
    subscribe,
    () => (getCookie(name) as T) || fallback,
    () => fallback,
  );
  const setValue = useCallback(
    (next: T) => {
      setCookie(name, next, 60 * 60 * 24 * 365);
      window.dispatchEvent(new Event(eventName));
    },
    [name],
  );
  const reset = useCallback(() => {
    removeCookie(name);
    window.dispatchEvent(new Event(eventName));
  }, [name]);

  return [value, setValue, reset] as const;
}
