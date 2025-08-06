import { useState, useCallback } from 'react';

export const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    // Prevent scrolling when loading is active
    document.body.style.overflow = 'hidden';
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    // Re-enable scrolling when loading is done
    document.body.style.overflow = 'unset';
  }, []);

  return [isLoading, startLoading, stopLoading];
};

export default useLoading;
