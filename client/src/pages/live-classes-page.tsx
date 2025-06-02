import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/navigation";
import ScheduleLiveClassModal from "@/components/schedule-live-class-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Video, Plus, ExternalLink } from "lucide-react";

export default function LiveClassesPage() {
  const { user } = useAuth();
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const { data: liveClasses, isLoading } = useQuery({
    queryKey: ["/api/live-classes"],
  });

  const canScheduleClass = user?.role === "professor" || user?.role === "admin";

  const getClassStatus = (scheduledAt: string) => {
    const now = new Date();
    const classTime = new Date(scheduledAt);
    const diffMinutes = (classTime.getTime() - now.getTime()) / (1000 * 60);
    
    if (diffMinutes > 30) {
      return { status: "scheduled", label: "Agendada", color: "bg-blue-100 text-blue-600" };
    } else if (diffMinutes > -60) {
      return { status: "live", label: "Ao Vivo", color: "bg-red-100 text-red-600" };
    } else {
      return { status: "finished", label: "Finalizada", color: "bg-gray-100 text-gray-600" };
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("pt-BR"),
      time: date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Aulas Ao Vivo</h1>
            <p className="text-gray-600 mt-2">Agende e participe de aulas ao vivo com professores especialistas</p>
          </div>
          
          {canScheduleClass && (
            <Button onClick={() => setIsScheduleModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agendar Aula
            </Button>
          )}
        </div>

        {/* Live Classes Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-16 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : liveClasses && liveClasses.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {liveClasses.map((liveClass: any) => {
              const { date, time } = formatDateTime(liveClass.scheduledAt);
              const { status, label, color } = getClassStatus(liveClass.scheduledAt);
              
              return (
                <Card key={liveClass.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Video className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{liveClass.title}</h3>
                          <p className="text-sm text-gray-600">Por {liveClass.instructor.name}</p>
                        </div>
                      </div>
                      <Badge className={color}>{label}</Badge>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{liveClass.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{date}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{time}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        <span>{liveClass._count.participants} participantes</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium">{liveClass.duration} min</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        {liveClass.platform === "google_meet" && (
                          <>
                            <div className="w-4 h-4 bg-blue-500 rounded"></div>
                            <span>Google Meet</span>
                          </>
                        )}
                        {liveClass.platform === "zoom" && (
                          <>
                            <div className="w-4 h-4 bg-blue-400 rounded"></div>
                            <span>Zoom</span>
                          </>
                        )}
                        {liveClass.platform === "teams" && (
                          <>
                            <div className="w-4 h-4 bg-blue-600 rounded"></div>
                            <span>Microsoft Teams</span>
                          </>
                        )}
                      </div>
                      
                      {status === "live" && liveClass.meetingUrl ? (
                        <Button asChild className="bg-red-600 hover:bg-red-700">
                          <a href={liveClass.meetingUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Entrar na Aula
                          </a>
                        </Button>
                      ) : status === "scheduled" ? (
                        <Button variant="outline">
                          Reservar Vaga
                        </Button>
                      ) : (
                        <Button variant="ghost" disabled>
                          Finalizada
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Video className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma aula ao vivo agendada</h3>
            <p className="text-gray-600 mb-6">
              {canScheduleClass 
                ? "Que tal agendar uma nova aula ao vivo?" 
                : "Volte em breve para ver as próximas aulas"
              }
            </p>
            {canScheduleClass && (
              <Button onClick={() => setIsScheduleModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agendar Primeira Aula
              </Button>
            )}
          </div>
        )}

        {/* Integration Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Integração com Plataformas de Videoconferência</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              Nossa plataforma integra com as principais ferramentas de videoconferência do mercado
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Video className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-medium">Google Meet</h4>
                  <p className="text-sm text-gray-600">Integração nativa</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                <div className="w-10 h-10 bg-blue-400 rounded-lg flex items-center justify-center">
                  <Video className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-medium">Zoom</h4>
                  <p className="text-sm text-gray-600">API integrada</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Video className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-medium">Microsoft Teams</h4>
                  <p className="text-sm text-gray-600">Suporte completo</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Live Class Modal */}
        <ScheduleLiveClassModal 
          isOpen={isScheduleModalOpen} 
          onClose={() => setIsScheduleModalOpen(false)} 
        />
      </div>
    </div>
  );
}
