export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function paragraphsToHtml(body: string) {
  return body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p style="margin:0 0 16px;">${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function wrap(title: string, inner: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f3eee4;color:#1a1612;font-family:Georgia,serif;">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
      <p style="margin:0 0 8px;letter-spacing:0.16em;text-transform:uppercase;font-size:11px;color:#c45c1a;font-family:system-ui,sans-serif;">Rezaul Karim</p>
      <h1 style="margin:0 0 24px;font-size:28px;line-height:1.2;">${escapeHtml(title)}</h1>
      ${inner}
    </div>
  </body>
</html>`;
}

export function verifyAccountEmail(input: { name: string; url: string }) {
  const greeting = input.name.trim() || "there";
  return {
    subject: "Verify your email",
    text: `Hi ${greeting},\n\nConfirm this address to finish setting up your account:\n${input.url}\n\nIf you did not create an account, ignore this message.\n`,
    html: wrap(
      "Verify your email",
      `<p style="margin:0 0 16px;">Hi ${escapeHtml(greeting)},</p>
       <p style="margin:0 0 16px;">Confirm this address to finish setting up your account.</p>
       <p style="margin:0 0 24px;"><a href="${escapeHtml(input.url)}" style="color:#c45c1a;">Verify email</a></p>
       <p style="margin:0;font-size:13px;color:#6b645c;">If you did not create an account, ignore this message.</p>`,
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
      `<p style="margin:0 0 16px;">Hi ${escapeHtml(greeting)},</p>
       <p style="margin:0 0 16px;">Use this link to choose a new password. It expires in one hour.</p>
       <p style="margin:0 0 24px;"><a href="${escapeHtml(input.url)}" style="color:#c45c1a;">Reset password</a></p>
       <p style="margin:0;font-size:13px;color:#6b645c;">If you did not ask for this, ignore this message.</p>`,
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
      `<p style="margin:0 0 16px;">Hi ${escapeHtml(greeting)},</p>
       <p style="margin:0 0 16px;">${escapeHtml(intro)}</p>
       <p style="margin:0 0 24px;"><a href="${escapeHtml(input.url)}" style="color:#c45c1a;">Open the course</a></p>`,
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
      `<p style="margin:0 0 16px;">Hi ${escapeHtml(greeting)},</p>
       <p style="margin:0 0 16px;">I have your request for ${escapeHtml(input.serviceTitle)}. I will review it and write back.</p>
       <p style="margin:0 0 24px;"><a href="${escapeHtml(input.url)}" style="color:#c45c1a;">View your orders</a></p>`,
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
  return {
    subject: `${input.serviceTitle}: ${input.status.replace(/_/g, " ")}`,
    text: `Hi ${greeting},\n\n${body}\n${input.url}\n`,
    html: wrap(
      input.serviceTitle,
      `<p style="margin:0 0 16px;">Hi ${escapeHtml(greeting)},</p>
       <p style="margin:0 0 16px;">${escapeHtml(body)}</p>
       <p style="margin:0 0 24px;"><a href="${escapeHtml(input.url)}" style="color:#c45c1a;">View your orders</a></p>`,
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
      `<p style="margin:0 0 16px;">Hi ${escapeHtml(greeting)},</p>
       <p style="margin:0 0 16px;">You completed ${escapeHtml(input.courseTitle)}. Certificate ID ${escapeHtml(input.publicId)}.</p>
       <p style="margin:0 0 24px;"><a href="${escapeHtml(input.url)}" style="color:#c45c1a;">View certificate</a></p>`,
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
      `<p style="margin:0 0 16px;">Hi ${escapeHtml(greeting)},</p>
       <p style="margin:0 0 16px;">Thanks for writing about ${escapeHtml(input.subject)}. I will read it and reply from this address.</p>`,
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
      `<p style="margin:0 0 16px;">${escapeHtml(input.name)} &lt;${escapeHtml(input.email)}&gt; wrote about ${escapeHtml(input.subject)}${escapeHtml(service)}.</p>
       <p style="margin:0 0 24px;"><a href="${escapeHtml(input.url)}" style="color:#c45c1a;">Open Studio</a></p>`,
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
      `<p style="margin:0 0 16px;">Hi ${escapeHtml(greeting)},</p>
       <p style="margin:0 0 16px;">You will get an email when I send a new note. Occasional, not a sequence.</p>
       <p style="margin:0;font-size:13px;color:#6b645c;"><a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#c45c1a;">Unsubscribe</a></p>`,
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
  const postHtml =
    input.postTitle && input.postUrl
      ? `<p style="margin:0 0 16px;"><a href="${escapeHtml(input.postUrl)}" style="color:#c45c1a;">${escapeHtml(input.postTitle)}</a></p>`
      : "";
  return {
    subject: input.subject,
    text: `${input.body}${postText}\nUnsubscribe: ${input.unsubscribeUrl}\n`,
    html: wrap(
      input.subject,
      `${paragraphsToHtml(input.body)}${postHtml}
       <p style="margin:24px 0 0;font-size:13px;color:#6b645c;"><a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#c45c1a;">Unsubscribe</a></p>`,
    ),
  };
}
