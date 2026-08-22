import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { NOTIFICATIONS_REFRESH } from "@/features/notifications/refreshNotifications";
import { apiGet } from "@/lib/api";

function unreadLabel(count: number) {
  if (count <= 0) {
    return "Notifications";
  }
  if (count > 99) {
    return "99+ unread notifications";
  }
  return `${count} unread ${count === 1 ? "notification" : "notifications"}`;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }

    let cancelled = false;

    function load() {
      void apiGet<{ unreadCount: number }>("/notifications/unread", { cache: "no-store" })
        .then((payload) => {
          if (!cancelled) {
            setUnread(typeof payload.unreadCount === "number" ? payload.unreadCount : 0);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setUnread(0);
          }
        });
    }

    load();
    window.addEventListener("focus", load);
    window.addEventListener(NOTIFICATIONS_REFRESH, load);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", load);
      window.removeEventListener(NOTIFICATIONS_REFRESH, load);
    };
  }, [user?.id]);

  if (!user) {
    return null;
  }

  const badge = unread > 99 ? "99+" : unread > 9 ? "9+" : String(unread);

  return (
    <NavLink
      to="/dashboard/notifications"
      className="relative grid h-9 w-9 place-items-center rounded-full border border-line text-ink hover:border-accent"
      aria-label={unreadLabel(unread)}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          d="M6 9.5a6 6 0 1 1 12 0c0 4 1.2 5.5 1.8 6.2.3.4 0 1.3-.8 1.3H5c-.8 0-1.1-.9-.8-1.3.6-.7 1.8-2.2 1.8-6.2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M10 18.5a2 2 0 0 0 4 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
      {unread > 0 ? (
        <span className="absolute -top-1 -right-1 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] leading-4 font-medium text-paper">
          {badge}
        </span>
      ) : null}
    </NavLink>
  );
}
