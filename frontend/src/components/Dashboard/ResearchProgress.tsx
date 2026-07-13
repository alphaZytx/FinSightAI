import { Check, Circle } from 'lucide-react';
import type { ResearchStep } from '../../types';
import { mockResearchSteps } from '../../services/mockData';
import { Card } from '../Common';

interface ResearchProgressProps {
  steps?: ResearchStep[];
  companyName?: string;
  currentProgress?: number;
}

export default function ResearchProgress({ steps = mockResearchSteps, companyName = 'TechFlow Inc', currentProgress }: ResearchProgressProps) {
  const completedCount = steps.filter((s) => s.completed).length;
  const calculatedProgress = Math.round((completedCount / steps.length) * 100);
  const progress = currentProgress !== undefined ? currentProgress : calculatedProgress;

  return (
    <Card title="Research Progress" subtitle={`${companyName} — ${progress}% complete`}>
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-surface-400">
          <span>Overall progress</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-0">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                  step.completed
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                    : step.active
                      ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                      : 'border-surface-600 bg-surface-800 text-surface-500'
                }`}
              >
                {step.completed ? (
                  <Check className="h-3.5 w-3.5" />
                ) : step.active ? (
                  <div className="h-2 w-2 animate-pulse rounded-full bg-primary-400" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`my-1 h-6 w-0.5 ${
                    step.completed ? 'bg-emerald-500/50' : 'bg-surface-700'
                  }`}
                />
              )}
            </div>
            <div className="pb-4 pt-1">
              <p
                className={`text-sm font-medium ${
                  step.completed
                    ? 'text-emerald-400'
                    : step.active
                      ? 'text-primary-300'
                      : 'text-surface-400'
                }`}
              >
                {step.label}
              </p>
              {step.active && (
                <p className="mt-0.5 text-xs text-surface-500">In progress...</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
