export type StudioFollow = {
  following: boolean;
  followerCount: number;
};

export type StudioFollower = {
  userId: string;
  name: string;
  email: string;
  createdAt: string;
};

export type StudioFollowersPage = {
  follows: StudioFollower[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function followerCountLabel(count: number) {
  if (count <= 0) {
    return "";
  }
  return count === 1 ? "1 following" : `${count} following`;
}
