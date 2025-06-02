import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Users, 
  Video, 
  Brain, 
  TrendingUp, 
  Clock, 
  Star, 
  Award,
  AlertCircle,
  CheckCircle,
  Flag,
  UserCheck
} from "lucide-react";
import { Link } from "wouter";

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: myCourses } = useQuery({
    queryKey: ["/api/my-courses"],
    enabled: user?.role === "professor" || user?.role === "admin",
  });

  const { data: enrollments } = useQuery({
    queryKey: ["/api/enrollments"],
    enabled: user?.role === "aluno",
  });

  const { data: liveClasses } = useQuery({
    queryKey: ["/api/live-classes"],
  });

  // Role-based dashboard content
  const renderStudentDashboard = () => (
    <div className="space-y-8">
      {/* Progress Overview */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold mb-6">Meu Progresso</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold mb-2">{stats?.userEnrollments || 0}</div>
              <div className="text-blue-200">Cursos Matriculados</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">65%</div>
              <div className="text-blue-200">Taxa de Conclusão</div>
              <Progress value={65} className="mt-2 bg-blue-500" />
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">248h</div>
              <div className="text-blue-200">Tempo de Estudo</div>
              <div className="text-sm text-blue-200 mt-1">+12h esta semana</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Courses */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Meus Cursos</CardTitle>
            </CardHeader>
            <CardContent>
              {enrollments && enrollments.length > 0 ? (
                <div className="space-y-4">
                  {enrollments.slice(0, 3).map((enrollment: any) => (
                    <div key={enrollment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{enrollment.course.title}</h3>
                          <p className="text-sm text-gray-600">
                            Por {enrollment.course.instructor.name}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="text-sm text-gray-500">
                              Progresso: {enrollment.progress}%
                            </div>
                            <Progress value={enrollment.progress} className="w-20" />
                          </div>
                        </div>
                      </div>
                      <Button size="sm">Continuar</Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Você ainda não está matriculado em nenhum curso</p>
                  <Link href="/courses">
                    <Button className="mt-4">Explorar Cursos</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Achievements */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Próximas Aulas</CardTitle>
            </CardHeader>
            <CardContent>
              {liveClasses && liveClasses.length > 0 ? (
                <div className="space-y-3">
                  {liveClasses.slice(0, 2).map((liveClass: any) => (
                    <div key={liveClass.id} className="p-3 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-sm">{liveClass.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(liveClass.scheduledAt).toLocaleDateString("pt-BR")}
                      </p>
                      <Button size="sm" className="mt-2 w-full">Participar</Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nenhuma aula agendada</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conquistas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Award className="h-8 w-8 text-yellow-500" />
                  <div>
                    <div className="font-medium">Primeiro Curso</div>
                    <div className="text-sm text-gray-600">Completou seu primeiro curso</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-8 w-8 text-blue-500" />
                  <div>
                    <div className="font-medium">Estudante Dedicado</div>
                    <div className="text-sm text-gray-600">100+ horas de estudo</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderProfessorDashboard = () => (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Meus Cursos</p>
                <p className="text-2xl font-bold">{stats?.userCourses || 0}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Alunos</p>
                <p className="text-2xl font-bold">1,247</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aulas ao Vivo</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <Video className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avaliação Média</p>
                <p className="text-2xl font-bold">4.8</p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Courses */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Meus Cursos</CardTitle>
              <Link href="/courses">
                <Button size="sm">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Criar Curso
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {myCourses && myCourses.length > 0 ? (
                <div className="space-y-4">
                  {myCourses.slice(0, 3).map((course: any) => (
                    <div key={course.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{course.title}</h3>
                          <p className="text-sm text-gray-600">{course.category}</p>
                        </div>
                        <Badge variant={course.isPublished ? "default" : "secondary"}>
                          {course.isPublished ? "Publicado" : "Rascunho"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div>
                          <div className="font-semibold text-blue-600">85%</div>
                          <div className="text-gray-600">Taxa de Conclusão</div>
                        </div>
                        <div>
                          <div className="font-semibold text-green-600">4.8</div>
                          <div className="text-gray-600">Avaliação</div>
                        </div>
                        <div>
                          <div className="font-semibold text-purple-600">247</div>
                          <div className="text-gray-600">Alunos</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Você ainda não criou nenhum curso</p>
                  <Link href="/courses">
                    <Button className="mt-4">Criar Primeiro Curso</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Assistant & Recent Activity */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2 text-blue-600" />
                Assistente IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Sugestão IA</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Considere adicionar um quiz sobre React Hooks no módulo 3
                  </p>
                  <Button size="sm" className="mt-2">Aplicar</Button>
                </div>
                <Link href="/ai-tools">
                  <Button variant="outline" className="w-full">
                    Ver Todas as Ferramentas
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Novos alunos</span>
                  <span className="font-semibold">+142</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Horas ensinadas</span>
                  <span className="font-semibold">67h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avaliações</span>
                  <span className="font-semibold">23 ⭐</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="space-y-8">
      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Usuários</p>
                <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cursos</p>
                <p className="text-2xl font-bold">{stats?.totalCourses || 0}</p>
              </div>
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aulas ao Vivo</p>
                <p className="text-2xl font-bold">{stats?.totalLiveClasses || 0}</p>
              </div>
              <Video className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">IA Ativa</p>
                <p className="text-2xl font-bold">98%</p>
              </div>
              <Brain className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI Moderation */}
        <Card>
          <CardHeader>
            <CardTitle>Moderação por IA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start justify-between p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-800">Conteúdo para Revisão</h4>
                  <p className="text-sm text-yellow-700">
                    Curso "Marketing Digital" - Possível conteúdo promocional
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">Revisar</Button>
                  <Button size="sm">Aprovar</Button>
                </div>
              </div>

              <div className="flex items-start justify-between p-3 bg-red-50 border-l-4 border-red-400 rounded">
                <div className="flex-1">
                  <h4 className="font-medium text-red-800">Possível Plágio</h4>
                  <p className="text-sm text-red-700">
                    Aula "JavaScript Básico" - 87% similaridade detectada
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">Analisar</Button>
                  <Button size="sm" variant="destructive">Remover</Button>
                </div>
              </div>

              <div className="flex items-start justify-between p-3 bg-green-50 border-l-4 border-green-400 rounded">
                <div className="flex-1">
                  <h4 className="font-medium text-green-800">Conteúdo Aprovado</h4>
                  <p className="text-sm text-green-700">
                    15 novos cursos aprovados automaticamente hoje
                  </p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                <UserCheck className="h-8 w-8 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Novo Professor</p>
                  <p className="text-xs text-gray-600">Dr. Carlos Silva se cadastrou</p>
                  <p className="text-xs text-gray-500">Há 2 horas</p>
                </div>
                <Badge variant="outline">Verificar</Badge>
              </div>

              <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                <Flag className="h-8 w-8 text-yellow-600" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Denúncia</p>
                  <p className="text-xs text-gray-600">Curso reportado por usuário</p>
                  <p className="text-xs text-gray-500">Há 4 horas</p>
                </div>
                <Badge variant="outline">Revisar</Badge>
              </div>

              <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Novo Curso</p>
                  <p className="text-xs text-gray-600">"Python Avançado" publicado</p>
                  <p className="text-xs text-gray-500">Há 6 horas</p>
                </div>
                <Badge variant="secondary">Aprovado</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderTeamDashboard = () => (
    <div className="space-y-8">
      {/* Content Moderation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold">23</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aprovados Hoje</p>
                <p className="text-2xl font-bold">47</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Denúncias</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <Flag className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taxa de Aprovação</p>
                <p className="text-2xl font-bold">94%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Review Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Fila de Moderação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium">Curso: "Marketing Digital Avançado"</h3>
                <p className="text-sm text-gray-600">Enviado por: Prof. Ana Santos</p>
                <Badge variant="secondary" className="mt-1">Aguardando Revisão</Badge>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">Ver Detalhes</Button>
                <Button size="sm">Aprovar</Button>
                <Button size="sm" variant="destructive">Rejeitar</Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium">Aula: "Introdução ao React"</h3>
                <p className="text-sm text-gray-600">Enviado por: Prof. João Silva</p>
                <Badge variant="secondary" className="mt-1">Aguardando Revisão</Badge>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">Ver Detalhes</Button>
                <Button size="sm">Aprovar</Button>
                <Button size="sm" variant="destructive">Rejeitar</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const getDashboardContent = () => {
    switch (user?.role) {
      case "aluno":
        return renderStudentDashboard();
      case "professor":
        return renderProfessorDashboard();
      case "admin":
        return renderAdminDashboard();
      case "equipe":
        return renderTeamDashboard();
      default:
        return renderStudentDashboard();
    }
  };

  const getRoleTitle = () => {
    switch (user?.role) {
      case "aluno":
        return "Dashboard do Aluno";
      case "professor":
        return "Dashboard do Professor";
      case "admin":
        return "Dashboard Administrativo";
      case "equipe":
        return "Dashboard da Equipe";
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{getRoleTitle()}</h1>
          <p className="text-gray-600 mt-2">
            Bem-vindo de volta, {user?.name}! Aqui está um resumo das suas atividades.
          </p>
        </div>

        {/* Role-based Content */}
        {getDashboardContent()}
      </div>
    </div>
  );
}
