export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditableEntity extends BaseEntity {
  createdBy?: string;
  updatedBy?: string;
}

export interface SoftDeletableEntity extends BaseEntity {
  deletedAt?: Date;
  deletedBy?: string;
  isDeleted: boolean;
} 