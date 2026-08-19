import { env } from "@common/config/env";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { sendMail, sendMailSafe } from "@common/mailer/mailer";
import { newsletterIssueEmail, newsletterWelcomeEmail } from "@common/mailer/mailer.templates";
import { logger } from "@common/utils/logger";
import { blogsRepository } from "@modules/blogs/blogs.repository";
import { isPublishedBlog } from "@modules/blogs/blogs.types";
import { newsletterRepository } from "./newsletter.repository";
import type { SendIssueInput, SubscribeInput } from "./newsletter.validation";

function siteUrl(path: string) {
  return `${env.FRONTEND_URL.replace(/\/$/, "")}${path}`;
}

function unsubscribePageUrl(token: string) {
  return siteUrl(`/unsubscribe?token=${encodeURIComponent(token)}`);
}

function unsubscribeApiUrl(token: string) {
  return siteUrl(`${env.API_PREFIX}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`);
}

function listHeaders(token: string) {
  return {
    "List-Unsubscribe": `<${unsubscribeApiUrl(token)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

export const newsletterService = {
  async subscribe(input: SubscribeInput) {
    const result = await newsletterRepository.subscribe(input);
    if (result.created) {
      const template = newsletterWelcomeEmail({
        name: input.name ?? "",
        unsubscribeUrl: unsubscribePageUrl(result.unsubscribeToken),
      });
      await sendMailSafe({
        to: result.subscriber.email,
        ...template,
        headers: listHeaders(result.unsubscribeToken),
      });
    }
    return result.subscriber;
  },

  list() {
    return newsletterRepository.list();
  },

  remove(id: string) {
    return newsletterRepository.remove(id);
  },

  unsubscribe(token: string) {
    const value = token.trim();
    if (value.length < 16) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Unsubscribe token is required", 400);
    }
    return newsletterRepository.unsubscribe(value);
  },

  async sendIssue(input: SendIssueInput) {
    const subscribers = await newsletterRepository.listForSend();
    if (subscribers.length === 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "There are no subscribers yet", 400);
    }

    let postTitle: string | undefined;
    let postUrl: string | undefined;
    if (input.slug) {
      const blogs = await blogsRepository.list();
      const post = blogs.find((item) => item.slug === input.slug && isPublishedBlog(item));
      if (!post) {
        throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Published post not found", 404);
      }
      postTitle = post.title;
      postUrl = siteUrl(`/blog/${post.slug}`);
    }

    let sent = 0;
    let failed = 0;
    for (const subscriber of subscribers) {
      const template = newsletterIssueEmail({
        subject: input.subject,
        body: input.body,
        postTitle,
        postUrl,
        unsubscribeUrl: unsubscribePageUrl(subscriber.unsubscribeToken),
      });
      try {
        await sendMail({
          to: subscriber.email,
          ...template,
          headers: listHeaders(subscriber.unsubscribeToken),
        });
        sent += 1;
      } catch (error) {
        failed += 1;
        logger.error("newsletter.send.failed", {
          email: subscriber.email,
          error: error instanceof Error ? error.message : "unknown",
        });
      }
    }

    logger.info("newsletter.sent", { subject: input.subject, sent, failed });
    return { sent, failed };
  },
};
