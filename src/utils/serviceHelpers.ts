import { APPWRITE_DATABASE_ID, databases } from '@/lib/appwrite';

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error';
  }
};

const withTimeout = async <T>(operation: () => Promise<T>, timeoutMs: number, context?: string): Promise<T> => {
  if (!timeoutMs || timeoutMs <= 0) {
    return operation();
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      operation(),
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          const timeoutMessage = context
            ? `${context} timed out after ${timeoutMs}ms`
            : `Service call timed out after ${timeoutMs}ms`;
          reject(new Error(timeoutMessage));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

export interface SafeServiceCallOptions {
  retries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  context?: string;
  onRetry?: (attempt: number, error: unknown) => void;
}

export const safeServiceCall = async <T>(
  operation: () => Promise<T>,
  {
    retries = 0,
    retryDelayMs = 250,
    timeoutMs = 15000,
    context,
    onRetry,
  }: SafeServiceCallOptions = {}
): Promise<T> => {
  let attempt = 0;
  let currentDelay = retryDelayMs;

  while (true) {
    try {
      return await withTimeout(operation, timeoutMs, context);
    } catch (error) {
      const messagePrefix = context ? `${context} failed` : 'Service call failed';
      if (attempt >= retries) {
        const formattedMessage = `${messagePrefix}: ${toErrorMessage(error)}`;
        const finalError = new Error(formattedMessage);
        (finalError as Error & { cause?: unknown }).cause = error;
        throw finalError;
      }

      onRetry?.(attempt + 1, error);
      await wait(currentDelay);
      attempt += 1;
      currentDelay *= 2;
    }
  }
};

const checkedCollections = new Map<string, boolean>();

export interface CollectionCheckOptions {
  forceRefresh?: boolean;
  context?: string;
}

export const checkCollectionExists = async (
  collectionId: string,
  options: CollectionCheckOptions = {}
): Promise<void> => {
  if (!collectionId) {
    throw new Error('Collection ID is required to verify existence.');
  }

  const cacheKey = `${APPWRITE_DATABASE_ID}:${collectionId}`;
  if (!options.forceRefresh && checkedCollections.get(cacheKey)) {
    return;
  }

  try {
    await databases.listDocuments(APPWRITE_DATABASE_ID, collectionId, []);
    checkedCollections.set(cacheKey, true);
  } catch (error) {
    checkedCollections.set(cacheKey, false);
    const contextDetails = options.context ? `${options.context}: ` : '';
    const message = `${contextDetails}Required Appwrite collection "${collectionId}" is missing or inaccessible.`;
    logServiceError('ServiceHelpers', message, error, { collectionId });
    const finalError = new Error(`${message} ${toErrorMessage(error)}`.trim());
    (finalError as Error & { cause?: unknown }).cause = error;
    throw finalError;
  }
};

export type ServiceResponseState<T> = {
  data?: T;
  loading: boolean;
  error?: string | null;
  retry?: () => void | Promise<void>;
};

export const createServiceResponseState = <T>(data?: T): ServiceResponseState<T> => ({
  data,
  loading: false,
  error: null,
});

export interface PartialDataHandlerOptions<T> {
  serviceName: string;
  operation: string;
  fallbackValue: T;
  metadata?: Record<string, unknown>;
}

export const formatServiceError = (operation: string, error: unknown): string => {
  return `${operation} failed: ${toErrorMessage(error)}`;
};

export const logServiceError = (
  serviceName: string,
  message: string,
  error: unknown,
  metadata?: Record<string, unknown>
) => {
  const meta = metadata ? ` | metadata=${JSON.stringify(metadata)}` : '';
  console.error(`[${serviceName}] ${message}${meta}`.trim(), error);
};

export const createPartialDataHandler = <T>({
  serviceName,
  operation,
  fallbackValue,
  metadata,
}: PartialDataHandlerOptions<T>) => {
  return (error: unknown): T => {
    const formattedMessage = formatServiceError(operation, error);
    logServiceError(serviceName, formattedMessage, error, metadata);
    return fallbackValue;
  };
};

export const createServiceLogger = (serviceName: string) => ({
  info: (message: string, metadata?: Record<string, unknown>) => {
    const meta = metadata ? ` | metadata=${JSON.stringify(metadata)}` : '';
    console.info(`[${serviceName}] ${message}${meta}`);
  },
  warn: (message: string, metadata?: Record<string, unknown>) => {
    const meta = metadata ? ` | metadata=${JSON.stringify(metadata)}` : '';
    console.warn(`[${serviceName}] ${message}${meta}`);
  },
  error: (message: string, error: unknown, metadata?: Record<string, unknown>) => {
    logServiceError(serviceName, message, error, metadata);
  },
});
