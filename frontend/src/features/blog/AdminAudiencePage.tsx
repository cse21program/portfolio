import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, FormSelect, FormTextArea } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import type { BlogComment } from "@/features/blog/BlogEngagement";
import { useSiteAccess } from "@/features/content/SiteAccessContext";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { useFormErrors } from "@/lib/useFormErrors";
import { collectErrors, validateMessage, validateSubject } from "@/lib/validation";
import { formatBlogDate, publishedArticles, type Article } from "@/types/blog";
import type { StudioFollower } from "@/types/follow";
import { normalizePublicCatalogs, type PublicCatalogs } from "@/types/siteAccess";

type AdminComment = BlogComment & { title: string };

type Subscriber = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

type SendFields = "subject" | "body";

export function AdminAudiencePage() {
  const { reload: reloadCatalogs } = useSiteAccess();
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [followers, setFollowers] = useState<StudioFollower[]>([]);
  const [followLive, setFollowLive] = useState(true);
  const [posts, setPosts] = useState<Article[]>([]);
  const [error, setError] = useState("");
  const [sentNote, setSentNote] = useState("");
  const [pending, setPending] = useState("");
  const {
    fieldErrors,
    formError,
    setFieldError,
    clearField,
    resetErrors,
    applyFieldErrors,
    applyCaughtError,
  } = useFormErrors<SendFields>();

  const reload = useCallback(async () => {
    try {
      const [commentPayload, subscriberPayload, blogPayload, followPayload, accessPayload] = await Promise.all([
        apiGet<{ comments: AdminComment[] }>("/blogs/comments", { cache: "no-store" }),
        apiGet<{ subscribers: Subscriber[] }>("/newsletter", { cache: "no-store" }),
        apiGet<{ blogs: Article[] }>("/blogs", { cache: "no-store" }),
        apiGet<{ follows: StudioFollower[] }>("/follows/admin/studio", { cache: "no-store" }),
        apiGet<{ catalogs: PublicCatalogs }>("/site-access", { cache: "no-store" }),
      ]);
      setComments(commentPayload.comments ?? []);
      setSubscribers(subscriberPayload.subscribers ?? []);
      setPosts(publishedArticles(blogPayload.blogs ?? []));
      setFollowers(followPayload.follows ?? []);
      setFollowLive(normalizePublicCatalogs(accessPayload.catalogs).follow);
      setError("");
    } catch {
      setError("Could not load audience");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function removeComment(id: string) {
    setPending(id);
    try {
      await apiDelete(`/blogs/comments/${id}`);
      setComments((current) => current.filter((item) => item.id !== id));
    } catch {
      setError("Could not remove comment");
    } finally {
      setPending("");
    }
  }

  async function removeSubscriber(id: string) {
    setPending(id);
    try {
      await apiDelete(`/newsletter/${id}`);
      setSubscribers((current) => current.filter((item) => item.id !== id));
    } catch {
      setError("Could not remove subscriber");
    } finally {
      setPending("");
    }
  }

  async function setFollowPublic(next: boolean) {
    setPending("follow");
    try {
      const access = await apiGet<{ catalogs: PublicCatalogs }>("/site-access", { cache: "no-store" });
      const catalogs = normalizePublicCatalogs({ ...access.catalogs, follow: next });
      await apiPut("/site-access", { catalogs });
      setFollowLive(next);
      await reloadCatalogs();
    } catch {
      setError("Could not update Follow on the public site");
    } finally {
      setPending("");
    }
  }

  async function removeFollower(userId: string) {
    setPending(userId);
    try {
      await apiDelete(`/follows/admin/studio/${userId}`);
      setFollowers((current) => current.filter((item) => item.userId !== userId));
    } catch {
      setError("Could not remove follower");
    } finally {
      setPending("");
    }
  }

  async function sendIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const subject = String(data.get("subject") ?? "");
    const body = String(data.get("body") ?? "");
    const slug = String(data.get("slug") ?? "");
    resetErrors();
    setSentNote("");
    if (applyFieldErrors(collectErrors({ subject: validateSubject(subject), body: validateMessage(body, 8) }))) {
      return;
    }
    setPending("send");
    try {
      const result = await apiPost<{ sent: number; failed: number; error?: string }>("/newsletter/send", {
        subject,
        body,
        slug,
      });
      if (result.failed === 0) {
        form.reset();
      }
      const reason = result.error?.trim();
      setSentNote(
        `Sent to ${result.sent}${result.failed ? `, ${result.failed} failed` : ""}.${reason ? ` ${reason}` : ""}`,
      );
    } catch (caught) {
      applyCaughtError(caught, "Could not send the issue");
    } finally {
      setPending("");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.16em] text-accent uppercase">Studio</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Audience</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Moderate comments, turn the public Follow button on or off, and send the newsletter.
        </p>
      </div>

      <AuthError>{error}</AuthError>

      <section className="space-y-5">
        <div>
          <h2 className="font-display text-2xl text-ink">Comments</h2>
          <p className="mt-1 text-sm text-muted">{comments.length} on published and unpublished slugs.</p>
        </div>
        {comments.length === 0 ? (
          <EmptyState
            title="No comments yet"
            description="When readers leave a note on a post, it will show here so you can remove it."
            action={{ label: "Open blog", to: "/admin/blogs" }}
          />
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => (
              <li key={comment.id} className="rounded-[1.5rem] border border-line bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-accent">{comment.title}</p>
                    <p className="mt-1 font-medium text-ink">{comment.author}</p>
                    <p className="text-xs text-muted">{formatBlogDate(comment.createdAt)}</p>
                  </div>
                  <button
                    type="button"
                    className="cursor-pointer text-sm text-accent hover:text-accent-dark disabled:opacity-60"
                    disabled={pending === comment.id}
                    onClick={() => void removeComment(comment.id)}
                  >
                    Remove comment
                  </button>
                </div>
                <p className="mt-3 text-sm leading-7 text-ink-soft">{comment.body}</p>
                <Link to={`/blog/${comment.slug}`} className="mt-3 inline-block text-sm text-accent">
                  View post
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-ink">Followers</h2>
            <p className="mt-1 text-sm text-muted">
              {followers.length} {followers.length === 1 ? "person follows" : "people follow"} the studio.
              {followLive
                ? " The Follow button is live on Home, About, and Writing."
                : " The public Follow button is stopped."}
            </p>
          </div>
          <div
            className="inline-flex rounded-full border border-line bg-paper p-0.5"
            role="group"
            aria-label="Follow on the public site"
          >
            {(
              [
                { live: true, name: "Live" },
                { live: false, name: "Stop" },
              ] as const
            ).map((option) => {
              const active = followLive === option.live;
              return (
                <button
                  key={option.name}
                  type="button"
                  aria-pressed={active}
                  disabled={pending === "follow"}
                  className={`min-w-[4.5rem] rounded-full px-3 py-1.5 text-sm transition disabled:opacity-60 ${
                    active
                      ? option.live
                        ? "bg-ink text-paper shadow-sm"
                        : "bg-paper-muted text-ink shadow-sm"
                      : "text-muted hover:text-ink"
                  }`}
                  onClick={() => {
                    if (followLive !== option.live) {
                      void setFollowPublic(option.live);
                    }
                  }}
                >
                  {option.name}
                </button>
              );
            })}
          </div>
        </div>
        {followers.length === 0 ? (
          <EmptyState
            title="No followers yet"
            description="Signed-in readers can follow from About, Writing, or the home page. They get in-app notices when you publish."
          />
        ) : (
          <ul className="space-y-3">
            {followers.map((follower) => (
              <li
                key={follower.userId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-line bg-surface p-5"
              >
                <div>
                  <p className="font-medium text-ink">{follower.name || follower.email}</p>
                  <p className="text-sm text-muted">
                    {[follower.email, formatBlogDate(follower.createdAt)].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <button
                  type="button"
                  className="cursor-pointer text-sm text-accent hover:text-accent-dark disabled:opacity-60"
                  disabled={pending === follower.userId}
                  onClick={() => void removeFollower(follower.userId)}
                >
                  Remove follower
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="font-display text-2xl text-ink">Newsletter</h2>
          <p className="mt-1 text-sm text-muted">{subscribers.length} subscribed.</p>
        </div>

        <form className="space-y-4 rounded-[1.5rem] border border-line bg-surface p-5 sm:p-6" onSubmit={sendIssue} noValidate>
          <h3 className="font-display text-xl text-ink">Send an issue</h3>
          <AuthError>{formError}</AuthError>
          {sentNote ? (
            <p className="text-sm text-ink-soft" role="status">
              {sentNote}
            </p>
          ) : null}
          <FormField
            label="Subject"
            name="subject"
            error={fieldErrors.subject}
            onChange={() => clearField("subject")}
            onBlur={(event) => setFieldError("subject", validateSubject(event.target.value))}
          />
          <FormTextArea
            label="Message"
            name="body"
            rows={6}
            hint="Plain text. Paragraphs are split on blank lines."
            error={fieldErrors.body}
            onChange={() => clearField("body")}
            onBlur={(event) => setFieldError("body", validateMessage(event.target.value, 8))}
          />
          <FormSelect label="Link a post (optional)" name="slug" defaultValue="">
            <option value="">No linked post</option>
            {posts.map((post) => (
              <option key={post.slug} value={post.slug}>
                {post.title}
              </option>
            ))}
          </FormSelect>
          <button
            type="submit"
            disabled={pending === "send" || subscribers.length === 0}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-accent disabled:opacity-60"
          >
            Send issue
          </button>
        </form>

        {subscribers.length === 0 ? (
          <EmptyState
            title="No subscribers yet"
            description="The public footer and writing page collect addresses. Welcome mail goes out when someone joins."
          />
        ) : (
          <ul className="space-y-3">
            {subscribers.map((subscriber) => (
              <li
                key={subscriber.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-line bg-surface p-5"
              >
                <div>
                  <p className="font-medium text-ink">{subscriber.email}</p>
                  <p className="text-sm text-muted">
                    {[subscriber.name, formatBlogDate(subscriber.createdAt)].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <button
                  type="button"
                  className="cursor-pointer text-sm text-accent hover:text-accent-dark disabled:opacity-60"
                  disabled={pending === subscriber.id}
                  onClick={() => void removeSubscriber(subscriber.id)}
                >
                  Remove subscriber
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
