'use client';

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

import type { NavigateFn } from './use-table-url-state';

const arrayKeys = new Set(['status', 'role', 'priority']);

function parseSearch(params: URLSearchParams) {
  const result: Record<string, unknown> = {};

  for (const key of new Set(params.keys())) {
    const value = params.get(key) ?? '';

    if (arrayKeys.has(key)) {
      result[key] = params.getAll(key);
    } else if (key === 'page' || key === 'pageSize') {
      const number = Number(value);

      if (
        Number.isSafeInteger(number) &&
        number > 0 &&
        (key !== 'pageSize' || [10, 20, 30, 40, 50].includes(number))
      ) {
        result[key] = number;
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}

export function useTableSearch() {
  const params = useSearchParams();
  const search = useMemo(() => parseSearch(new URLSearchParams(params.toString())), [params]);
  const navigate = useCallback<NavigateFn>(({ search: update, replace }) => {
    const current = new URL(window.location.href);
    const previous = parseSearch(current.searchParams);
    const next =
      typeof update === 'function' ? update(previous) : update === true ? previous : update;
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }

      for (const item of Array.isArray(value) ? value : [value]) {
        query.append(key, String(item));
      }
    }

    const url = `${current.pathname}${query.size ? `?${query}` : ''}${current.hash}`;

    if (url === `${current.pathname}${current.search}${current.hash}`) {
      return;
    }
    // Next tracks native history without a server request on every keystroke.
    if (replace) {
      window.history.replaceState(null, '', url);
    } else {
      window.history.pushState(null, '', url);
    }
  }, []);

  return { search, navigate };
}
