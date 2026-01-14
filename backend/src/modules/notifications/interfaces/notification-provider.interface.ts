export interface INotificationProvider {
    sendSMS(to: string, message: string): Promise<boolean>;
    sendEmail(to: string, subject: string, body: string): Promise<boolean>;
}
