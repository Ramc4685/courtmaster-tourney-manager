import { databases, APPWRITE_DATABASE_ID } from '@/lib/appwrite';
import { DivisionEntity, CategoryEntity, divisionFromBackend, divisionToBackend, categoryFromBackend, categoryToBackend } from '@/utils/adapters/divisionAdapter';
import { COLLECTIONS } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Division } from '@/types/tournament-enums';

export const divisionService = {
  /**
   * Create a single division for a tournament
   * @param division Division data without ID
   * @returns Created division with ID
   */
  async createDivision(division: Omit<DivisionEntity, "id">): Promise<DivisionEntity> {
    const payload = divisionToBackend(division);

    const document = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.DIVISIONS,
      'unique()',
      payload
    );

    return divisionFromBackend(document);
  },

  /**
   * Bulk create divisions for a tournament
   * @param tournamentId Tournament ID
   * @param divisions Array of division data
   * @returns Array of created divisions
   */
  async createDivisions(tournamentId: string, divisions: Omit<DivisionEntity, "id">[]): Promise<DivisionEntity[]> {
    const createdDivisions: DivisionEntity[] = [];

    // Process divisions sequentially to ensure proper error handling
    for (const division of divisions) {
      // Ensure tournament ID is set
      division.tournamentId = tournamentId;

      const createdDivision = await this.createDivision(division);
      createdDivisions.push(createdDivision);

      // If division has categories, create them
      if (division.categories && division.categories.length > 0) {
        await this.createCategories(createdDivision.id, division.categories as CategoryEntity[]);
      }
    }

    return createdDivisions;
  },

  /**
   * Create categories within a division
   * @param divisionId Division ID
   * @param categories Array of category data
   * @returns Array of created categories
   */
  async createCategories(divisionId: string, categories: Omit<CategoryEntity, "id">[]): Promise<CategoryEntity[]> {
    const createdCategories: CategoryEntity[] = [];

    // Process categories sequentially to ensure proper error handling
    for (const category of categories) {
      // Ensure division ID is set
      category.divisionId = divisionId;

      const payload = categoryToBackend(category);

      const document = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.CATEGORIES,
        'unique()',
        payload
      );

      createdCategories.push(categoryFromBackend(document));
    }

    return createdCategories;
  },

  /**
   * Get all divisions for a tournament
   * @param tournamentId Tournament ID
   * @returns Array of divisions with their categories
   */
  async getDivisionsByTournament(tournamentId: string): Promise<DivisionEntity[]> {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.DIVISIONS,
      [Query.equal('tournament_id', tournamentId), Query.orderAsc('name')]
    );

    const divisions = response.documents.map(divisionFromBackend);

    // Fetch categories for each division
    for (const division of divisions) {
      const categories = await this.getCategoriesByDivision(division.id);
      division.categories = categories;
    }

    return divisions;
  },

  /**
   * Get categories for a division
   * @param divisionId Division ID
   * @returns Array of categories
   */
  async getCategoriesByDivision(divisionId: string): Promise<CategoryEntity[]> {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.CATEGORIES,
      [Query.equal('division_id', divisionId), Query.orderAsc('name')]
    );

    return response.documents.map(categoryFromBackend);
  },

  /**
   * Get a single division by ID
   * @param divisionId Division ID
   * @param includeCategories Whether to include categories
   * @returns Division data
   */
  async getDivision(divisionId: string, includeCategories = true): Promise<DivisionEntity> {
    const document = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.DIVISIONS,
      divisionId
    );

    const division = divisionFromBackend(document);

    if (includeCategories) {
      division.categories = await this.getCategoriesByDivision(divisionId);
    }

    return division;
  },

  /**
   * Update a division
   * @param divisionId Division ID
   * @param data Updated division data
   * @returns Updated division
   */
  async updateDivision(divisionId: string, data: Partial<DivisionEntity>): Promise<DivisionEntity> {
    const payload = divisionToBackend(data);

    const document = await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.DIVISIONS,
      divisionId,
      payload
    );

    return divisionFromBackend(document);
  },

  /**
   * Delete a division and its categories
   * @param divisionId Division ID
   * @returns Promise resolved when deleted
   */
  async deleteDivision(divisionId: string): Promise<void> {
    // Get all categories for this division
    const categories = await this.getCategoriesByDivision(divisionId);

    // Delete all categories first
    for (const category of categories) {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.CATEGORIES,
        category.id
      );
    }

    // Then delete the division
    await databases.deleteDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.DIVISIONS,
      divisionId
    );
  },

  /**
   * Create a single category
   * @param category Category data without ID
   * @returns Created category with ID
   */
  async createCategory(category: Omit<CategoryEntity, "id">): Promise<CategoryEntity> {
    const payload = categoryToBackend(category);

    const document = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.CATEGORIES,
      'unique()',
      payload
    );

    return categoryFromBackend(document);
  },

  /**
   * Update a category
   * @param categoryId Category ID
   * @param data Updated category data
   * @returns Updated category
   */
  async updateCategory(categoryId: string, data: Partial<CategoryEntity>): Promise<CategoryEntity> {
    const payload = categoryToBackend(data);

    const document = await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.CATEGORIES,
      categoryId,
      payload
    );

    return categoryFromBackend(document);
  },

  /**
   * Delete a category
   * @param categoryId Category ID
   * @returns Promise resolved when deleted
   */
  async deleteCategory(categoryId: string): Promise<void> {
    await databases.deleteDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.CATEGORIES,
      categoryId
    );
  }
};
