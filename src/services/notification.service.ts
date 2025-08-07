import { NotificationDTO } from '@/types/dtos';
import { Notification } from '@/types/models';
import { NotificationRepository } from '@/repositories/notification.repository';

export class NotificationService {
  private readonly repository: NotificationRepository;

  constructor() {
    this.repository = new NotificationRepository();
  }

  async create(data: {
    userId: string;
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

  async findByUser(userId: string): Promise<Notification[]> {
    return this.repository.findAll({ userId });
  }
} 