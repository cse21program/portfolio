import { Navigate, createBrowserRouter } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PublicCatalog } from "@/components/content/PublicCatalog";
import { AboutPage } from "@/features/about/AboutPage";
import { AdminAboutPage } from "@/features/about/AdminAboutPage";
import { AdminPage } from "@/features/admin/AdminPage";
import { AdminCatalogsPage } from "@/features/admin/AdminCatalogsPage";
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { ResetPasswordPage } from "@/features/auth/ResetPasswordPage";
import { GuestOnly, RequireAuth } from "@/features/auth/RequireAuth";
import { VerifyEmailPage } from "@/features/auth/VerifyEmailPage";
import { AdminBlogsPage } from "@/features/blog/AdminBlogsPage";
import { AdminAudiencePage } from "@/features/blog/AdminAudiencePage";
import { AdminTutorialsPage } from "@/features/tutorials/AdminTutorialsPage";
import { BlogDetailPage } from "@/features/blog/BlogDetailPage";
import { BlogPage } from "@/features/blog/BlogPage";
import { UnsubscribePage } from "@/features/blog/UnsubscribePage";
import { CertificatesPage } from "@/features/certificates/CertificatesPage";
import { CertificateDetailPage } from "@/features/certificates/CertificateDetailPage";
import { AdminCertificatesPage } from "@/features/certificates/AdminCertificatesPage";
import { ContactPage } from "@/features/contact/ContactPage";
import { CartPage } from "@/features/cart/CartPage";
import { CheckoutPage } from "@/features/checkout/CheckoutPage";
import { CheckoutThanksPage } from "@/features/checkout/CheckoutThanksPage";
import { DemoPayPage } from "@/features/payments/DemoPayPage";
import { AdminOrdersPage } from "@/features/checkout/AdminOrdersPage";
import { AdminPaymentsPage } from "@/features/payments/AdminPaymentsPage";
import { AdminMailPage } from "@/features/mail/AdminMailPage";
import { AdminLeadsPage } from "@/features/contact/AdminLeadsPage";
import { AdminMediaPage } from "@/features/media/AdminMediaPage";
import { AdminVideosPage } from "@/features/videos/AdminVideosPage";
import { AdminCoursesPage } from "@/features/courses/AdminCoursesPage";
import { AdminEnrollmentsPage } from "@/features/courses/AdminEnrollmentsPage";
import { CourseDetailPage } from "@/features/courses/CourseDetailPage";
import { CourseCertificatePage } from "@/features/courses/CourseCertificatePage";
import { CoursesPage } from "@/features/courses/CoursesPage";
import {
  DashboardCoursesPage,
  DashboardOrdersPage,
  DashboardPage,
  DashboardSettingsPage,
} from "@/features/dashboard/DashboardPage";
import { DashboardProfilePage } from "@/features/dashboard/DashboardProfilePage";
import { DashboardNotificationsPage } from "@/features/dashboard/DashboardNotificationsPage";
import { DashboardPurchasesPage } from "@/features/dashboard/DashboardPurchasesPage";
import { DashboardReviewsPage } from "@/features/reviews/DashboardReviewsPage";
import { AdminReviewsPage } from "@/features/reviews/AdminReviewsPage";
import { AdminTestimonialsPage } from "@/features/testimonials/AdminTestimonialsPage";
import { TestimonialsPage } from "@/features/testimonials/TestimonialsPage";
import { SavedBlogsPage } from "@/features/blog/SavedBlogsPage";
import { EducationPage } from "@/features/education/EducationPage";
import { AdminEducationPage } from "@/features/education/AdminEducationPage";
import { AdminProjectsPage } from "@/features/projects/AdminProjectsPage";
import { AdminFieldsPage } from "@/features/skills/AdminFieldsPage";
import { AdminSkillsPage } from "@/features/skills/AdminSkillsPage";
import { AdminTopicsPage } from "@/features/skills/AdminTopicsPage";
import { AdminExperiencePage } from "@/features/experience/AdminExperiencePage";
import { ExperiencePage } from "@/features/experience/ExperiencePage";
import { HomePage } from "@/features/home/HomePage";
import { ProjectDetailPage } from "@/features/projects/ProjectDetailPage";
import { ProjectsPage } from "@/features/projects/ProjectsPage";
import { AdminResumePage } from "@/features/resume/AdminResumePage";
import { ResumePage } from "@/features/resume/ResumePage";
import { AdminServicesPage } from "@/features/services/AdminServicesPage";
import { AdminServiceOrdersPage } from "@/features/services/AdminServiceOrdersPage";
import { ServiceDetailPage } from "@/features/services/ServiceDetailPage";
import { ServicesPage } from "@/features/services/ServicesPage";
import { SearchPage } from "@/features/search/SearchPage";
import { FieldDetailPage } from "@/features/skills/FieldDetailPage";
import { SkillDetailPage } from "@/features/skills/SkillDetailPage";
import { SkillsPage } from "@/features/skills/SkillsPage";
import { TopicDetailPage } from "@/features/skills/TopicDetailPage";
import { TopicsPage } from "@/features/skills/TopicsPage";
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
      {
        element: <PublicCatalog catalog="experience" />,
        children: [{ path: "experience", element: <ExperiencePage /> }],
      },
      {
        element: <PublicCatalog catalog="education" />,
        children: [{ path: "education", element: <EducationPage /> }],
      },
      {
        element: <PublicCatalog catalog="testimonials" />,
        children: [{ path: "testimonials", element: <TestimonialsPage /> }],
      },
      {
        element: <PublicCatalog catalog="projects" />,
        children: [
          { path: "projects", element: <ProjectsPage /> },
          { path: "projects/:slug", element: <ProjectDetailPage /> },
        ],
      },
      {
        element: <PublicCatalog catalog="skills" />,
        children: [
          { path: "skills", element: <SkillsPage /> },
          { path: "skills/:skillSlug", element: <SkillDetailPage /> },
          { path: "skills/:skillSlug/:topicSlug", element: <TopicDetailPage /> },
          { path: "topics", element: <TopicsPage /> },
          { path: "topics/:topicSlug", element: <TopicDetailPage /> },
          { path: "topics/:skillSlug/:topicSlug", element: <TopicDetailPage /> },
          { path: "fields/:fieldSlug", element: <FieldDetailPage /> },
        ],
      },
      { path: "search", element: <SearchPage /> },
      {
        element: <PublicCatalog catalog="certificates" />,
        children: [
          { path: "certificates", element: <CertificatesPage /> },
          { path: "certificates/:slug", element: <CertificateDetailPage /> },
        ],
      },
      {
        element: <PublicCatalog catalog="blogs" />,
        children: [
          { path: "blog", element: <BlogPage /> },
          { path: "blog/:slug", element: <BlogDetailPage /> },
        ],
      },
      {
        element: <PublicCatalog catalog="tutorials" />,
        children: [{ path: "tutorials", element: <TutorialsPage /> }],
      },
      { path: "tutorials/:slug", element: <TutorialDetailPage /> },
      {
        element: <PublicCatalog catalog="courses" />,
        children: [{ path: "courses", element: <CoursesPage /> }],
      },
      { path: "courses/:slug", element: <CourseDetailPage /> },
      { path: "course-certificates/:publicId", element: <CourseCertificatePage /> },
      {
        element: <PublicCatalog catalog="services" />,
        children: [
          { path: "services", element: <ServicesPage /> },
          { path: "services/:slug", element: <ServiceDetailPage /> },
        ],
      },
      { path: "contact", element: <ContactPage /> },
      { path: "cart", element: <CartPage /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "checkout/thanks/:orderNumber", element: <CheckoutThanksPage /> },
      { path: "pay/:paymentId", element: <DemoPayPage /> },
      { path: "unsubscribe", element: <UnsubscribePage /> },
      { path: "*", element: <NotFoundState title="Page not found" /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
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
          { path: "profile", element: <DashboardProfilePage /> },
          { path: "saved", element: <SavedBlogsPage /> },
          { path: "courses", element: <DashboardCoursesPage /> },
          { path: "purchases", element: <DashboardPurchasesPage /> },
          { path: "reviews", element: <DashboardReviewsPage /> },
          { path: "orders", element: <DashboardOrdersPage /> },
          { path: "notifications", element: <DashboardNotificationsPage /> },
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
          { path: "catalogs", element: <AdminCatalogsPage /> },
          { path: "portfolio", element: <AdminAboutPage /> },
          { path: "resume", element: <AdminResumePage /> },
          { path: "experience", element: <AdminExperiencePage /> },
          { path: "education", element: <AdminEducationPage /> },
          { path: "certificates", element: <AdminCertificatesPage /> },
          { path: "testimonials", element: <AdminTestimonialsPage /> },
          { path: "projects", element: <AdminProjectsPage /> },
          { path: "skills", element: <AdminSkillsPage /> },
          { path: "fields", element: <AdminFieldsPage /> },
          { path: "topics", element: <AdminTopicsPage /> },
          { path: "blogs", element: <AdminBlogsPage /> },
          { path: "audience", element: <AdminAudiencePage /> },
          { path: "tutorials", element: <AdminTutorialsPage /> },
          { path: "content", element: <Navigate to="/admin/tutorials" replace /> },
          { path: "courses", element: <AdminCoursesPage /> },
          { path: "enrollments", element: <AdminEnrollmentsPage /> },
          { path: "services", element: <AdminServicesPage /> },
          { path: "orders", element: <AdminOrdersPage /> },
          { path: "reviews", element: <AdminReviewsPage /> },
          { path: "service-orders", element: <AdminServiceOrdersPage /> },
          { path: "purchases", element: <Navigate to="/admin/orders" replace /> },
          { path: "payments", element: <AdminPaymentsPage /> },
          { path: "mail", element: <AdminMailPage /> },
          { path: "leads", element: <AdminLeadsPage /> },
          { path: "media", element: <AdminMediaPage /> },
          { path: "videos", element: <AdminVideosPage /> },
        ],
      },
    ],
  },
]);
