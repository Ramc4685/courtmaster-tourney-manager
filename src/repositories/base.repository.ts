import { BaseDTO } from '@/types/dtos';
import { BaseModel } from '@/types/models';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';

export abstract class BaseRepository<TDto extends BaseDTO, TModel extends BaseModel> {
  constructor(
    protected readonly databaseId: string,
    protected readonly collectionId: string
  ) {}

  protected abstract toDomain(dto: TDto): TModel;
  protected abstract toDTO(model: Partial<TModel>): Partial<TDto>;

  async findById(id: string): Promise<TModel> {
    const document = await databases.getDocument<TDto>(
      this.databaseId,
      this.collectionId,
      id
    );
    return this.toDomain(document);
  }

  async findAll(filters?: Record<string, any>): Promise<TModel[]> {
    const queries: string[] = [];

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queries.push(Query.equal(key, value));
        }
      });
    }

    const response = await databases.listDocuments<TDto>(
      this.databaseId,
      this.collectionId,
      queries
    );

    return response.documents.map(dto => this.toDomain(dto));
  }

  async create(model: Omit<TModel, keyof BaseModel>): Promise<TModel> {
    const dto = this.toDTO(model as Partial<TModel>);
    const document = await databases.createDocument<TDto>(
      this.databaseId,
      this.collectionId,
      'unique()',
      dto
    );
    return this.toDomain(document);
  }

  async update(id: string, model: Partial<TModel>): Promise<TModel> {
    const dto = this.toDTO(model);
    const document = await databases.updateDocument<TDto>(
      this.databaseId,
      this.collectionId,
      id,
      dto
    );
    return this.toDomain(document);
  }

  async delete(id: string): Promise<void> {
    await databases.deleteDocument(
      this.databaseId,
      this.collectionId,
      id
    );
  }
}
