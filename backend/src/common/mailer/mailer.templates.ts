export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const ink = "#1a1612";
const cream = "#f3eee4";
const page = "#efebe3";
const card = "#fffdf9";
const line = "#e6dfd2";
const wash = "#f7f2ea";
const copy = "#3f3a34";
const muted = "#7a736a";
const accent = "#c45c1a";
const sans = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const serif = "Georgia,'Times New Roman',Times,serif";

function p(html: string, last = false) {
  return `<p style="margin:0 0 ${last ? "0" : "16px"};font-family:${sans};font-size:16px;line-height:1.7;color:${copy};">${html}</p>`;
}

export function paragraphsToHtml(body: string) {
  const blocks = body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  return blocks
    .map((block, index) => p(escapeHtml(block).replace(/\n/g, "<br />"), index === blocks.length - 1))
    .join("");
}

function hairline() {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0;">
    <tr>
      <td height="1" style="height:1px;line-height:1px;font-size:0;background:${line};border:0;">&nbsp;</td>
    </tr>
  </table>`;
}

function kicker(label: string) {
  return `<p style="margin:0 0 8px;font-family:${sans};font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:${accent};">${escapeHtml(label)}</p>`;
}

function details(rows: Array<{ label: string; value: string }>) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 28px;background:${wash};border:1px solid ${line};">
    ${rows
      .map(
        (row, index) => `<tr>
      <td style="width:34%;padding:14px 18px;${index ? `border-top:1px solid ${line};` : ""}font-family:${sans};font-size:13px;color:${muted};vertical-align:top;">${escapeHtml(row.label)}</td>
      <td style="padding:14px 18px;${index ? `border-top:1px solid ${line};` : ""}font-family:${sans};font-size:14px;font-weight:600;line-height:1.45;color:${ink};">${escapeHtml(row.value)}</td>
    </tr>`,
      )
      .join("")}
  </table>`;
}

function button(href: string, label: string) {
  const safeHref = escapeHtml(href);
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 0;">
  <tr>
    <td bgcolor="${ink}" style="background:${ink};border-radius:8px;">
      <a href="${safeHref}" style="display:inline-block;padding:13px 22px;font-family:${sans};font-size:14px;font-weight:600;line-height:1;color:${cream};text-decoration:none;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>
<p style="margin:14px 0 0;font-family:${sans};font-size:12px;line-height:1.55;color:${muted};">If the button does not open, use this link:<br /><a href="${safeHref}" style="color:${accent};text-decoration:none;word-break:break-all;">${safeHref}</a></p>`;
}

function readCard(title: string, href: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 8px;border:1px solid ${line};background:${wash};">
    <tr>
      <td style="padding:18px 20px;">
        <p style="margin:0 0 6px;font-family:${sans};font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${muted};">Continue reading</p>
        <a href="${escapeHtml(href)}" style="font-family:${serif};font-size:18px;line-height:1.4;color:${ink};text-decoration:none;">${escapeHtml(title)}</a>
      </td>
    </tr>
  </table>`;
}

type WrapOptions = {
  kicker?: string;
  preheader?: string;
  cta?: { href: string; label: string };
  details?: Array<{ label: string; value: string }>;
  footnote?: string;
};

function wrap(title: string, inner: string, options: WrapOptions = {}) {
  const preheader = options.preheader ?? title;
  const footnote =
    options.footnote ??
    "You received this because of an account, order, or message on rezaulkarim.dev.";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${page};color:${ink};-webkit-text-size-adjust:100%;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${page}" style="background:${page};">
      <tr>
        <td align="center" style="padding:40px 16px 48px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border:1px solid ${line};background:${card};">
            <tr>
              <td height="3" style="height:3px;line-height:3px;font-size:0;background:${accent};">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:36px 40px 40px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="40" valign="middle" style="width:40px;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="36" height="36" align="center" bgcolor="${ink}" style="width:36px;height:36px;background:${ink};border-radius:18px;font-family:${serif};font-size:15px;font-weight:bold;color:${cream};">R</td>
                        </tr>
                      </table>
                    </td>
                    <td valign="middle" style="padding-left:12px;">
                      <p style="margin:0;font-family:${serif};font-size:18px;line-height:1.1;color:${ink};">Rezaul Karim</p>
                      <p style="margin:5px 0 0;font-family:${sans};font-size:10px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:${muted};">Software engineer · Sylhet</p>
                    </td>
                  </tr>
                </table>
                <div style="height:28px;line-height:28px;font-size:0;">&nbsp;</div>
                ${hairline()}
                <div style="height:32px;line-height:32px;font-size:0;">&nbsp;</div>
                ${options.kicker ? kicker(options.kicker) : ""}
                <h1 style="margin:0 0 18px;font-family:${serif};font-size:28px;line-height:1.25;font-weight:normal;color:${ink};">${escapeHtml(title)}</h1>
                ${inner}
                ${options.details ? details(options.details) : ""}
                ${options.cta ? button(options.cta.href, options.cta.label) : ""}
                <div style="height:36px;line-height:36px;font-size:0;">&nbsp;</div>
                ${hairline()}
                <p style="margin:20px 0 0;font-family:${sans};font-size:12px;line-height:1.7;color:${muted};">
                  ${footnote}<br />
                  <a href="https://rezaulkarim.dev" style="color:${accent};text-decoration:none;">rezaulkarim.dev</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function welcomeEmail(input: { name: string; url: string }) {
  const greeting = input.name.trim() || "there";
  return {
    subject: "Welcome",
    text: `Hi ${greeting},\n\nYour account is ready. Open your dashboard anytime:\n${input.url}\n`,
    html: wrap(
      "Welcome",
      `${p(`Hi ${escapeHtml(greeting)},`)}${p("Your account is ready. Open your dashboard anytime you want to pick up a course, an order, or a message.", true)}`,
      {
        kicker: "Account",
        preheader: "Your account is ready.",
        cta: { href: input.url, label: "Open your dashboard" },
      },
    ),
  };
}

export function verifyAccountEmail(input: { name: string; url: string }) {
  const greeting = input.name.trim() || "there";
  return {
    subject: "Verify your email",
    text: `Hi ${greeting},\n\nConfirm this address to finish setting up your account:\n${input.url}\n\nIf you did not create an account, ignore this message.\n`,
    html: wrap(
      "Verify your email",
      `${p(`Hi ${escapeHtml(greeting)},`)}${p("Confirm this address to finish setting up your account.")}${p("If you did not create an account, ignore this message.", true)}`,
      {
        kicker: "Security",
        preheader: "Confirm this address to finish setting up your account.",
        cta: { href: input.url, label: "Verify email" },
      },
    ),
  };
}

export function resetPasswordEmail(input: { name: string; url: string }) {
  const greeting = input.name.trim() || "there";
  return {
    subject: "Reset your password",
    text: `Hi ${greeting},\n\nUse this link to choose a new password. It expires in one hour.\n${input.url}\n\nIf you did not ask for this, ignore this message.\n`,
    html: wrap(
      "Reset your password",
      `${p(`Hi ${escapeHtml(greeting)},`)}${p("Use this link to choose a new password. It expires in one hour.")}${p("If you did not ask for this, ignore this message.", true)}`,
      { kicker: "Security", cta: { href: input.url, label: "Reset password" } },
    ),
  };
}

export function enrollmentConfirmedEmail(input: {
  name: string;
  courseTitle: string;
  url: string;
  granted: boolean;
}) {
  const greeting = input.name.trim() || "there";
  const intro = input.granted
    ? `You now have a seat in ${input.courseTitle}.`
    : `You are enrolled in ${input.courseTitle}.`;
  return {
    subject: input.granted ? `Your seat in ${input.courseTitle}` : `Enrolled in ${input.courseTitle}`,
    text: `Hi ${greeting},\n\n${intro}\nOpen the course:\n${input.url}\n`,
    html: wrap(
      input.granted ? "Your seat is ready" : "You are enrolled",
      `${p(`Hi ${escapeHtml(greeting)},`)}${p(escapeHtml(intro), true)}`,
      {
        kicker: "Course",
        details: [{ label: "Course", value: input.courseTitle }],
        cta: { href: input.url, label: "Open the course" },
      },
    ),
  };
}

export function orderPlacedEmail(input: {
  name: string;
  orderNumber: string;
  totalLabel: string;
  url: string;
}) {
  const greeting = input.name.trim() || "there";
  return {
    subject: `Order ${input.orderNumber}`,
    text: `Hi ${greeting},\n\nI have your order ${input.orderNumber} for ${input.totalLabel}. Payment is next, so access is not granted yet.\nView it here:\n${input.url}\n`,
    html: wrap(
      "Order received",
      `${p(`Hi ${escapeHtml(greeting)},`)}${p("I have your order. Payment is next, so access is not granted yet.", true)}`,
      {
        kicker: "Order",
        details: [
          { label: "Order", value: input.orderNumber },
          { label: "Total", value: input.totalLabel },
        ],
        cta: { href: input.url, label: "View your order" },
      },
    ),
  };
}

export function orderCancelledEmail(input: { name: string; orderNumber: string; url: string }) {
  const greeting = input.name.trim() || "there";
  return {
    subject: `Order ${input.orderNumber} cancelled`,
    text: `Hi ${greeting},\n\nOrder ${input.orderNumber} is cancelled. You can place a new one from the cart when you are ready.\n${input.url}\n`,
    html: wrap(
      "Order cancelled",
      `${p(`Hi ${escapeHtml(greeting)},`)}${p("This order is cancelled. You can place a new one from the cart when you are ready.", true)}`,
      {
        kicker: "Order",
        details: [{ label: "Order", value: input.orderNumber }],
        cta: { href: input.url, label: "View the order" },
      },
    ),
  };
}

export function reviewApprovedEmail(input: { name: string; title: string; url: string }) {
  const greeting = input.name.trim() || "there";
  return {
    subject: `Your review of ${input.title} is live`,
    text: `Hi ${greeting},\n\nYour review of ${input.title} is now on the public page.\n${input.url}\n`,
    html: wrap(
      "Review published",
      `${p(`Hi ${escapeHtml(greeting)},`)}${p("Your review is now on the public page.", true)}`,
      {
        kicker: "Review",
        details: [{ label: "On", value: input.title }],
        cta: { href: input.url, label: "View the page" },
      },
    ),
  };
}

export function paymentReceivedEmail(input: {
  name: string;
  orderNumber: string;
  totalLabel: string;
  providerName: string;
  url: string;
}) {
  const greeting = input.name.trim() || "there";
  return {
    subject: `Payment received for ${input.orderNumber}`,
    text: `Hi ${greeting},\n\nPayment of ${input.totalLabel} via ${input.providerName} is recorded for order ${input.orderNumber}. Course seats from this order are now granted.\n${input.url}\n`,
    html: wrap(
      "Payment received",
      `${p(`Hi ${escapeHtml(greeting)},`)}${p("Payment is recorded. Course seats from this order are now granted.", true)}`,
      {
        kicker: "Payment",
        details: [
          { label: "Order", value: input.orderNumber },
          { label: "Amount", value: input.totalLabel },
          { label: "Method", value: input.providerName },
        ],
        cta: { href: input.url, label: "View your order" },
      },
    ),
  };
}

export function paymentFailedEmail(input: { name: string; orderNumber: string; url: string }) {
  const greeting = input.name.trim() || "there";
  return {
    subject: `Payment failed for ${input.orderNumber}`,
    text: `Hi ${greeting},\n\nThe demo payment for order ${input.orderNumber} did not go through. You can try again from the order page.\n${input.url}\n`,
    html: wrap(
      "Payment failed",
      `${p(`Hi ${escapeHtml(greeting)},`)}${p("The demo payment did not go through. You can try again from the order page.", true)}`,
      {
        kicker: "Payment",
        details: [{ label: "Order", value: input.orderNumber }],
        cta: { href: input.url, label: "View your order" },
      },
    ),
  };
}

export function serviceOrderReceivedEmail(input: { name: string; serviceTitle: string; url: string }) {
  const greeting = input.name.trim() || "there";
  return {
    subject: `Request received: ${input.serviceTitle}`,
    text: `Hi ${greeting},\n\nI have your request for ${input.serviceTitle}. I will review it and write back from Studio.\nTrack it here:\n${input.url}\n`,
    html: wrap(
      "Request received",
      `${p(`Hi ${escapeHtml(greeting)},`)}${p("I have your request. I will review it and write back.", true)}`,
      {
        kicker: "Service",
        details: [{ label: "Service", value: input.serviceTitle }],
        cta: { href: input.url, label: "View your orders" },
      },
    ),
  };
}

function statusCopy(status: string) {
  switch (status) {
    case "confirmed":
      return "Your request is confirmed. Work can start once we agree the first slice.";
    case "in_progress":
      return "Work is in progress.";
    case "delivered":
      return "A delivery is ready for you to review.";
    case "revision_requested":
      return "A revision is on the board.";
    case "completed":
      return "This order is complete.";
    case "cancelled":
      return "This request was cancelled.";
    default:
      return "Your service request was updated.";
  }
}

export function serviceOrderStatusEmail(input: {
  name: string;
  serviceTitle: string;
  status: string;
  url: string;
}) {
  const greeting = input.name.trim() || "there";
  const body = statusCopy(input.status);
  const statusLabel = input.status.replace(/_/g, " ");
  return {
    subject: `${input.serviceTitle}: ${statusLabel}`,
    text: `Hi ${greeting},\n\n${body}\n${input.url}\n`,
    html: wrap(
      input.serviceTitle,
      `${p(`Hi ${escapeHtml(greeting)},`)}${p(escapeHtml(body), true)}`,
      {
        kicker: "Service",
        details: [{ label: "Status", value: statusLabel }],
        cta: { href: input.url, label: "View your orders" },
      },
    ),
  };
}

export function courseCertificateEmail(input: {
  name: string;
  courseTitle: string;
  publicId: string;
  url: string;
}) {
  const greeting = input.name.trim() || "there";
  return {
    subject: `Certificate for ${input.courseTitle}`,
    text: `Hi ${greeting},\n\nYou completed ${input.courseTitle}. Certificate ID ${input.publicId}.\nView or print it:\n${input.url}\n`,
    html: wrap(
      "Course complete",
      `${p(`Hi ${escapeHtml(greeting)},`)}${p("You completed the course. View or print the certificate below.", true)}`,
      {
        kicker: "Certificate",
        details: [
          { label: "Course", value: input.courseTitle },
          { label: "ID", value: input.publicId },
        ],
        cta: { href: input.url, label: "View certificate" },
      },
    ),
  };
}

export function contactConfirmationEmail(input: { name: string; subject: string }) {
  const greeting = input.name.trim() || "there";
  return {
    subject: "I received your message",
    text: `Hi ${greeting},\n\nThanks for writing about "${input.subject}". I will read it and reply from this address.\n`,
    html: wrap(
      "Message received",
      `${p(`Hi ${escapeHtml(greeting)},`)}${p("Thanks for writing. I will read it and reply from this address.", true)}`,
      {
        kicker: "Contact",
        details: [{ label: "About", value: input.subject }],
      },
    ),
  };
}

export function contactOwnerEmail(input: {
  name: string;
  email: string;
  subject: string;
  serviceTitle: string;
  url: string;
}) {
  const service = input.serviceTitle.trim() ? ` · ${input.serviceTitle}` : "";
  return {
    subject: `Hire me: ${input.subject}`,
    text: `${input.name} <${input.email}> wrote about ${input.subject}${service}.\nOpen Studio:\n${input.url}\n`,
    html: wrap(
      "New inquiry",
      `${p("A hire-me note arrived in Studio.", true)}`,
      {
        kicker: "Studio",
        details: [
          { label: "From", value: `${input.name} <${input.email}>` },
          { label: "Subject", value: input.subject },
          ...(input.serviceTitle.trim() ? [{ label: "Service", value: input.serviceTitle }] : []),
        ],
        cta: { href: input.url, label: "Open Studio" },
      },
    ),
  };
}

export function newsletterWelcomeEmail(input: { name: string; unsubscribeUrl: string }) {
  const greeting = input.name.trim() || "there";
  return {
    subject: "You're on the list",
    text: `Hi ${greeting},\n\nYou will get an email when I send a new note from rezaulkarim.dev. Occasional, not a sequence.\n\nUnsubscribe: ${input.unsubscribeUrl}\n`,
    html: wrap(
      "You're on the list",
      `${p(`Hi ${escapeHtml(greeting)},`)}${p("You will get an email when I send a new note. Occasional, not a sequence.", true)}`,
      {
        kicker: "Notes",
        footnote: `<a href="${escapeHtml(input.unsubscribeUrl)}" style="color:${accent};text-decoration:none;">Unsubscribe</a> · You received this because you joined the list on rezaulkarim.dev.`,
      },
    ),
  };
}

export function newsletterIssueEmail(input: {
  subject: string;
  body: string;
  postTitle?: string;
  postUrl?: string;
  unsubscribeUrl: string;
}) {
  const postText =
    input.postTitle && input.postUrl ? `\n\nRead: ${input.postTitle}\n${input.postUrl}\n` : "";
  const postHtml = input.postTitle && input.postUrl ? readCard(input.postTitle, input.postUrl) : "";
  return {
    subject: input.subject,
    text: `${input.body}${postText}\nUnsubscribe: ${input.unsubscribeUrl}\n`,
    html: wrap(input.subject, `${paragraphsToHtml(input.body)}${postHtml}`, {
      kicker: "Notes",
      footnote: `<a href="${escapeHtml(input.unsubscribeUrl)}" style="color:${accent};text-decoration:none;">Unsubscribe</a> · You received this because you joined the list on rezaulkarim.dev.`,
    }),
  };
}

export function studioTestEmail(input: { transportLabel: string }) {
  return {
    subject: "Test email from Studio",
    text: `This is a test from the Email page. It was sent with ${input.transportLabel}.\n`,
    html: wrap(
      "Test email from Studio",
      `${p("This is a test from the Email page. If this message looks right, the transport is ready.", true)}`,
      {
        kicker: "Studio",
        preheader: `Sent with ${input.transportLabel}.`,
        details: [{ label: "Transport", value: input.transportLabel }],
      },
    ),
  };
}
