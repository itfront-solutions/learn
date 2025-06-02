import { 
  users, courses, lessons, enrollments, reviews, liveClasses, liveClassParticipants, aiContent,
  type User, type InsertUser, type Course, type InsertCourse, type Lesson, type InsertLesson,
  type Enrollment, type InsertEnrollment, type Review, type InsertReview,
  type LiveClass, type InsertLiveClass, type LiveClassParticipant, type InsertLiveClassParticipant,
  type AiContent, type InsertAiContent
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Course methods
  getCourses(): Promise<(Course & { instructor: User; _count: { enrollments: number; reviews: number } })[]>;
  getCourse(id: number): Promise<(Course & { instructor: User; lessons: Lesson[]; reviews: (Review & { user: User })[] }) | undefined>;
  getCoursesByInstructor(instructorId: number): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;
  
  // Lesson methods
  getLessonsByCourse(courseId: number): Promise<Lesson[]>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: number, lesson: Partial<InsertLesson>): Promise<Lesson | undefined>;
  deleteLesson(id: number): Promise<boolean>;
  
  // Enrollment methods
  getEnrollmentsByUser(userId: number): Promise<(Enrollment & { course: Course & { instructor: User } })[]>;
  getEnrollmentsByCourse(courseId: number): Promise<(Enrollment & { user: User })[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollmentProgress(userId: number, courseId: number, progress: number): Promise<Enrollment | undefined>;
  
  // Review methods
  getReviewsByCourse(courseId: number): Promise<(Review & { user: User })[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Live class methods
  getLiveClasses(): Promise<(LiveClass & { instructor: User; _count: { participants: number } })[]>;
  getLiveClass(id: number): Promise<(LiveClass & { instructor: User; participants: (LiveClassParticipant & { user: User })[] }) | undefined>;
  getLiveClassesByInstructor(instructorId: number): Promise<LiveClass[]>;
  createLiveClass(liveClass: InsertLiveClass): Promise<LiveClass>;
  updateLiveClass(id: number, liveClass: Partial<InsertLiveClass>): Promise<LiveClass | undefined>;
  deleteLiveClass(id: number): Promise<boolean>;
  
  // Live class participant methods
  joinLiveClass(participant: InsertLiveClassParticipant): Promise<LiveClassParticipant>;
  leaveLiveClass(liveClassId: number, userId: number): Promise<boolean>;
  
  // AI content methods
  getAiContent(sourceId: number, sourceType: string): Promise<AiContent[]>;
  createAiContent(content: InsertAiContent): Promise<AiContent>;
  
  // Dashboard stats
  getDashboardStats(userId?: number): Promise<{
    totalUsers: number;
    totalCourses: number;
    totalLiveClasses: number;
    userCourses?: number;
    userEnrollments?: number;
  }>;
  
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getCourses(): Promise<(Course & { instructor: User; _count: { enrollments: number; reviews: number } })[]> {
    const result = await db
      .select({
        course: courses,
        instructor: users,
        enrollmentCount: count(enrollments.id),
        reviewCount: count(reviews.id),
      })
      .from(courses)
      .leftJoin(users, eq(courses.instructorId, users.id))
      .leftJoin(enrollments, eq(courses.id, enrollments.courseId))
      .leftJoin(reviews, eq(courses.id, reviews.courseId))
      .where(eq(courses.isPublished, true))
      .groupBy(courses.id, users.id)
      .orderBy(desc(courses.createdAt));

    return result.map(row => ({
      ...row.course,
      instructor: row.instructor!,
      _count: {
        enrollments: row.enrollmentCount,
        reviews: row.reviewCount,
      }
    }));
  }

  async getCourse(id: number): Promise<(Course & { instructor: User; lessons: Lesson[]; reviews: (Review & { user: User })[] }) | undefined> {
    const [course] = await db
      .select()
      .from(courses)
      .leftJoin(users, eq(courses.instructorId, users.id))
      .where(eq(courses.id, id));

    if (!course) return undefined;

    const courseLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, id))
      .orderBy(lessons.order);

    const courseReviews = await db
      .select({
        review: reviews,
        user: users,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.courseId, id))
      .orderBy(desc(reviews.createdAt));

    return {
      ...course.courses,
      instructor: course.users!,
      lessons: courseLessons,
      reviews: courseReviews.map(r => ({ ...r.review, user: r.user! }))
    };
  }

  async getCoursesByInstructor(instructorId: number): Promise<Course[]> {
    return await db
      .select()
      .from(courses)
      .where(eq(courses.instructorId, instructorId))
      .orderBy(desc(courses.createdAt));
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined> {
    const [updatedCourse] = await db
      .update(courses)
      .set(course)
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse || undefined;
  }

  async deleteCourse(id: number): Promise<boolean> {
    const result = await db.delete(courses).where(eq(courses.id, id));
    return result.rowCount > 0;
  }

  async getLessonsByCourse(courseId: number): Promise<Lesson[]> {
    return await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(lessons.order);
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [newLesson] = await db.insert(lessons).values(lesson).returning();
    return newLesson;
  }

  async updateLesson(id: number, lesson: Partial<InsertLesson>): Promise<Lesson | undefined> {
    const [updatedLesson] = await db
      .update(lessons)
      .set(lesson)
      .where(eq(lessons.id, id))
      .returning();
    return updatedLesson || undefined;
  }

  async deleteLesson(id: number): Promise<boolean> {
    const result = await db.delete(lessons).where(eq(lessons.id, id));
    return result.rowCount > 0;
  }

  async getEnrollmentsByUser(userId: number): Promise<(Enrollment & { course: Course & { instructor: User } })[]> {
    const result = await db
      .select({
        enrollment: enrollments,
        course: courses,
        instructor: users,
      })
      .from(enrollments)
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(users, eq(courses.instructorId, users.id))
      .where(eq(enrollments.userId, userId))
      .orderBy(desc(enrollments.enrolledAt));

    return result.map(row => ({
      ...row.enrollment,
      course: {
        ...row.course!,
        instructor: row.instructor!
      }
    }));
  }

  async getEnrollmentsByCourse(courseId: number): Promise<(Enrollment & { user: User })[]> {
    const result = await db
      .select({
        enrollment: enrollments,
        user: users,
      })
      .from(enrollments)
      .leftJoin(users, eq(enrollments.userId, users.id))
      .where(eq(enrollments.courseId, courseId))
      .orderBy(desc(enrollments.enrolledAt));

    return result.map(row => ({
      ...row.enrollment,
      user: row.user!
    }));
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [newEnrollment] = await db.insert(enrollments).values(enrollment).returning();
    return newEnrollment;
  }

  async updateEnrollmentProgress(userId: number, courseId: number, progress: number): Promise<Enrollment | undefined> {
    const [updatedEnrollment] = await db
      .update(enrollments)
      .set({ progress })
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
      .returning();
    return updatedEnrollment || undefined;
  }

  async getReviewsByCourse(courseId: number): Promise<(Review & { user: User })[]> {
    const result = await db
      .select({
        review: reviews,
        user: users,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.courseId, courseId))
      .orderBy(desc(reviews.createdAt));

    return result.map(row => ({
      ...row.review,
      user: row.user!
    }));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async getLiveClasses(): Promise<(LiveClass & { instructor: User; _count: { participants: number } })[]> {
    const result = await db
      .select({
        liveClass: liveClasses,
        instructor: users,
        participantCount: count(liveClassParticipants.id),
      })
      .from(liveClasses)
      .leftJoin(users, eq(liveClasses.instructorId, users.id))
      .leftJoin(liveClassParticipants, eq(liveClasses.id, liveClassParticipants.liveClassId))
      .groupBy(liveClasses.id, users.id)
      .orderBy(liveClasses.scheduledAt);

    return result.map(row => ({
      ...row.liveClass,
      instructor: row.instructor!,
      _count: {
        participants: row.participantCount,
      }
    }));
  }

  async getLiveClass(id: number): Promise<(LiveClass & { instructor: User; participants: (LiveClassParticipant & { user: User })[] }) | undefined> {
    const [liveClass] = await db
      .select()
      .from(liveClasses)
      .leftJoin(users, eq(liveClasses.instructorId, users.id))
      .where(eq(liveClasses.id, id));

    if (!liveClass) return undefined;

    const participants = await db
      .select({
        participant: liveClassParticipants,
        user: users,
      })
      .from(liveClassParticipants)
      .leftJoin(users, eq(liveClassParticipants.userId, users.id))
      .where(eq(liveClassParticipants.liveClassId, id));

    return {
      ...liveClass.live_classes,
      instructor: liveClass.users!,
      participants: participants.map(p => ({ ...p.participant, user: p.user! }))
    };
  }

  async getLiveClassesByInstructor(instructorId: number): Promise<LiveClass[]> {
    return await db
      .select()
      .from(liveClasses)
      .where(eq(liveClasses.instructorId, instructorId))
      .orderBy(liveClasses.scheduledAt);
  }

  async createLiveClass(liveClass: InsertLiveClass): Promise<LiveClass> {
    const [newLiveClass] = await db.insert(liveClasses).values(liveClass).returning();
    return newLiveClass;
  }

  async updateLiveClass(id: number, liveClass: Partial<InsertLiveClass>): Promise<LiveClass | undefined> {
    const [updatedLiveClass] = await db
      .update(liveClasses)
      .set(liveClass)
      .where(eq(liveClasses.id, id))
      .returning();
    return updatedLiveClass || undefined;
  }

  async deleteLiveClass(id: number): Promise<boolean> {
    const result = await db.delete(liveClasses).where(eq(liveClasses.id, id));
    return result.rowCount > 0;
  }

  async joinLiveClass(participant: InsertLiveClassParticipant): Promise<LiveClassParticipant> {
    const [newParticipant] = await db.insert(liveClassParticipants).values(participant).returning();
    return newParticipant;
  }

  async leaveLiveClass(liveClassId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(liveClassParticipants)
      .where(and(
        eq(liveClassParticipants.liveClassId, liveClassId),
        eq(liveClassParticipants.userId, userId)
      ));
    return result.rowCount > 0;
  }

  async getAiContent(sourceId: number, sourceType: string): Promise<AiContent[]> {
    return await db
      .select()
      .from(aiContent)
      .where(and(
        eq(aiContent.sourceId, sourceId),
        eq(aiContent.sourceType, sourceType)
      ))
      .orderBy(desc(aiContent.createdAt));
  }

  async createAiContent(content: InsertAiContent): Promise<AiContent> {
    const [newContent] = await db.insert(aiContent).values(content).returning();
    return newContent;
  }

  async getDashboardStats(userId?: number): Promise<{
    totalUsers: number;
    totalCourses: number;
    totalLiveClasses: number;
    userCourses?: number;
    userEnrollments?: number;
  }> {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [courseCount] = await db.select({ count: count() }).from(courses);
    const [liveClassCount] = await db.select({ count: count() }).from(liveClasses);

    const stats = {
      totalUsers: userCount.count,
      totalCourses: courseCount.count,
      totalLiveClasses: liveClassCount.count,
    };

    if (userId) {
      const [userCourseCount] = await db
        .select({ count: count() })
        .from(courses)
        .where(eq(courses.instructorId, userId));
      
      const [enrollmentCount] = await db
        .select({ count: count() })
        .from(enrollments)
        .where(eq(enrollments.userId, userId));

      return {
        ...stats,
        userCourses: userCourseCount.count,
        userEnrollments: enrollmentCount.count,
      };
    }

    return stats;
  }
}

export const storage = new DatabaseStorage();
