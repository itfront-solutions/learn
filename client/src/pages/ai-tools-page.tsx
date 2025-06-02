import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Brain, Lightbulb, Search, FileText, Zap, CheckCircle } from "lucide-react";

export default function AIToolsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Quiz Generation State
  const [quizTopic, setQuizTopic] = useState("");
  const [quizLevel, setQuizLevel] = useState("intermediario");
  const [generatedQuiz, setGeneratedQuiz] = useState<any>(null);

  // Course Structure State
  const [structureTitle, setStructureTitle] = useState("");
  const [structureCategory, setStructureCategory] = useState("");
  const [structureLevel, setStructureLevel] = useState("intermediario");
  const [generatedStructure, setGeneratedStructure] = useState<any>(null);

  // Content Analysis State
  const [analysisContent, setAnalysisContent] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Quiz Generation
  const quizMutation = useMutation({
    mutationFn: async (data: { topic: string; level: string }) => {
      const response = await apiRequest("POST", "/api/ai/generate-quiz", data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedQuiz(data);
      toast({
        title: "Quiz gerado com sucesso!",
        description: "Seu quiz foi criado pela IA.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao gerar quiz",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    },
  });

  // Structure Generation
  const structureMutation = useMutation({
    mutationFn: async (data: { title: string; category: string; level: string }) => {
      const response = await apiRequest("POST", "/api/ai/generate-structure", data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedStructure(data);
      toast({
        title: "Estrutura gerada com sucesso!",
        description: "A IA criou uma estrutura completa para seu curso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao gerar estrutura",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    },
  });

  // Content Analysis
  const analysisMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      const response = await apiRequest("POST", "/api/ai/analyze-content", data);
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast({
        title: "Análise concluída!",
        description: "A IA analisou seu conteúdo e forneceu sugestões.",
      });
    },
    onError: () => {
      toast({
        title: "Erro na análise",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateQuiz = () => {
    if (!quizTopic.trim()) {
      toast({
        title: "Tópico obrigatório",
        description: "Por favor, insira um tópico para o quiz.",
        variant: "destructive",
      });
      return;
    }
    quizMutation.mutate({ topic: quizTopic, level: quizLevel });
  };

  const handleGenerateStructure = () => {
    if (!structureTitle.trim() || !structureCategory.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha título e categoria.",
        variant: "destructive",
      });
      return;
    }
    structureMutation.mutate({ 
      title: structureTitle, 
      category: structureCategory, 
      level: structureLevel 
    });
  };

  const handleAnalyzeContent = () => {
    if (!analysisContent.trim()) {
      toast({
        title: "Conteúdo obrigatório",
        description: "Por favor, insira o conteúdo para análise.",
        variant: "destructive",
      });
      return;
    }
    analysisMutation.mutate({ content: analysisContent });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">IA Educacional</h1>
          <p className="text-gray-600">Ferramentas inteligentes para criação e curadoria de conteúdo educacional</p>
        </div>

        <Tabs defaultValue="quiz" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quiz">Gerador de Quiz</TabsTrigger>
            <TabsTrigger value="structure">Estrutura de Curso</TabsTrigger>
            <TabsTrigger value="analysis">Análise de Conteúdo</TabsTrigger>
          </TabsList>

          {/* Quiz Generator */}
          <TabsContent value="quiz">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="h-5 w-5 mr-2 text-blue-600" />
                    Gerador de Quiz
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="quiz-topic">Tópico do Quiz</Label>
                    <Input
                      id="quiz-topic"
                      placeholder="Ex: JavaScript ES6+"
                      value={quizTopic}
                      onChange={(e) => setQuizTopic(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="quiz-level">Nível de Dificuldade</Label>
                    <Select value={quizLevel} onValueChange={setQuizLevel}>
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

                  <Button 
                    onClick={handleGenerateQuiz} 
                    disabled={quizMutation.isPending}
                    className="w-full"
                  >
                    {quizMutation.isPending ? (
                      <>
                        <Zap className="h-4 w-4 mr-2 animate-pulse" />
                        Gerando Quiz...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Gerar Quiz com IA
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Quiz Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Quiz Gerado</CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedQuiz ? (
                    <div className="space-y-4">
                      {generatedQuiz.questions?.map((question: any, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium mb-2">{index + 1}. {question.question}</h4>
                          <div className="space-y-1">
                            {question.options?.map((option: string, optIndex: number) => (
                              <div 
                                key={optIndex}
                                className={`text-sm p-2 rounded ${
                                  optIndex === question.correctAnswer 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-50'
                                }`}
                              >
                                {String.fromCharCode(65 + optIndex)}. {option}
                              </div>
                            ))}
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            <strong>Explicação:</strong> {question.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Use o formulário ao lado para gerar um quiz</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Course Structure Generator */}
          <TabsContent value="structure">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-emerald-600" />
                    Gerador de Estrutura
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="structure-title">Título do Curso</Label>
                    <Input
                      id="structure-title"
                      placeholder="Ex: React para Iniciantes"
                      value={structureTitle}
                      onChange={(e) => setStructureTitle(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="structure-category">Categoria</Label>
                    <Select value={structureCategory} onValueChange={setStructureCategory}>
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

                  <div>
                    <Label htmlFor="structure-level">Nível</Label>
                    <Select value={structureLevel} onValueChange={setStructureLevel}>
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

                  <Button 
                    onClick={handleGenerateStructure} 
                    disabled={structureMutation.isPending}
                    className="w-full"
                  >
                    {structureMutation.isPending ? (
                      <>
                        <Zap className="h-4 w-4 mr-2 animate-pulse" />
                        Gerando Estrutura...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Gerar Estrutura com IA
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Structure Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Estrutura Gerada</CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedStructure ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">{generatedStructure.title}</h3>
                      {generatedStructure.modules?.map((module: any, moduleIndex: number) => (
                        <div key={moduleIndex} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium mb-3">
                            Módulo {moduleIndex + 1}: {module.title}
                          </h4>
                          <div className="space-y-2">
                            {module.lessons?.map((lesson: any, lessonIndex: number) => (
                              <div key={lessonIndex} className="bg-gray-50 p-3 rounded">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h5 className="font-medium text-sm">
                                      Aula {lessonIndex + 1}: {lesson.title}
                                    </h5>
                                    <p className="text-xs text-gray-600 mt-1">
                                      {lesson.description}
                                    </p>
                                  </div>
                                  <Badge variant="secondary" className="text-xs">
                                    {lesson.estimatedDuration}min
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Use o formulário ao lado para gerar uma estrutura</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Analysis */}
          <TabsContent value="analysis">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Search className="h-5 w-5 mr-2 text-purple-600" />
                    Análise de Conteúdo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="analysis-content">Conteúdo para Análise</Label>
                    <Textarea
                      id="analysis-content"
                      placeholder="Cole aqui o conteúdo que deseja analisar..."
                      value={analysisContent}
                      onChange={(e) => setAnalysisContent(e.target.value)}
                      rows={8}
                    />
                  </div>

                  <Button 
                    onClick={handleAnalyzeContent} 
                    disabled={analysisMutation.isPending}
                    className="w-full"
                  >
                    {analysisMutation.isPending ? (
                      <>
                        <Zap className="h-4 w-4 mr-2 animate-pulse" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Analisar com IA
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Analysis Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Resultado da Análise</CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisResult ? (
                    <div className="space-y-6">
                      {/* Score */}
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          {analysisResult.score}/100
                        </div>
                        <Badge 
                          variant={analysisResult.score >= 80 ? "default" : "secondary"}
                          className={analysisResult.score >= 80 ? "bg-green-100 text-green-700" : ""}
                        >
                          Nível: {analysisResult.difficulty}
                        </Badge>
                      </div>

                      {/* Improvements */}
                      {analysisResult.improvements?.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3 flex items-center">
                            <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                            Sugestões de Melhoria
                          </h4>
                          <ul className="space-y-2">
                            {analysisResult.improvements.map((improvement: string, index: number) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start">
                                <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                                {improvement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Missing Topics */}
                      {analysisResult.missingTopics?.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">Tópicos Sugeridos</h4>
                          <div className="flex flex-wrap gap-2">
                            {analysisResult.missingTopics.map((topic: string, index: number) => (
                              <Badge key={index} variant="outline">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Use o formulário ao lado para analisar conteúdo</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* AI Features Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Sobre as Ferramentas de IA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Brain className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                <h3 className="font-medium mb-2">Geração Inteligente</h3>
                <p className="text-sm text-gray-600">
                  Crie quizzes e estruturas de curso automaticamente com base em tópicos
                </p>
              </div>
              
              <div className="text-center">
                <Search className="h-8 w-8 mx-auto mb-3 text-purple-600" />
                <h3 className="font-medium mb-2">Análise Avançada</h3>
                <p className="text-sm text-gray-600">
                  Receba feedback detalhado sobre qualidade e adequação do conteúdo
                </p>
              </div>
              
              <div className="text-center">
                <Lightbulb className="h-8 w-8 mx-auto mb-3 text-yellow-500" />
                <h3 className="font-medium mb-2">Sugestões Personalizadas</h3>
                <p className="text-sm text-gray-600">
                  Obtenha recomendações específicas para melhorar seus materiais
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
