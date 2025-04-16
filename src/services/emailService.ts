
export const emailService = {
  async sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<{ success: boolean }> {
    console.log('Email would be sent in production:', { to, subject, html });
    // This is a stub implementation
    // In a real app, you would call an API endpoint or use a service like SendGrid

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return { success: true };
  }
};
