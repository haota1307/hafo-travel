'use client';

import { useEffect, useState } from 'react';

type UseDebounceSearchOptions = {
  delay?: number;
};

export function useDebounceSearch(
  initialValue = '',
  { delay = 400 }: UseDebounceSearchOptions = {},
) {
  const [search, setSearch] = useState(initialValue);
  const [debouncedSearch, setDebouncedSearch] = useState(initialValue);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [delay, search]);

  return {
    search,
    setSearch,
    debouncedSearch,
  };
}
