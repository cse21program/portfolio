import { useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "@/features/auth/AuthContext";
import { useSiteAccess } from "@/features/content/SiteAccessContext";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { followerCountLabel, type StudioFollow } from "@/types/follow";

const emptyFollow: StudioFollow = { following: false, followerCount: 0 };

function asFollow(payload: Partial<StudioFollow> | null | undefined): StudioFollow {
  return {
    following: Boolean(payload?.following),
    followerCount: typeof payload?.followerCount === "number" ? Math.max(0, payload.followerCount) : 0,
  };
}

export function FollowButton({ compact = false }: { compact?: boolean }) {
  const auth = useContext(AuthContext);
  const { catalogs } = useSiteAccess();
  const user = auth?.user ?? null;
  const location = useLocation();
  const [follow, setFollow] = useState<StudioFollow>(emptyFollow);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!catalogs.follow) {
      return;
    }
    let cancelled = false;
    void apiGet<Partial<StudioFollow>>("/follows/studio", { cache: "no-store" })
      .then((payload) => {
        if (!cancelled) {
          setFollow(asFollow(payload));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFollow(emptyFollow);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [catalogs.follow, user?.id]);

  if (!catalogs.follow) {
    return null;
  }

  async function toggle() {
    if (!user || pending) {
      return;
    }
    setPending(true);
    const nextFollowing = !follow.following;
    setFollow((current) => ({
      following: nextFollowing,
      followerCount: Math.max(0, current.followerCount + (nextFollowing ? 1 : -1)),
    }));
    try {
      const payload = nextFollowing
        ? await apiPost<StudioFollow>("/follows/studio")
        : await apiDelete<StudioFollow>("/follows/studio");
      setFollow(asFollow(payload));
    } catch {
      setFollow((current) => ({
        following: !nextFollowing,
        followerCount: Math.max(0, current.followerCount + (nextFollowing ? -1 : 1)),
      }));
    } finally {
      setPending(false);
    }
  }

  const count = followerCountLabel(follow.followerCount);
  const label = follow.following ? "Following" : "Follow";
  const className = compact
    ? `inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
        follow.following
          ? "bg-ink text-paper hover:bg-accent"
          : "border border-line bg-surface text-ink hover:border-accent/40"
      }`
    : `inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
        follow.following
          ? "bg-ink text-paper hover:bg-accent"
          : "border border-line bg-surface/80 text-ink hover:border-accent/40 hover:bg-surface"
      }`;

  if (!user) {
    return (
      <Link
        to="/login"
        state={{ from: location.pathname }}
        className={className}
      >
        Follow{count ? ` · ${follow.followerCount}` : ""}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      aria-pressed={follow.following}
      onClick={() => void toggle()}
    >
      {label}
      {count ? ` · ${follow.followerCount}` : ""}
    </button>
  );
}
