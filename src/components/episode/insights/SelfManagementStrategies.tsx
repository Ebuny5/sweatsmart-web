
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Target, 
  Wind,
  Thermometer,
  Heart,
  Clock,
  Activity,
  Shield
} from 'lucide-react';

const SelfManagementStrategies: React.FC = () => {
  const strategies = [
    {
      icon: <Wind className="h-5 w-5" />,
      title: "Breathing Exercises",
      description: "Deep breathing can help reduce stress and cool the body",
      color: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-600"
    },
    {
      icon: <Thermometer className="h-5 w-5" />,
      title: "Cool Environment",
      description: "Stay in air-conditioned spaces or use cooling products",
      color: "bg-cyan-50 border-cyan-200",
      iconColor: "text-cyan-600"
    },
    {
      icon: <Heart className="h-5 w-5" />,
      title: "Stress Management",
      description: "Practice meditation, yoga, or other relaxation techniques",
      color: "bg-pink-50 border-pink-200",
      iconColor: "text-pink-600"
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: "Regular Schedule",
      description: "Maintain consistent daily routines to reduce trigger exposure",
      color: "bg-green-50 border-green-200",
      iconColor: "text-green-600"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Trigger Avoidance",
      description: "Identify and avoid known triggers when possible",
      color: "bg-orange-50 border-orange-200",
      iconColor: "text-orange-600"
    },
    {
      icon: <Activity className="h-5 w-5" />,
      title: "Gentle Exercise",
      description: "Light physical activity can help manage stress and improve circulation",
      color: "bg-purple-50 border-purple-200",
      iconColor: "text-purple-600"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Self-Management Strategies
        </CardTitle>
        <CardDescription>
          Evidence-based techniques to help manage excessive sweating
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {strategies.map((strategy, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${strategy.color} transition-all hover:shadow-sm`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 p-2 rounded-lg bg-white/80 ${strategy.iconColor}`}>
                  {strategy.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-1">
                    {strategy.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    {strategy.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SelfManagementStrategies;
