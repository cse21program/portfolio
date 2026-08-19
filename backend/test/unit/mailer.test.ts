import { afterEach, describe, expect, it } from "vitest";
import { describeMailError } from "../../src/common/mailer/mailer.errors";
import { sendWithSes, sesFromAddress, setSesClient } from "../../src/common/mailer/mailer.ses";
import {
  escapeHtml,
  newsletterIssueEmail,
  newsletterWelcomeEmail,
  paragraphsToHtml,
  resetPasswordEmail,
  verifyAccountEmail,
} from "../../src/common/mailer/mailer.templates";

describe("mail templates", () => {
  it("escapes HTML in user-provided copy", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).toBe("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(paragraphsToHtml("Hello\n\n<script>")).toContain("&lt;script&gt;");
  });

  it("builds transactional and newsletter messages", () => {
    const verify = verifyAccountEmail({ name: "Ada", url: "https://rezaulkarim.dev/verify-email?token=abc" });
    expect(verify.subject).toBe("Verify your email");
    expect(verify.text).toContain("https://rezaulkarim.dev/verify-email?token=abc");

    const reset = resetPasswordEmail({ name: "", url: "https://example.com/reset" });
    expect(reset.text).toContain("Hi there");

    const welcome = newsletterWelcomeEmail({
      name: "Reader",
      unsubscribeUrl: "https://rezaulkarim.dev/unsubscribe?token=tok",
    });
    expect(welcome.subject).toBe("You're on the list");
    expect(welcome.html).toContain("/unsubscribe?token=tok");

    const issue = newsletterIssueEmail({
      subject: "New note",
      body: "First paragraph.\n\nSecond paragraph.",
      postTitle: "JWT",
      postUrl: "https://rezaulkarim.dev/blog/jwt-authentication",
      unsubscribeUrl: "https://rezaulkarim.dev/unsubscribe?token=tok",
    });
    expect(issue.html).toContain("JWT");
    expect(issue.html).toContain("First paragraph.");
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
  });

  it("quotes the SES from display name", () => {
    expect(sesFromAddress("hello@rezaul.dev", "Rezaul Karim")).toBe('"Rezaul Karim" <hello@rezaul.dev>');
    expect(sesFromAddress("hello@rezaul.dev", "")).toBe("hello@rezaul.dev");
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
