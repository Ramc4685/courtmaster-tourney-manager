import { BaseDTO } from '@/types/dtos';
import { BaseModel } from '@/types/models';
import { SupabaseClient } from '@supabase/supabase-js';

export abstract class BaseRepository<TDto extends BaseDTO, TModel extends BaseModel> {
  constructor(
    protected readonly supabase: SupabaseClient,
    protected readonly tableName: string
  ) {}

  protected abstract toDomain(dto: TDto): TModel;
  protected abstract toDTO(model: Partial<TModel>): Partial<TDto>;

  async findById(id: string): Promise<TModel> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return this.toDomain(data as TDto);
  }

  async findAll(filters?: Record<string, any>): Promise<TModel[]> {
    let query = this.supabase.from(this.tableName).select('*');

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as TDto[]).map(dto => this.toDomain(dto));
  }

  async create(model: Omit<TModel, keyof BaseModel>): Promise<TModel> {
    const dto = this.toDTO(model as Partial<TModel>);
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(dto)
      .select()
      .single();

    if (error) throw error;
    return this.toDomain(data as TDto);
  }

  async update(id: string, model: Partial<TModel>): Promise<TModel> {
    const dto = this.toDTO(model);
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.toDomain(data as TDto);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
} 