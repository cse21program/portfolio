import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/features/auth/AuthContext";
import { DashboardProfilePage } from "@/features/dashboard/DashboardProfilePage";
import type { AuthUser } from "@/types/auth";

vi.mock("@/features/auth/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const mockedAuth = vi.mocked(useAuth);

const customer: AuthUser = {
  id: "user-1",
  email: "ada@example.com",
  name: "Ada",
  imageUrl: null,
  phone: "",
  country: "",
  notifyProduct: true,
  notifyMarketing: false,
  role: "CUSTOMER",
  emailVerified: true,
  status: "ACTIVE",
  hasPassword: true,
  googleLinked: false,
};

describe("DashboardProfilePage", () => {
  const updateProfile = vi.fn();
  const uploadAvatar = vi.fn();
  const removeAvatar = vi.fn();

  beforeEach(() => {
    updateProfile.mockReset();
    uploadAvatar.mockReset();
    removeAvatar.mockReset();
    updateProfile.mockResolvedValue({ ...customer, name: "Ada Lovelace", country: "United Kingdom" });
    mockedAuth.mockReturnValue({
      user: customer,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      resendVerification: vi.fn(),
      changePassword: vi.fn(),
      updateProfile,
      uploadAvatar,
      removeAvatar,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("saves name, phone, country, and notice preferences", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <DashboardProfilePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Email")).toHaveValue("ada@example.com");

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Ada Lovelace");
    await user.type(screen.getByLabelText("Phone"), "+44 20 7946 0958");
    await user.type(screen.getByLabelText("Country"), "United Kingdom");
    await user.click(screen.getByRole("checkbox", { name: /Occasional notes/ }));
    await user.click(screen.getByRole("button", { name: "Save profile" }));

    expect(updateProfile).toHaveBeenCalledWith({
      name: "Ada Lovelace",
      phone: "+44 20 7946 0958",
      country: "United Kingdom",
      notifyProduct: true,
      notifyMarketing: true,
    });
    expect(await screen.findByText("Profile saved.")).toBeInTheDocument();
  });
});
