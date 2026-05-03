import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BrainCircuit, 
  Zap, 
  MessageSquare, 
  Mail, 
  Target, 
  ChevronRight, 
  X,
  Radar,
  Network
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  title: string;
  desc: string;
  icon: any;
  color: string;
}

const steps: Step[] = [
  { 
    title: 'Neural Ingestion', 
    desc: 'Connect your Gmail & WhatsApp. The "Hands" of our AI automatically extract resumes and handle initial candidate replies.',
    icon: Mail,
    color: 'text-indigo-500'
  },
  { 
    title: 'Strategic Brain', 
    desc: 'Gemini 3-Flash performs deep-tissue matching. We dont just look for keywords; we find cultural and technical synergy.',
    icon: BrainCircuit,
    color: 'text-emerald-500'
  },
  { 
    title: 'High-Intent Discovery', 
    desc: 'Our scrapers find companies with 200% hiring surges or tech migrations. This is your high-intent pipeline.',
    icon: Radar,
    color: 'text-amber-500'
  },
  { 
    title: 'Marketplace Handshake', 
    desc: 'Distribute roles to your vendor network while maintaining 100% data anonymity and legal tracking.',
    icon: Network,
    color: 'text-blue-500'
  }
];

export default function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeen = localStorage.getItem('hirenest_onboard_v1');
    if (!hasSeen) {
      setTimeout(() => setIsOpen(true), 2000);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hirenest_onboard_v1', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xl">
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentStep}
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.95 }}
          className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden"
        >
          <div className="p-10">
            <div className="flex justify-between items-start mb-8">
              <div className={cn("w-16 h-16 rounded-[2rem] bg-slate-50 flex items-center justify-center shadow-lg", steps[currentStep].color)}>
                {React.createElement(steps[currentStep].icon, { className: "w-8 h-8" })}
              </div>
              <button onClick={handleClose} className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] bg-indigo-50 px-3 py-1 rounded-full">
                  Step {currentStep + 1} of {steps.length}
                </span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                {steps[currentStep].title}
              </h2>
              <p className="text-slate-500 text-lg font-medium leading-relaxed">
                {steps[currentStep].desc}
              </p>
            </div>

            <div className="mt-12 flex items-center justify-between">
              <div className="flex gap-2">
                {steps.map((_, i) => (
                  <div key={i} className={cn(
                    "w-2 h-2 rounded-full transition-all duration-500",
                    i === currentStep ? "w-8 bg-indigo-600" : "bg-slate-200"
                  )} />
                ))}
              </div>
              
              <div className="flex gap-3">
                {currentStep > 0 && (
                  <button 
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button 
                  onClick={() => {
                    if (currentStep < steps.length - 1) {
                      setCurrentStep(prev => prev + 1);
                    } else {
                      handleClose();
                    }
                  }}
                  className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10"
                >
                  {currentStep === steps.length - 1 ? 'Activate OS' : 'Next Intelligence'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
