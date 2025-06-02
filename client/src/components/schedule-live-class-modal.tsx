import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Video, Calendar, Clock, Users } from "lucide-react";

interface ScheduleLiveClassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ScheduleLiveClassModal({ isOpen, onClose }: ScheduleLiveClassModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduledDate: "",
    scheduledTime: "",
    duration: "60",
    platform: "google_meet",
    meetingUrl: "",
    maxParticipants: "50",
  });

  const createLiveClassMutation = useMutation({
    mutationFn: async (liveClassData: any) => {
      const response = await apiRequest("POST", "/api/live-classes", liveClassData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/live-classes"] });
      toast({
        title: "Aula ao vivo agendada!",
        description: "Sua aula foi agendada com sucesso.",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao agendar aula",
        description: error.message || "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.scheduledDate || !formData.scheduledTime) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título, data e horário.",
        variant: "destructive",
      });
      return;
    }

    // Combine date and time into a proper datetime
    const scheduledAt = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);

    if (scheduledAt <= new Date()) {
      toast({
        title: "Data inválida",
        description: "A aula deve ser agendada para uma data futura.",
        variant: "destructive",
      });
      return;
    }

    const liveClassData = {
      title: formData.title,
      description: formData.description || "",
      scheduledAt: scheduledAt.toISOString(),
      duration: parseInt(formData.duration),
      platform: formData.platform,
      meetingUrl: formData.meetingUrl || "",
      maxParticipants: parseInt(formData.maxParticipants),
    };

    createLiveClassMutation.mutate(liveClassData);
  };

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      scheduledDate: "",
      scheduledTime: "",
      duration: "60",
      platform: "google_meet",
      meetingUrl: "",
      maxParticipants: "50",
    });
    onClose();
  };

  const generateMeetingUrl = () => {
    const baseUrls = {
      google_meet: "https://meet.google.com/new",
      zoom: "https://zoom.us/start/videomeeting",
      teams: "https://teams.microsoft.com/l/meetup-join/",
    };

    const url = baseUrls[formData.platform as keyof typeof baseUrls];
    if (url) {
      handleInputChange("meetingUrl", url);
      toast({
        title: "URL gerada",
        description: "Link da reunião foi gerado. Você pode personalizá-lo se necessário.",
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "google_meet":
        return "🎥";
      case "zoom":
        return "📹";
      case "teams":
        return "💼";
      default:
        return "🎥";
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case "google_meet":
        return "Google Meet";
      case "zoom":
        return "Zoom";
      case "teams":
        return "Microsoft Teams";
      default:
        return "Google Meet";
    }
  };

  // Get current date and time for min values
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Video className="h-5 w-5 mr-2 text-blue-600" />
            Agendar Aula Ao Vivo
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título da Aula *</Label>
              <Input
                id="title"
                placeholder="Ex: Introdução ao React Hooks"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o que será abordado na aula..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Data *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="scheduledDate"
                  type="date"
                  min={currentDate}
                  value={formData.scheduledDate}
                  onChange={(e) => handleInputChange("scheduledDate", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledTime">Horário *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="scheduledTime"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => handleInputChange("scheduledTime", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          {/* Duration and Participants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duração (minutos)</Label>
              <Select value={formData.duration} onValueChange={(value) => handleInputChange("duration", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1h 30min</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                  <SelectItem value="180">3 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Máximo de Participantes</Label>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="maxParticipants"
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.maxParticipants}
                  onChange={(e) => handleInputChange("maxParticipants", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Platform Selection */}
          <div className="space-y-2">
            <Label htmlFor="platform">Plataforma de Videoconferência</Label>
            <Select value={formData.platform} onValueChange={(value) => handleInputChange("platform", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google_meet">
                  <div className="flex items-center">
                    <span className="mr-2">{getPlatformIcon("google_meet")}</span>
                    Google Meet
                  </div>
                </SelectItem>
                <SelectItem value="zoom">
                  <div className="flex items-center">
                    <span className="mr-2">{getPlatformIcon("zoom")}</span>
                    Zoom
                  </div>
                </SelectItem>
                <SelectItem value="teams">
                  <div className="flex items-center">
                    <span className="mr-2">{getPlatformIcon("teams")}</span>
                    Microsoft Teams
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Meeting URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="meetingUrl">Link da Reunião</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateMeetingUrl}
              >
                Gerar Link
              </Button>
            </div>
            <Input
              id="meetingUrl"
              type="url"
              placeholder={`Link do ${getPlatformName(formData.platform)}`}
              value={formData.meetingUrl}
              onChange={(e) => handleInputChange("meetingUrl", e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Deixe em branco para gerar automaticamente ou cole um link personalizado
            </p>
          </div>

          {/* Integration Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Integração Automática</h4>
            <p className="text-sm text-blue-700">
              O link da aula será enviado automaticamente aos participantes por email 1 hora antes do início. 
              Você também pode compartilhar o link manualmente.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createLiveClassMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createLiveClassMutation.isPending ? "Agendando..." : "Agendar Aula"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
