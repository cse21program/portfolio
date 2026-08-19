import { describe, expect, it } from "vitest";
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
