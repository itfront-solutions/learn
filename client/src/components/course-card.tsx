import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Clock, Users, Play, BookOpen } from "lucide-react";

interface CourseCardProps {
  course: {
    id: number;
    title: string;
    description: string;
    category: string;
    level: string;
    price: string;
    duration?: number;
    thumbnail?: string;
    instructor: {
      id: number;
      name: string;
      avatar?: string;
    };
    _count: {
      enrollments: number;
      reviews: number;
    };
  };
}

export default function CourseCard({ course }: CourseCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "programação":
        return "bg-blue-100 text-blue-700";
      case "design":
        return "bg-purple-100 text-purple-700";
      case "marketing":
        return "bg-green-100 text-green-700";
      case "negócios":
        return "bg-yellow-100 text-yellow-700";
      case "data science":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "iniciante":
        return "bg-emerald-100 text-emerald-700";
      case "intermediario":
        return "bg-amber-100 text-amber-700";
      case "avancado":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    if (numPrice === 0) return "Gratuito";
    return `R$ ${numPrice.toFixed(2).replace(".", ",")}`;
  };

  const averageRating = 4.5; // This would come from actual review data

  return (
    <Card className="course-card overflow-hidden group">
      {/* Course Thumbnail */}
      <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
        {course.thumbnail ? (
          <img 
            src={course.thumbnail} 
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-16 w-16 text-white opacity-80" />
          </div>
        )}
        
        {/* Category and Level Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <Badge className={getCategoryColor(course.category)}>
            {course.category}
          </Badge>
          <Badge className={getLevelColor(course.level)}>
            {course.level}
          </Badge>
        </div>

        {/* Price Badge */}
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="bg-white/90 text-gray-900 font-semibold">
            {formatPrice(course.price)}
          </Badge>
        </div>
      </div>

      <CardContent className="p-6">
        {/* Course Title and Description */}
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
            {course.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-3">
            {course.description}
          </p>
        </div>

        {/* Instructor Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={course.instructor.avatar || ""} alt={course.instructor.name} />
              <AvatarFallback className="text-xs bg-gray-100">
                {getInitials(course.instructor.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600">{course.instructor.name}</span>
          </div>
          
          {/* Rating */}
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
            <span className="text-sm text-gray-500">({course._count.reviews})</span>
          </div>
        </div>

        {/* Course Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
          <div className="flex items-center space-x-4">
            {course.duration && (
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{course.duration}h</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{course._count.enrollments} alunos</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button asChild className="flex-1">
            <Link href={`/courses/${course.id}`}>
              <Play className="h-4 w-4 mr-2" />
              Ver Curso
            </Link>
          </Button>
          
          {parseFloat(course.price) > 0 ? (
            <Button variant="outline" className="flex-1">
              Matricular
            </Button>
          ) : (
            <Button variant="outline" className="flex-1">
              Acessar Grátis
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
