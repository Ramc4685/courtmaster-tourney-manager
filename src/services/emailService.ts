
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  async send(options: EmailOptions): Promise<void> {
    // TODO: Implement actual email sending logic
    console.log('Email sending not yet implemented:', options);
  }
}

// Create and export a singleton instance
export const emailService = new EmailService();
