
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from 'framer-motion';

interface QAPair {
  question: string;
  answer: string;
}

interface QuestionLevel {
  level: string;
  questions: QAPair[];
}

interface QAVisualizationProps {
  questions: QuestionLevel[];
}

const getLevelColor = (level: string) => {
  switch(level) {
    case 'Basic': return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dark: '#059669' };
    case 'Intermediate': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dark: '#1C64F2' };
    case 'Advanced': return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dark: '#7E22CE' };
    default: return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', dark: '#4B5563' };
  }
};

const QAVisualization: React.FC<QAVisualizationProps> = ({ questions }) => {
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);

  // Calculate the total number of questions
  const totalQuestions = questions.reduce((acc, level) => acc + level.questions.length, 0);
  
  // Initialize nodes based on questions data
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    setDimensions({
      width: container.clientWidth,
      height: 400, // Fixed height
    });

    // Generate nodes
    const newNodes: any[] = [];
    let idx = 0;
    
    questions.forEach((level) => {
      const levelColor = getLevelColor(level.level);
      
      level.questions.forEach((qa) => {
        // Create unique ID for each question
        const nodeId = `${level.level}-${idx}`;
        
        // Create node
        newNodes.push({
          id: nodeId,
          x: Math.random() * dimensions.width * 0.8,
          y: Math.random() * dimensions.height * 0.8,
          level: level.level,
          question: qa.question.length > 60 ? qa.question.substring(0, 60) + '...' : qa.question,
          answer: qa.answer,
          color: levelColor,
          size: level.level === 'Basic' ? 35 : level.level === 'Intermediate' ? 40 : 45,
        });
        
        idx++;
      });
    });
    
    setNodes(newNodes);
    setTimeout(() => setIsReady(true), 100); // Delay to ensure proper rendering
  }, [questions, dimensions.width, dimensions.height]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      
      setDimensions({
        width: containerRef.current.clientWidth,
        height: 400, // Keep fixed height
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generate random movement for nodes
  const generateRandomMovement = (nodeId: string, axis: 'x' | 'y') => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return 0;
    
    const randomOffset = Math.random() * 30 - 15; // -15 to 15
    
    // Ensure nodes stay within boundaries
    if (axis === 'x') {
      const newX = node.x + randomOffset;
      return Math.max(50, Math.min(dimensions.width - 50, newX));
    } else {
      const newY = node.y + randomOffset;
      return Math.max(50, Math.min(dimensions.height - 50, newY));
    }
  };

  // Handle node click
  const handleNodeClick = (nodeId: string) => {
    setActiveNode(activeNode === nodeId ? null : nodeId);
  };

  return (
    <div className="relative w-full h-[400px]" ref={containerRef}>
      <div className="absolute top-2 right-2 flex flex-wrap gap-2 z-10">
        {questions.map((level) => {
          const color = getLevelColor(level.level);
          return (
            <Badge 
              key={level.level} 
              variant="outline" 
              className={`${color.bg} ${color.border} ${color.text}`}
            >
              {level.level}: {level.questions.length} questions
            </Badge>
          );
        })}
      </div>
      
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-10"></div>
      
      {/* Animated nodes */}
      <div className="relative h-full w-full overflow-hidden">
        {isReady && nodes.map((node) => (
          <motion.div
            key={node.id}
            className={`absolute cursor-pointer hover-scale transition-all duration-300 ${
              activeNode === node.id ? 'z-20 scale-110' : 'z-10'
            }`}
            style={{ left: node.x, top: node.y }}
            animate={{
              x: [0, Math.random() * 20 - 10, 0],
              y: [0, Math.random() * 20 - 10, 0],
              scale: activeNode === node.id ? 1.1 : 1,
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse"
            }}
            onClick={() => handleNodeClick(node.id)}
            whileHover={{ scale: 1.05 }}
          >
            <motion.div 
              className={`rounded-full flex items-center justify-center
                ${node.color.bg} ${node.color.border} border-2
                shadow-lg transition-shadow hover:shadow-xl
              `}
              style={{ 
                width: node.size * 2, 
                height: node.size * 2,
                marginLeft: -node.size,
                marginTop: -node.size
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                boxShadow: activeNode === node.id ? `0 0 15px ${node.color.dark}` : 'none'
              }}
              transition={{ duration: 0.5, delay: Math.random() * 0.5 }}
            >
              <span className="text-xs font-medium line-clamp-2 text-center px-2">
                Q{node.id.split('-')[1]}
              </span>
            </motion.div>
            
            {/* Question popup */}
            {activeNode === node.id && (
              <motion.div
                className="absolute z-30"
                style={{
                  left: node.size,
                  top: -10,
                  width: 240
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={`${node.color.bg} border ${node.color.border}`}>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium mb-1">{node.question}</p>
                    <p className="text-xs text-gray-600 line-clamp-3">{node.answer}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
      
      {/* Instructions */}
      <div className="absolute bottom-2 left-2 text-xs text-muted-foreground">
        Click on any node to see the question and answer
      </div>
    </div>
  );
};

export default QAVisualization;
