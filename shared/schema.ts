import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("aluno"), // aluno, professor, equipe, admin
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  level: text("level").notNull(), // iniciante, intermediario, avancado
  price: decimal("price", { precision: 10, scale: 2 }).default("0.00"),
  duration: integer("duration"), // in hours
  thumbnail: text("thumbnail"),
  instructorId: integer("instructor_id").notNull(),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Course lessons table
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url"),
  materialUrl: text("material_url"),
  order: integer("order").notNull(),
  duration: integer("duration"), // in minutes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Course enrollments table
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  progress: integer("progress").default(0), // percentage
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
});

// Course reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Live classes table
export const liveClasses = pgTable("live_classes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  instructorId: integer("instructor_id").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").notNull(), // in minutes
  platform: text("platform").notNull(), // google_meet, zoom, teams
  meetingUrl: text("meeting_url"),
  maxParticipants: integer("max_participants").default(50),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Live class participants table
export const liveClassParticipants = pgTable("live_class_participants", {
  id: serial("id").primaryKey(),
  liveClassId: integer("live_class_id").notNull(),
  userId: integer("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// AI generated content table
export const aiContent = pgTable("ai_content", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // quiz, summary, structure
  content: jsonb("content").notNull(),
  sourceId: integer("source_id"), // course_id or lesson_id
  sourceType: text("source_type"), // course, lesson
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  courses: many(courses),
  enrollments: many(enrollments),
  reviews: many(reviews),
  liveClasses: many(liveClasses),
  liveClassParticipants: many(liveClassParticipants),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  instructor: one(users, {
    fields: [courses.instructorId],
    references: [users.id],
  }),
  lessons: many(lessons),
  enrollments: many(enrollments),
  reviews: many(reviews),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
  course: one(courses, {
    fields: [lessons.courseId],
    references: [courses.id],
  }),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [reviews.courseId],
    references: [courses.id],
  }),
}));

export const liveClassesRelations = relations(liveClasses, ({ one, many }) => ({
  instructor: one(users, {
    fields: [liveClasses.instructorId],
    references: [users.id],
  }),
  participants: many(liveClassParticipants),
}));

export const liveClassParticipantsRelations = relations(liveClassParticipants, ({ one }) => ({
  liveClass: one(liveClasses, {
    fields: [liveClassParticipants.liveClassId],
    references: [liveClasses.id],
  }),
  user: one(users, {
    fields: [liveClassParticipants.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  enrolledAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertLiveClassSchema = createInsertSchema(liveClasses).omit({
  id: true,
  createdAt: true,
});

export const insertLiveClassParticipantSchema = createInsertSchema(liveClassParticipants).omit({
  id: true,
  joinedAt: true,
});

export const insertAiContentSchema = createInsertSchema(aiContent).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type LiveClass = typeof liveClasses.$inferSelect;
export type InsertLiveClass = z.infer<typeof insertLiveClassSchema>;

export type LiveClassParticipant = typeof liveClassParticipants.$inferSelect;
export type InsertLiveClassParticipant = z.infer<typeof insertLiveClassParticipantSchema>;

export type AiContent = typeof aiContent.$inferSelect;
export type InsertAiContent = z.infer<typeof insertAiContentSchema>;
