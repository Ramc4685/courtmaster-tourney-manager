import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { transitions } from '@/lib/animation-utils';
import { Tournament } from '@/types/tournament';

interface TournamentCardProps {
  tournament: Tournament;
  delay?: number;
}

const infoItemAnimation = {
  whileHover: { x: 4 },
  transition: transitions.spring
};

export const TournamentCard: React.FC<TournamentCardProps> = ({ tournament, delay = 0 }) => {
  const navigate = useNavigate();
  const { getAnimationProps } = useScrollAnimation({
    animation: 'scaleIn',
    triggerOnce: true,
    delay
  });

  return (
    <motion.div {...getAnimationProps()}>
      <Card 
        className="h-full flex flex-col cursor-pointer overflow-hidden"
        onClick={() => navigate(`/tournaments/${tournament.id}`)}
      >
        <motion.div
          initial="initial"
          whileHover="hover"
          animate="visible"
        >
          <CardHeader className="relative">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 -z-10"
              variants={{
                initial: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1 },
                hover: { opacity: 1, scale: 1.05 }
              }}
              transition={transitions.smooth}
            />
            <motion.div
              variants={{
                hover: { y: -4 }
              }}
              transition={transitions.smooth}
            >
              <CardTitle className="text-xl relative">
                {tournament.name}
                <motion.div
                  className="absolute -top-1 -right-1 w-full h-0.5 bg-primary/50"
                  variants={{
                    initial: { scaleX: 0 },
                    hover: { scaleX: 1 }
                  }}
                  transition={transitions.smooth}
                />
              </CardTitle>
              <CardDescription>{tournament.description}</CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="flex-grow">
            <motion.div 
              className="space-y-4"
              variants={{
                visible: { 
                  transition: { 
                    staggerChildren: 0.1 
                  } 
                },
                hover: {
                  transition: { 
                    staggerChildren: 0.05 
                  }
                }
              }}
            >
              <motion.div 
                className="flex items-center text-sm text-muted-foreground"
                variants={{
                  initial: { x: -20, opacity: 0 },
                  visible: { x: 0, opacity: 1 },
                  hover: { x: 4 }
                }}
                transition={transitions.smooth}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                <span>
                  {format(new Date(tournament.startDate), 'MMM d, yyyy')} - {format(new Date(tournament.endDate), 'MMM d, yyyy')}
                </span>
              </motion.div>
              <motion.div 
                className="flex items-center text-sm text-muted-foreground"
                variants={{
                  initial: { x: -20, opacity: 0 },
                  visible: { x: 0, opacity: 1 },
                  hover: { x: 4 }
                }}
                transition={transitions.smooth}
              >
                <MapPin className="mr-2 h-4 w-4" />
                <span>{tournament.location}</span>
              </motion.div>
              <motion.div 
                className="flex items-center text-sm text-muted-foreground"
                variants={{
                  initial: { x: -20, opacity: 0 },
                  visible: { x: 0, opacity: 1 },
                  hover: { x: 4 }
                }}
                transition={transitions.smooth}
              >
                <Users className="mr-2 h-4 w-4" />
                <span>{tournament.registrationEnabled ? 'Registration Open' : 'Registration Closed'}</span>
              </motion.div>
            </motion.div>
          </CardContent>
        </motion.div>
      </Card>
    </motion.div>
  );
}; 