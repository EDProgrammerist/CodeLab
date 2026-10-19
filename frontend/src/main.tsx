import StudentProfile from '@/pages/student/profile/index';
import InstructorProfile from '@/pages/instructor/profile/index';
import '@fontsource-variable/inter';
import PublicLayout from '@/pages/guest/layout';
import LoginPage from '@/pages/guest/login/index';
import AboutPage from '@/pages/guest/about/index';
import ContactPage from '@/pages/guest/contact/index';
import PrivacyPage from '@/pages/guest/privacy/index';
import TermsPage from '@/pages/guest/terms/index';
import NotFoundPage from '@/pages/guest/not-found/index';
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import RegisterPage from "@/pages/guest/register/index";
import ForgotPasswordPage from "@/pages/guest/forgot-password/index";
import ResetPasswordPage from "@/pages/guest/reset-password/index";
import VerifyEmailPage from "@/pages/guest/verify-email/index";
import ActivityDetailPage from "@/pages/student/activity-detail/index";
import StudentDashboard from "@/pages/student/dashboard/index";
import InstructorDashboard from "@/pages/instructor/dashboard/index";
import StudentLayout from "@/pages/student/layout";
import InstructorLayout from "@/pages/instructor/layout";
import StudentClassrooms from "@/pages/student/classrooms/index";
import InstructorClassrooms from "@/pages/instructor/classrooms/index";
import StudentActivities from "@/pages/student/activities/index";
import InstructorActivities from "@/pages/instructor/activities/index";
import EditorPage from "@/pages/student/editor/index";
import AuthoringPage from "@/pages/instructor/authoring/index";
import ProgressPage from "@/pages/student/progress/index";
import GradebookPage from "@/pages/instructor/gradebook/index";
import HomePage from "@/pages/guest/home/index";
import "@/styles/global.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="student" element={<StudentLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="classrooms" element={<StudentClassrooms />} />
            <Route
              path="classrooms/:classroomId"
              element={<StudentActivities />}
            />
            <Route
              path="classrooms/:classroomId/activities/:activityId"
              element={<ActivityDetailPage />}
            />
            <Route path="activities/:activityId" element={<EditorPage />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="progress" element={<ProgressPage />} />
          </Route>
          <Route path="instructor" element={<InstructorLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<InstructorDashboard />} />
            <Route path="classrooms" element={<InstructorClassrooms />} />
            <Route
              path="classrooms/:classroomId"
              element={<InstructorActivities />}
            />
            <Route
              path="classrooms/:classroomId/activities/new"
              element={<AuthoringPage />}
            />
            <Route
              path="classrooms/:classroomId/activities/:activityId"
              element={<AuthoringPage />}
            />
            <Route path="activities/new" element={<AuthoringPage />} />
            <Route path="profile" element={<InstructorProfile />} />
            <Route path="gradebook" element={<GradebookPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
