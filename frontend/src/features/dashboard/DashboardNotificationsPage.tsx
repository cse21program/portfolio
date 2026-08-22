import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/ui/EmptyState";
import { AuthError } from "@/features/auth/AuthForm";
import { refreshNotificationBadge } from "@/features/notifications/refreshNotifications";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import {
  formatNotificationDate,
  notificationKindLabel,
  type AccountNotification,
} from "@/types/notification";

type ListPayload = {
  notifications: AccountNotification[];
  unreadCount: number;
};

export function DashboardNotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AccountNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiGet<ListPayload>("/notifications", { cache: "no-store" })
      .then((payload) => {
        if (!cancelled) {
          setItems(payload.notifications);
          setUnreadCount(payload.unreadCount);
          setError("");
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Could not load notifications");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function markAllRead() {
    setPending(true);
    setError("");
    try {
      await apiPost("/notifications/read-all");
      setItems((current) =>
        current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })),
      );
      setUnreadCount(0);
      refreshNotificationBadge();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not mark notices as read");
    } finally {
      setPending(false);
    }
  }

  async function openNotice(item: AccountNotification) {
    if (!item.readAt) {
      try {
        const payload = await apiPatch<{ notification: AccountNotification }>(
          `/notifications/${item.id}/read`,
        );
        setItems((current) =>
          current.map((row) => (row.id === item.id ? payload.notification : row)),
        );
        setUnreadCount((count) => Math.max(0, count - 1));
        refreshNotificationBadge();
      } catch {
        /* Opening still works if the mark-read call fails. */
      }
    }
    if (item.href) {
      navigate(item.href);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.16em] text-muted uppercase">Account</p>
          <h1 className="mt-2 font-display text-4xl text-ink">Notifications</h1>
          <p className="mt-3 max-w-2xl text-ink-soft">
            Account, order, and course notices. Email still goes out separately when mail is
            configured.
          </p>
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            className="text-sm font-medium text-accent hover:text-accent-dark disabled:opacity-60"
            disabled={pending}
            onClick={() => void markAllRead()}
          >
            Mark all as read
          </button>
        ) : null}
      </div>

      {error ? <AuthError>{error}</AuthError> : null}

      {loading ? (
        <div className="h-40 animate-pulse rounded-[1.75rem] bg-paper-muted" />
      ) : items.length === 0 ? (
        <EmptyState
          title="No notices yet"
          description="Enrollments, payments, and account events will show up here."
          action={{ label: "Back to overview", to: "/dashboard" }}
        />
      ) : (
        <ul className="overflow-hidden rounded-[1.75rem] border border-line">
          {items.map((item, index) => {
            const unread = !item.readAt;
            const content = (
              <>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="text-xs tracking-[0.16em] text-muted uppercase">
                    {notificationKindLabel(item.type)}
                  </p>
                  <p className="text-xs text-muted">{formatNotificationDate(item.createdAt)}</p>
                </div>
                <p className={`mt-2 ${unread ? "font-medium text-ink" : "text-ink"}`}>{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-ink-soft">{item.body}</p>
              </>
            );
            return (
              <li key={item.id} className={index > 0 ? "border-t border-line" : ""}>
                {item.href ? (
                  <Link
                    to={item.href}
                    className={`block px-5 py-5 transition hover:bg-surface sm:px-7 ${unread ? "bg-surface" : "bg-paper-muted/30"}`}
                    onClick={() => {
                      if (!item.readAt) {
                        void apiPatch(`/notifications/${item.id}/read`).catch(() => undefined);
                      }
                    }}
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={`block w-full px-5 py-5 text-left sm:px-7 ${unread ? "bg-surface" : "bg-paper-muted/30"}`}
                    onClick={() => void openNotice(item)}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
