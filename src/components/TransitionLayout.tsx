
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TransitionLayoutProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animation?: 'fade' | 'slide-up' | 'scale' | 'blur';
}

const TransitionLayout: React.FC<TransitionLayoutProps> = ({
  children,
  className,
  delay = 0,
  animation = 'fade'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getAnimationClass = () => {
    switch (animation) {
      case 'fade':
        return 'animate-fade-in';
      case 'slide-up':
        return 'animate-slide-up';
      case 'scale':
        return 'animate-scale-in';
      case 'blur':
        return 'animate-blur-in';
      default:
        return 'animate-fade-in';
    }
  };

  return (
    <div
      className={cn(
        "transition-all duration-500 ease-out",
        isVisible ? getAnimationClass() : 'opacity-0',
        className
      )}
    >
      {children}
    </div>
  );
};

export default TransitionLayout;
