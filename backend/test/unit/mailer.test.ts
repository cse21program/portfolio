import { afterEach, describe, expect, it } from "vitest";
import { describeMailError } from "../../src/common/mailer/mailer.errors";
import { sesSmtpHost } from "../../src/common/mailer/mailer.catalog";
import { sendWithSes, sesFromAddress, setSesClient } from "../../src/common/mailer/mailer.ses";
import { sendWithSmtp, setSmtpTransport } from "../../src/common/mailer/mailer.smtp";
import {
  contactConfirmationEmail,
  contactOwnerEmail,
  courseCertificateEmail,
  escapeHtml,
  newsletterIssueEmail,
  newsletterWelcomeEmail,
  paragraphsToHtml,
  resetPasswordEmail,
  serviceOrderReceivedEmail,
  verifyAccountEmail,
  welcomeEmail,
} from "../../src/common/mailer/mailer.templates";

describe("mail templates", () => {
  it("escapes HTML in user-provided copy", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).toBe("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(paragraphsToHtml("Hello\n\n<script>")).toContain("&lt;script&gt;");
  });

  it("builds transactional and newsletter messages", () => {
    const welcome = welcomeEmail({ name: "Ada", url: "https://rezaulkarim.dev/dashboard" });
    expect(welcome.subject).toBe("Welcome");
    expect(welcome.html).toContain("Open your dashboard");
    expect(welcome.html).toContain("Software engineer");
    expect(welcome.html).toContain("rezaulkarim.dev");
    expect(welcome.html).toContain("Account");
    expect(welcome.html).toContain("max-width:600px");
    expect(welcome.html).toContain("If the button does not open");

    const verify = verifyAccountEmail({ name: "Ada", url: "https://rezaulkarim.dev/verify-email?token=abc" });
    expect(verify.subject).toBe("Verify your email");
    expect(verify.text).toContain("https://rezaulkarim.dev/verify-email?token=abc");
    expect(verify.html).toContain("Verify email");
    expect(verify.html).toContain('role="presentation"');

    const reset = resetPasswordEmail({ name: "", url: "https://example.com/reset" });
    expect(reset.text).toContain("Hi there");

    const listWelcome = newsletterWelcomeEmail({
      name: "Reader",
      unsubscribeUrl: "https://rezaulkarim.dev/unsubscribe?token=tok",
    });
    expect(listWelcome.subject).toBe("You're on the list");
    expect(listWelcome.html).toContain("/unsubscribe?token=tok");

    const issue = newsletterIssueEmail({
      subject: "New note",
      body: "First paragraph.\n\nSecond paragraph.",
      postTitle: "JWT",
      postUrl: "https://rezaulkarim.dev/blog/jwt-authentication",
      unsubscribeUrl: "https://rezaulkarim.dev/unsubscribe?token=tok",
    });
    expect(issue.html).toContain("JWT");
    expect(issue.html).toContain("First paragraph.");

    const certificate = courseCertificateEmail({
      name: "Ada",
      courseTitle: "HTTP from zero",
      publicId: "RK-ABCDEF1234",
      url: "https://rezaulkarim.dev/course-certificates/RK-ABCDEF1234",
    });
    expect(certificate.subject).toBe("Certificate for HTTP from zero");
    expect(certificate.text).toContain("RK-ABCDEF1234");

    const request = serviceOrderReceivedEmail({
      name: "Ada",
      serviceTitle: "Backend API development",
      url: "https://rezaulkarim.dev/dashboard/orders",
    });
    expect(request.subject).toBe("Request received: Backend API development");

    const confirmation = contactConfirmationEmail({ name: "Ada", subject: "AWS deploy" });
    expect(confirmation.subject).toBe("I received your message");
    expect(confirmation.text).toContain("AWS deploy");

    const owner = contactOwnerEmail({
      name: "Ada",
      email: "ada@example.com",
      subject: "AWS deploy",
      serviceTitle: "DevOps consulting",
      url: "https://rezaulkarim.dev/admin/leads",
    });
    expect(owner.subject).toBe("Hire me: AWS deploy");
    expect(owner.text).toContain("/admin/leads");
  });
});

describe("mail errors", () => {
  it("maps SES sandbox and IAM failures to an actionable message", () => {
    expect(describeMailError(new Error("Email address is not verified. The following identities failed the check in region AP-SOUTH-1: a@b.com"))).toContain(
      "sandbox",
    );
    expect(describeMailError(new Error("User is not authorized to perform: ses:SendEmail"))).toContain("Terraform");
    expect(describeMailError(new Error("ses_timeout"))).toBe("Amazon SES did not respond in time.");
    expect(describeMailError(new Error("Could not load credentials from any providers"))).toContain("credentials");
    expect(describeMailError(new Error("Invalid login"))).toContain("SMTP");
    expect(describeMailError(new Error("connect ECONNREFUSED 127.0.0.1:587"))).toContain("SMTP host");
  });

  it("quotes the SES from display name", () => {
    expect(sesFromAddress("hello@rezaul.dev", "Rezaul Karim")).toBe('"Rezaul Karim" <hello@rezaul.dev>');
    expect(sesFromAddress("hello@rezaul.dev", "")).toBe("hello@rezaul.dev");
  });

  it("builds the public SES SMTP host from the region", () => {
    expect(sesSmtpHost("ap-south-1")).toBe("email-smtp.ap-south-1.amazonaws.com");
    expect(sesSmtpHost("")).toBe("email-smtp.ap-south-1.amazonaws.com");
  });
});

describe("SMTP send", () => {
  afterEach(() => {
    setSmtpTransport(undefined);
  });

  it("sends through Nodemailer with the configured From address", async () => {
    let from = "";
    setSmtpTransport({
      sendMail: async (message) => {
        from = message.from;
      },
    });
    await sendWithSmtp(
      { to: "reader@example.com", subject: "Hi", text: "Hi", html: "<p>Hi</p>" },
      {
        host: "smtp.example.com",
        port: 587,
        secure: false,
        user: "hello@rezaul.dev",
        password: "secret",
        fromEmail: "hello@rezaul.dev",
        fromName: "Rezaul Karim",
      },
    );
    expect(from).toBe('"Rezaul Karim" <hello@rezaul.dev>');
  });
});

describe("SES send", () => {
  afterEach(() => {
    setSesClient(undefined);
  });

  it("quotes FromEmailAddress and sends", async () => {
    let from = "";
    setSesClient({
      send: async (command) => {
        from = (command as { input?: { FromEmailAddress?: string } }).input?.FromEmailAddress ?? "";
      },
    });
    await sendWithSes({ to: "reader@example.com", subject: "Hi", text: "Hi", html: "<p>Hi</p>" });
    expect(from).toBe('"Rezaul Karim" <hello@rezaul.dev>');
  });

  it("times out a hung SES call without leaving an unhandled rejection", async () => {
    setSesClient({
      send: (_command, options) =>
        new Promise((_, reject) => {
          options?.abortSignal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    });
    await expect(
      sendWithSes({ to: "reader@example.com", subject: "Hi", text: "Hi", html: "<p>Hi</p>" }),
    ).rejects.toThrow("ses_timeout");
  });
});
