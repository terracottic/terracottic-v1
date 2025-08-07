import { useEffect, useLayoutEffect } from 'react';

// This hook safely handles useLayoutEffect for SSR environments
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default useIsomorphicLayoutEffect;
