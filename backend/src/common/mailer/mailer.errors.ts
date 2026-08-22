export function describeMailError(error: unknown): string {
  const raw = rawMailError(error);
  const lower = raw.toLowerCase();

  if (lower.includes("ses_timeout") || lower.includes("the operation was aborted")) {
    return "Amazon SES did not respond in time.";
  }
  if (lower.includes("not verified") || lower.includes("mailfromdomainnotverified")) {
    return "Amazon SES rejected the recipient. The account is likely still in sandbox, so it can only send to verified addresses. Verify this email in SES (ap-south-1) or request production access.";
  }
  if (lower.includes("not authorized") || lower.includes("accessdenied") || lower.includes("access denied")) {
    return "The API is not allowed to send with SES. Apply the Terraform EC2 policy that includes ses:SendEmail.";
  }
  if (lower.includes("could not load credentials") || lower.includes("credentialsprovider")) {
    return "The API could not load AWS credentials for SES.";
  }
  if (lower.includes("mail_from is not set")) {
    return "From email is not set for the selected mail transport.";
  }
  if (lower.includes("smtp is not configured") || lower.includes("smtp is selected")) {
    return raw;
  }
  if (lower.includes("econnrefused") || lower.includes("enotfound") || lower.includes("eteimedout") || lower.includes("etimedout")) {
    return "The SMTP host did not accept the connection. Check the host, port, and encryption.";
  }
  if (lower.includes("invalid login") || lower.includes("authentication failed") || lower.includes("535") || lower.includes("eauth")) {
    return "SMTP rejected the username or password.";
  }
  return raw || "The mail transport rejected the message.";
}

function rawMailError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.trim()) {
      return error.message;
    }
    if (error.cause) {
      return rawMailError(error.cause);
    }
    return error.name;
  }
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return error ? String(error) : "";
}
