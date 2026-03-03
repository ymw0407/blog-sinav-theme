import React from 'react';
import { reloadOnceForDynamicImportError } from './chunkReload';

export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      reloadOnceForDynamicImportError(error);
      throw error;
    }
  });
}

