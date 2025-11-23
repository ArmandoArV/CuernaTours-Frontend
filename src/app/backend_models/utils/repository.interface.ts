/**
 * Repository Interface
 * 
 * Generic repository pattern for database-agnostic CRUD operations
 */

import type { QueryOptions } from './common.types.js';

export type { QueryOptions };

export interface IRepository<T> {
  findAll(options?: QueryOptions): Promise<T[]>;
  findById(id: number | string): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: number | string, data: Partial<T>): Promise<T | null>;
  delete(id: number | string): Promise<boolean>;
  count(filters?: Record<string, any>): Promise<number>;
}

export interface ITransactionManager {
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}
