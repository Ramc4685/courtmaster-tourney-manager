import { NotificationDTO } from '@/types/dtos';
import { Notification } from '@/types/models';
import { BaseRepository } from './base.repository';
import { COLLECTIONS } from '@/lib/appwrite';

export class NotificationRepository extends BaseRepository<NotificationDTO, Notification> {
  constructor() {
    super(import.meta.env.VITE_APPWRITE_DATABASE_ID, COLLECTIONS.NOTIFICATIONS);
  }

  protected toDomain(dto: NotificationDTO): Notification {
    return {
      id: dto.id,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
      userId: dto.user_id,
      title: dto.title,
      message: dto.message,
      type: dto.type,
      read: dto.read
    };
  }

  protected toDTO(model: Partial<Notification>): Partial<NotificationDTO> {
    const dto: Partial<NotificationDTO> = {};

    if (model.id) dto.id = model.id;
    if (model.createdAt) dto.created_at = model.createdAt.toISOString();
    if (model.updatedAt) dto.updated_at = model.updatedAt.toISOString();
    if (model.userId) dto.user_id = model.userId;
    if (model.title) dto.title = model.title;
    if (model.message) dto.message = model.message;
    if (model.type) dto.type = model.type;
    if (model.read !== undefined) dto.read = model.read;

    return dto;
  }
}
