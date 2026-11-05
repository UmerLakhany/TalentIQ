import nodemailer, { Transporter } from 'nodemailer';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Replaces {{key}} placeholders with HTML-escaped values. */
const render = (template: string, variables: Record<string, string | number>) =>
  template.replace(/{{\s*(\w+)\s*}}/g, (_match, key) =>
    key in variables ? escapeHtml(String(variables[key])) : '',
  );

class EmailService {
  private transporter: Transporter | null = null;

  private isConfigured(): boolean {
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  }

  private getTransporter(): Transporter {
    if (!this.transporter) {
      const port = Number(process.env.SMTP_PORT) || 465;
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465, // 465 = SSL, 587 = STARTTLS
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
    }
    return this.transporter;
  }

  /** Checks the SMTP login at startup so misconfiguration shows up in the console early. */
  async verifyConnection(): Promise<void> {
    if (!this.isConfigured()) {
      console.warn('SMTP is not configured: emails will be printed to the console instead of sent.');
      return;
    }
    try {
      await this.getTransporter().verify();
      console.log('SMTP connected.');
    } catch (err: any) {
      console.error('SMTP connection failed:', err?.message || err);
    }
  }

  async sendTemplateMail(
    to: string,
    subject: string,
    template: string,
    variables: Record<string, string | number> = {},
  ): Promise<void> {
    const html = render(template, variables);

    if (!this.isConfigured()) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('SMTP is not configured.');
      }
      console.log(`\n[email not sent: SMTP not configured]\nTo: ${to}\nSubject: ${subject}\n${html}\n`);
      return;
    }

    const fromName = process.env.SMTP_FROM_NAME || 'TalentIQ';
    await this.getTransporter().sendMail({
      from: `"${fromName}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  }
}

export default new EmailService();
