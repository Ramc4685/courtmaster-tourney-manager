export interface BaseRepository<T> {
  findById(id: string): Promise<T>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  update(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
  transaction<R>(operation: () => Promise<R>): Promise<R>;
} 