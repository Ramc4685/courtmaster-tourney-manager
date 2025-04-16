import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { AuditableEntity } from '@/domain/models/base.model';
import { RepositoryError, ErrorCode } from './errors';

export interface AuditableDTO {
  id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface AuditableModel {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export abstract class BaseRepository<TDto extends AuditableDTO, TModel extends AuditableModel> {
  constructor(
    protected readonly client: SupabaseClient,
    protected readonly tableName: string
  ) {}

  protected abstract toDomain(dto: TDto): TModel;
  protected abstract toDTO(model: Partial<TModel>): Partial<TDto>;

  protected handleError(error: PostgrestError): never {
    throw new RepositoryError(
      ErrorCode.DATABASE_ERROR,
      `Database error: ${error.message}`
    );
  }

  async findById(id: string): Promise<TModel | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return this.toDomain(data as TDto);
  }

  async findAll(): Promise<TModel[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*');

    if (error || !data) {
      return [];
    }

    return (data as TDto[]).map(dto => this.toDomain(dto));
  }

  async create(model: Partial<TModel>): Promise<TModel | null> {
    const dto = this.toDTO(model);
    const { data, error } = await this.client
      .from(this.tableName)
      .insert(dto)
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    return this.toDomain(data as TDto);
  }

  async update(id: string, model: Partial<TModel>): Promise<TModel | null> {
    const dto = this.toDTO(model);
    const { data, error } = await this.client
      .from(this.tableName)
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    return this.toDomain(data as TDto);
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    return !error;
  }

  protected async findByField<T>(field: string, value: T): Promise<TModel[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq(field, value);

    if (error) {
      throw this.handleError(error);
    }

    return (data || []).map(dto => this.toDomain(dto as TDto));
  }
} 