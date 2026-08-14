import { createBrowserRouter } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AboutPage } from "@/features/about/AboutPage";
import {
  AdminContentPage,
  AdminCoursesPage,
  AdminOrdersPage,
  AdminPage,
  AdminPortfolioPage,
} from "@/features/admin/AdminPage";
import { LoginPage, RegisterPage } from "@/features/auth/LoginPage";
import { BlogPage } from "@/features/blog/BlogPage";
import { CertificatesPage } from "@/features/certificates/CertificatesPage";
import { ContactPage } from "@/features/contact/ContactPage";
import { CoursesPage } from "@/features/courses/CoursesPage";
import {
  DashboardCoursesPage,
  DashboardOrdersPage,
  DashboardPage,
  DashboardSettingsPage,
} from "@/features/dashboard/DashboardPage";
import { EducationPage } from "@/features/education/EducationPage";
import { ExperiencePage } from "@/features/experience/ExperiencePage";
import { HomePage } from "@/features/home/HomePage";
import { ProjectsPage } from "@/features/projects/ProjectsPage";
import { ResumePage } from "@/features/resume/ResumePage";
import { ServicesPage } from "@/features/services/ServicesPage";
import { SkillsPage } from "@/features/skills/SkillsPage";
import { TutorialsPage } from "@/features/tutorials/TutorialsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "about", element: <AboutPage /> },
      { path: "resume", element: <ResumePage /> },
      { path: "experience", element: <ExperiencePage /> },
      { path: "education", element: <EducationPage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "skills", element: <SkillsPage /> },
      { path: "certificates", element: <CertificatesPage /> },
      { path: "blog", element: <BlogPage /> },
      { path: "tutorials", element: <TutorialsPage /> },
      { path: "courses", element: <CoursesPage /> },
      { path: "services", element: <ServicesPage /> },
      { path: "contact", element: <ContactPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
    ],
  },
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
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminPage /> },
      { path: "portfolio", element: <AdminPortfolioPage /> },
      { path: "content", element: <AdminContentPage /> },
      { path: "courses", element: <AdminCoursesPage /> },
      { path: "orders", element: <AdminOrdersPage /> },
    ],
  },
]);
