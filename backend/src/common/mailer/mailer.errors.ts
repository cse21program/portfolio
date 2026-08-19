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
    return "MAIL_FROM is not set on the API.";
  }
  return raw || "Amazon SES rejected the message.";
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
