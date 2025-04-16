import { BaseRepository } from '@/repositories/base.repository';
import { NotificationDTO } from '@/types/dtos';
import { Notification } from '@/types/models';

export class NotificationService {
  private readonly repository: BaseRepository<NotificationDTO, Notification>;

  constructor() {
    this.repository = new BaseRepository<NotificationDTO, Notification>('notifications');
  }

  async create(data: {
    user_id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
  }): Promise<Notification> {
    return this.repository.create(data);
  }

  async markAsRead(id: string): Promise<Notification> {
    return this.repository.update(id, { read: true });
  }

  async findByUser(user_id: string): Promise<Notification[]> {
    return this.repository.findAll({ user_id });
  }
} 