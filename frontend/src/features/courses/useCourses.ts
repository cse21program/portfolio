import { useCallback, useEffect, useState } from "react";
import { courses as fallbackCourses } from "@/content/learning";
import { ApiRequestError, apiGet } from "@/lib/api";
import { normalizeCourseList, type Course } from "@/types/course";
import {
  defaultCourseAccess,
  parseCourseAccess,
  parseCourseCertificate,
  parseCourseProgress,
  type CourseAccess,
  type CourseCertificateSummary,
  type CourseProgress,
} from "@/types/enrollment";

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>(fallbackCourses);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const payload = await apiGet<{ courses: Course[] }>("/courses", { cache: "no-store" });
      setCourses(normalizeCourseList(payload.courses));
      setError("");
    } catch {
      setCourses(fallbackCourses);
      setError("Could not load courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { courses, loading, error, reload };
}

export function useCourseDetail(slug: string) {
  const [course, setCourse] = useState<Course | null>(null);
  const [related, setRelated] = useState<Course[]>([]);
  const [access, setAccess] = useState<CourseAccess>(defaultCourseAccess);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [certificate, setCertificate] = useState<CourseCertificateSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!slug) {
      setCourse(null);
      setRelated([]);
      setAccess(defaultCourseAccess);
      setProgress(null);
      setCertificate(null);
      setNotFound(true);
      setLoading(false);
      return;
    }

    try {
      const payload = await apiGet<{
        course: Course;
        related?: Course[];
        access?: CourseAccess;
        progress?: CourseProgress | null;
        certificate?: CourseCertificateSummary | null;
      }>(`/courses/${slug}`, { cache: "no-store" });
      setCourse(normalizeCourseList([payload.course])[0] ?? null);
      setRelated(normalizeCourseList(payload.related ?? []));
      setAccess(parseCourseAccess(payload.access));
      setProgress(parseCourseProgress(payload.progress));
      setCertificate(parseCourseCertificate(payload.certificate));
      setNotFound(false);
      setError("");
    } catch (caught) {
      setCourse(null);
      setRelated([]);
      setAccess(defaultCourseAccess);
      setProgress(null);
      setCertificate(null);
      if (caught instanceof ApiRequestError && caught.status === 404) {
        setNotFound(true);
        setError("");
      } else {
        setNotFound(false);
        setError("Could not load this course");
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    void reload();
  }, [reload]);

  return { course, related, access, progress, certificate, loading, notFound, error, reload };
}
