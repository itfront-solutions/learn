import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/navigation";
import CourseCard from "@/components/course-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Video, Brain, Star, Clock, Play } from "lucide-react";
import { Link } from "wouter";

export default function HomePage() {
  const { user } = useAuth();

  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
  });

  const { data: liveClasses } = useQuery({
    queryKey: ["/api/live-classes"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const featuredCourses = courses?.slice(0, 3) || [];
  const upcomingClasses = liveClasses?.slice(0, 2) || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-emerald-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                Bem-vindo de volta,
                <span className="text-yellow-300 block">{user?.name}</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8">
                Continue sua jornada de aprendizado com nossa plataforma inteligente
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/courses">
                  <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
                    Explorar Cursos
                  </Button>
                </Link>
                <Link href="/live-classes">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                    Aulas Ao Vivo
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-4">Seu Progresso</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-3xl font-bold">{stats?.userEnrollments || 0}</div>
                    <div className="text-blue-200 text-sm">Cursos Matriculados</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{stats?.userCourses || 0}</div>
                    <div className="text-blue-200 text-sm">Cursos Criados</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{stats?.totalUsers || 0}</div>
              <div className="text-gray-600">Estudantes Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">{stats?.totalCourses || 0}</div>
              <div className="text-gray-600">Cursos Disponíveis</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-600 mb-2">{stats?.totalLiveClasses || 0}</div>
              <div className="text-gray-600">Aulas Ao Vivo</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-500 mb-2">92%</div>
              <div className="text-gray-600">IA Ativa</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Cursos em Destaque</h2>
              <p className="text-xl text-gray-600">Descubra nossos cursos mais populares</p>
            </div>
            <Link href="/courses">
              <Button variant="outline">Ver Todos</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCourses.map((course: any) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* Live Classes */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Aulas Ao Vivo</h2>
              <p className="text-xl text-gray-600">Participe de aulas interativas</p>
            </div>
            <Link href="/live-classes">
              <Button variant="outline">Ver Todas</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {upcomingClasses.map((liveClass: any) => (
              <Card key={liveClass.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{liveClass.title}</h3>
                      <p className="text-gray-600">{liveClass.description}</p>
                    </div>
                    <Badge variant="secondary" className="bg-red-100 text-red-600">
                      <Video className="h-3 w-3 mr-1" />
                      AO VIVO
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(liveClass.scheduledAt).toLocaleDateString("pt-BR")}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {liveClass._count.participants} participantes
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <span>Prof. {liveClass.instructor.name}</span>
                    </div>
                    <Button size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Participar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Potencializado por IA</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nossa inteligência artificial aprimora cada aspecto da experiência educacional
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-4">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Geração de Conteúdo</h3>
              <p className="text-gray-600">
                IA cria automaticamente resumos, quizzes e exercícios baseados no seu material
              </p>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl mb-4">
                <BookOpen className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Curadoria Inteligente</h3>
              <p className="text-gray-600">
                Sistema automático de qualidade que identifica e remove conteúdo inadequado
              </p>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-xl mb-4">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Recomendações Personalizadas</h3>
              <p className="text-gray-600">
                Trilhas de aprendizagem adaptadas ao seu perfil e objetivos pessoais
              </p>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Link href="/ai-tools">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Explorar Ferramentas de IA
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
