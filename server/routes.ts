import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { insertCourseSchema, insertLessonSchema, insertReviewSchema, insertLiveClassSchema } from "@shared/schema";
import { generateQuiz, generateCourseStructure, analyzeContent, generateSummary } from "./openai";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'video/mp4', 'video/avi', 'video/mov', 'video/mkv',
      'application/pdf',
      'image/jpeg', 'image/png', 'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  }
});

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    next();
  };

  // Middleware to check specific roles
  const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Acesso negado" });
    }
    next();
  };

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats(req.user.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Course routes
  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ error: "Curso não encontrado" });
      }
      
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/courses", requireAuth, requireRole(["professor", "admin"]), async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse({
        ...req.body,
        instructorId: req.user.id,
      });
      
      const course = await storage.createCourse(courseData);
      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.put("/api/courses/:id", requireAuth, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ error: "Curso não encontrado" });
      }
      
      if (course.instructorId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const updateData = insertCourseSchema.partial().parse(req.body);
      const updatedCourse = await storage.updateCourse(courseId, updateData);
      
      res.json(updatedCourse);
    } catch (error) {
      console.error("Error updating course:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.delete("/api/courses/:id", requireAuth, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ error: "Curso não encontrado" });
      }
      
      if (course.instructorId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const deleted = await storage.deleteCourse(courseId);
      
      if (deleted) {
        res.json({ message: "Curso excluído com sucesso" });
      } else {
        res.status(500).json({ error: "Erro ao excluir curso" });
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // My courses (instructor view)
  app.get("/api/my-courses", requireAuth, requireRole(["professor", "admin"]), async (req, res) => {
    try {
      const courses = await storage.getCoursesByInstructor(req.user.id);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching my courses:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Enrollment routes
  app.get("/api/enrollments", requireAuth, async (req, res) => {
    try {
      const enrollments = await storage.getEnrollmentsByUser(req.user.id);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/enrollments", requireAuth, async (req, res) => {
    try {
      const { courseId } = req.body;
      
      if (!courseId) {
        return res.status(400).json({ error: "ID do curso é obrigatório" });
      }
      
      const enrollment = await storage.createEnrollment({
        userId: req.user.id,
        courseId: parseInt(courseId),
      });
      
      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Error creating enrollment:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Review routes
  app.post("/api/reviews", requireAuth, async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Live class routes
  app.get("/api/live-classes", async (req, res) => {
    try {
      const liveClasses = await storage.getLiveClasses();
      res.json(liveClasses);
    } catch (error) {
      console.error("Error fetching live classes:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/live-classes/:id", async (req, res) => {
    try {
      const liveClassId = parseInt(req.params.id);
      const liveClass = await storage.getLiveClass(liveClassId);
      
      if (!liveClass) {
        return res.status(404).json({ error: "Aula ao vivo não encontrada" });
      }
      
      res.json(liveClass);
    } catch (error) {
      console.error("Error fetching live class:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/live-classes", requireAuth, requireRole(["professor", "admin"]), async (req, res) => {
    try {
      const liveClassData = insertLiveClassSchema.parse({
        ...req.body,
        instructorId: req.user.id,
      });
      
      const liveClass = await storage.createLiveClass(liveClassData);
      res.status(201).json(liveClass);
    } catch (error) {
      console.error("Error creating live class:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/live-classes/:id/join", requireAuth, async (req, res) => {
    try {
      const liveClassId = parseInt(req.params.id);
      
      const participant = await storage.joinLiveClass({
        liveClassId,
        userId: req.user.id,
      });
      
      res.status(201).json(participant);
    } catch (error) {
      console.error("Error joining live class:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // AI routes
  app.post("/api/ai/generate-quiz", requireAuth, async (req, res) => {
    try {
      const { topic, level = "intermediario" } = req.body;
      
      if (!topic) {
        return res.status(400).json({ error: "Tópico é obrigatório" });
      }
      
      const quiz = await generateQuiz(topic, level);
      res.json({ questions: quiz });
    } catch (error) {
      console.error("Error generating quiz:", error);
      res.status(500).json({ error: "Erro ao gerar quiz" });
    }
  });

  app.post("/api/ai/generate-structure", requireAuth, async (req, res) => {
    try {
      const { title, category, level } = req.body;
      
      if (!title || !category || !level) {
        return res.status(400).json({ error: "Título, categoria e nível são obrigatórios" });
      }
      
      const structure = await generateCourseStructure(title, category, level);
      res.json(structure);
    } catch (error) {
      console.error("Error generating course structure:", error);
      res.status(500).json({ error: "Erro ao gerar estrutura do curso" });
    }
  });

  app.post("/api/ai/analyze-content", requireAuth, async (req, res) => {
    try {
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: "Conteúdo é obrigatório" });
      }
      
      const analysis = await analyzeContent(content);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing content:", error);
      res.status(500).json({ error: "Erro ao analisar conteúdo" });
    }
  });

  // File upload routes
  app.post("/api/upload", requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }
      
      // In a real application, you would upload to a cloud storage service
      // For now, we'll just return the local file path
      const fileUrl = `/uploads/${req.file.filename}`;
      
      res.json({
        url: fileUrl,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Erro ao fazer upload do arquivo" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    // Add authentication check for file access if needed
    next();
  }, (req, res, next) => {
    const filePath = path.join(process.cwd(), 'uploads', req.path);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Arquivo não encontrado" });
    }
    
    res.sendFile(filePath);
  });

  const httpServer = createServer(app);
  return httpServer;
}
