/**
 * API Error Classes
 * 
 * Typed error classes for different API error scenarios
 */

export enum ApiErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  BAD_REQUEST = 'BAD_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class ApiError extends Error {
  public readonly type: ApiErrorType;
  public readonly statusCode?: number;
  public readonly errors?: string[];
  public readonly data?: any;

  constructor(
    message: string,
    type: ApiErrorType,
    statusCode?: number,
    errors?: string[],
    data?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.statusCode = statusCode;
    this.errors = errors;
    this.data = data;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  public isNetworkError(): boolean {
    return this.type === ApiErrorType.NETWORK_ERROR;
  }

  public isAuthError(): boolean {
    return this.type === ApiErrorType.UNAUTHORIZED || this.type === ApiErrorType.FORBIDDEN;
  }

  public isClientError(): boolean {
    return this.statusCode ? this.statusCode >= 400 && this.statusCode < 500 : false;
  }

  public isServerError(): boolean {
    return this.statusCode ? this.statusCode >= 500 : false;
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      statusCode: this.statusCode,
      errors: this.errors,
      data: this.data,
    };
  }
}

export class NetworkError extends ApiError {
  constructor(message: string = 'Network error - please check your connection') {
    super(message, ApiErrorType.NETWORK_ERROR);
  }
}

export class TimeoutError extends ApiError {
  constructor(message: string = 'Request timeout - please try again') {
    super(message, ApiErrorType.TIMEOUT_ERROR);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Session expired - please login again') {
    super(message, ApiErrorType.UNAUTHORIZED, 401);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, errors?: string[]) {
    super(message, ApiErrorType.VALIDATION_ERROR, 400, errors);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, ApiErrorType.NOT_FOUND, 404);
  }
}

export class ServerError extends ApiError {
  constructor(message: string = 'Server error - please try again later') {
    super(message, ApiErrorType.SERVER_ERROR, 500);
  }
}

/**
 * Factory function to create appropriate ApiError based on response
 */
export function createApiError(
  statusCode: number,
  message?: string,
  errors?: string[],
  data?: any
): ApiError {
  switch (statusCode) {
    case 400:
      return new ValidationError(message || 'Invalid request', errors);
    case 401:
      return new UnauthorizedError(message);
    case 403:
      return new ApiError(
        message || 'Access forbidden',
        ApiErrorType.FORBIDDEN,
        403,
        errors,
        data
      );
    case 404:
      return new NotFoundError(message);
    case 500:
    case 502:
    case 503:
    case 504:
      return new ServerError(message);
    default:
      return new ApiError(
        message || 'An error occurred',
        ApiErrorType.UNKNOWN_ERROR,
        statusCode,
        errors,
        data
      );
  }
}
