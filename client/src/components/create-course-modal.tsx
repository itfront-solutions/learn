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
import { Upload, FileVideo, FileText, Brain, X } from "lucide-react";

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateCourseModal({ isOpen, onClose }: CreateCourseModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    level: "iniciante",
    price: "0",
    duration: "",
  });
  
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [materials, setMaterials] = useState<File[]>([]);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);

  const createCourseMutation = useMutation({
    mutationFn: async (courseData: any) => {
      const response = await apiRequest("POST", "/api/courses", courseData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-courses"] });
      toast({
        title: "Curso criado com sucesso!",
        description: "Seu curso foi criado e está sendo processado.",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar curso",
        description: error.message || "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await apiRequest("POST", "/api/upload", formData);
      return response.json();
    },
  });

  const generateStructureMutation = useMutation({
    mutationFn: async (data: { title: string; category: string; level: string }) => {
      const response = await apiRequest("POST", "/api/ai/generate-structure", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Estrutura gerada com IA!",
        description: "Uma estrutura foi criada automaticamente para seu curso.",
      });
      // You could populate lessons based on the generated structure
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleThumbnailUpload = (file: File) => {
    if (file.type.startsWith("image/")) {
      setThumbnail(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione uma imagem para a thumbnail.",
        variant: "destructive",
      });
    }
  };

  const handleMaterialsUpload = (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      const validTypes = [
        "video/mp4", "video/avi", "video/mov", "video/mkv",
        "application/pdf",
        "image/jpeg", "image/png", "image/gif"
      ];
      return validTypes.includes(file.type);
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Alguns arquivos foram ignorados",
        description: "Apenas vídeos, PDFs e imagens são aceitos.",
        variant: "destructive",
      });
    }

    setMaterials(prev => [...prev, ...validFiles]);
  };

  const removeMaterial = (index: number) => {
    setMaterials(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleMaterialsUpload(files);
    }
  };

  const handleGenerateStructure = () => {
    if (!formData.title || !formData.category) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título e categoria antes de gerar a estrutura.",
        variant: "destructive",
      });
      return;
    }

    generateStructureMutation.mutate({
      title: formData.title,
      category: formData.category,
      level: formData.level,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.category) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      let thumbnailUrl = "";
      if (thumbnail) {
        const uploadResult = await uploadFileMutation.mutateAsync(thumbnail);
        thumbnailUrl = uploadResult.url;
      }

      const courseData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        level: formData.level,
        price: parseFloat(formData.price) || 0,
        duration: parseInt(formData.duration) || null,
        thumbnail: thumbnailUrl,
        isPublished: false, // Courses start as drafts
      };

      createCourseMutation.mutate(courseData);
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Erro ao fazer upload dos arquivos.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      level: "iniciante",
      price: "0",
      duration: "",
    });
    setThumbnail(null);
    setMaterials([]);
    setThumbnailPreview("");
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Curso</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Curso *</Label>
              <Input
                id="title"
                placeholder="Digite o título do curso"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Programação">Programação</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Negócios">Negócios</SelectItem>
                  <SelectItem value="Data Science">Data Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              placeholder="Descreva o que os alunos aprenderão neste curso"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={4}
              required
            />
          </div>

          {/* Course Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level">Nível</Label>
              <Select value={formData.level} onValueChange={(value) => handleInputChange("level", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iniciante">Iniciante</SelectItem>
                  <SelectItem value="intermediario">Intermediário</SelectItem>
                  <SelectItem value="avancado">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duração (horas)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="8"
                value={formData.duration}
                onChange={(e) => handleInputChange("duration", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
              />
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div className="space-y-2">
            <Label>Thumbnail do Curso</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              {thumbnailPreview ? (
                <div className="relative">
                  <img
                    src={thumbnailPreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setThumbnail(null);
                      setThumbnailPreview("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">Clique para enviar ou arraste uma imagem</p>
                  <p className="text-sm text-gray-500">PNG, JPG até 5MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleThumbnailUpload(e.target.files[0])}
                    className="hidden"
                    id="thumbnail-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("thumbnail-upload")?.click()}
                    className="mt-4"
                  >
                    Selecionar Imagem
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Materials Upload */}
          <div className="space-y-2">
            <Label>Materiais do Curso</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 upload-area ${
                isDragOver ? "dragover" : "border-gray-300"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <FileVideo className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">Envie vídeos, PDFs e imagens</p>
                <p className="text-sm text-gray-500">Arraste arquivos aqui ou clique para selecionar</p>
                <input
                  type="file"
                  multiple
                  accept="video/*,application/pdf,image/*"
                  onChange={(e) => e.target.files && handleMaterialsUpload(e.target.files)}
                  className="hidden"
                  id="materials-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("materials-upload")?.click()}
                  className="mt-4"
                >
                  Selecionar Arquivos
                </Button>
              </div>
            </div>

            {/* Materials List */}
            {materials.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {materials.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {file.type.startsWith("video/") ? (
                        <FileVideo className="h-5 w-5 text-blue-500" />
                      ) : (
                        <FileText className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMaterial(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Assistant */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Brain className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Assistente de IA</h3>
            </div>
            <p className="text-gray-600 mb-4">
              A IA pode ajudar a gerar uma estrutura completa para seu curso com base no título e categoria.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateStructure}
              disabled={generateStructureMutation.isPending}
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              {generateStructureMutation.isPending ? (
                "Gerando..."
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Gerar Estrutura com IA
                </>
              )}
            </Button>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createCourseMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createCourseMutation.isPending ? "Criando..." : "Criar Curso"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
