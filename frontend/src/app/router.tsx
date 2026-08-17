import { Navigate, createBrowserRouter } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AboutPage } from "@/features/about/AboutPage";
import { AdminAboutPage } from "@/features/about/AdminAboutPage";
import {
  AdminContentPage,
  AdminCoursesPage,
  AdminOrdersPage,
  AdminPage,
} from "@/features/admin/AdminPage";
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { ResetPasswordPage } from "@/features/auth/ResetPasswordPage";
import { GuestOnly, RequireAuth } from "@/features/auth/RequireAuth";
import { VerifyEmailPage } from "@/features/auth/VerifyEmailPage";
import { BlogDetailPage } from "@/features/blog/BlogDetailPage";
import { BlogPage } from "@/features/blog/BlogPage";
import { CertificatesPage } from "@/features/certificates/CertificatesPage";
import { ContactPage } from "@/features/contact/ContactPage";
import { CourseDetailPage } from "@/features/courses/CourseDetailPage";
import { CoursesPage } from "@/features/courses/CoursesPage";
import {
  DashboardCoursesPage,
  DashboardOrdersPage,
  DashboardPage,
  DashboardSettingsPage,
} from "@/features/dashboard/DashboardPage";
import { EducationPage } from "@/features/education/EducationPage";
import { AdminEducationPage } from "@/features/education/AdminEducationPage";
import { AdminExperiencePage } from "@/features/experience/AdminExperiencePage";
import { ExperiencePage } from "@/features/experience/ExperiencePage";
import { HomePage } from "@/features/home/HomePage";
import { ProjectDetailPage } from "@/features/projects/ProjectDetailPage";
import { ProjectsPage } from "@/features/projects/ProjectsPage";
import { AdminResumePage } from "@/features/resume/AdminResumePage";
import { ResumePage } from "@/features/resume/ResumePage";
import { ServiceDetailPage } from "@/features/services/ServiceDetailPage";
import { ServicesPage } from "@/features/services/ServicesPage";
import { SkillDetailPage } from "@/features/skills/SkillDetailPage";
import { SkillsPage } from "@/features/skills/SkillsPage";
import { TopicDetailPage } from "@/features/skills/TopicDetailPage";
import { TutorialDetailPage } from "@/features/tutorials/TutorialDetailPage";
import { TutorialsPage } from "@/features/tutorials/TutorialsPage";
import { NotFoundState } from "@/components/ui/NotFoundState";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "about", element: <AboutPage /> },
      { path: "about/photos", element: <Navigate to="/about" replace /> },
      { path: "resume", element: <ResumePage /> },
      { path: "experience", element: <ExperiencePage /> },
      { path: "education", element: <EducationPage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "projects/:slug", element: <ProjectDetailPage /> },
      { path: "skills", element: <SkillsPage /> },
      { path: "skills/:skillSlug", element: <SkillDetailPage /> },
      { path: "skills/:skillSlug/:topicSlug", element: <TopicDetailPage /> },
      { path: "certificates", element: <CertificatesPage /> },
      { path: "blog", element: <BlogPage /> },
      { path: "blog/:slug", element: <BlogDetailPage /> },
      { path: "tutorials", element: <TutorialsPage /> },
      { path: "tutorials/:slug", element: <TutorialDetailPage /> },
      { path: "courses", element: <CoursesPage /> },
      { path: "courses/:slug", element: <CourseDetailPage /> },
      { path: "services", element: <ServicesPage /> },
      { path: "services/:slug", element: <ServiceDetailPage /> },
      { path: "contact", element: <ContactPage /> },
      {
        path: "login",
        element: (
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        ),
      },
      {
        path: "register",
        element: (
          <GuestOnly>
            <RegisterPage />
          </GuestOnly>
        ),
      },
      {
        path: "forgot-password",
        element: (
          <GuestOnly>
            <ForgotPasswordPage />
          </GuestOnly>
        ),
      },
      { path: "reset-password", element: <ResetPasswordPage /> },
      { path: "verify-email", element: <VerifyEmailPage /> },
      { path: "*", element: <NotFoundState title="Page not found" /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: "/dashboard",
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "courses", element: <DashboardCoursesPage /> },
          { path: "orders", element: <DashboardOrdersPage /> },
          { path: "settings", element: <DashboardSettingsPage /> },
        ],
      },
    ],
  },
  {
    element: <RequireAuth roles={["ADMIN"]} />,
    children: [
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminPage /> },
          { path: "portfolio", element: <AdminAboutPage /> },
          { path: "resume", element: <AdminResumePage /> },
          { path: "experience", element: <AdminExperiencePage /> },
          { path: "education", element: <AdminEducationPage /> },
          { path: "content", element: <AdminContentPage /> },
          { path: "courses", element: <AdminCoursesPage /> },
          { path: "orders", element: <AdminOrdersPage /> },
        ],
      },
    ],
  },
]);
