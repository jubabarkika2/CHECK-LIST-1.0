import React from 'react';
import { 
  Sector, 
  ShiftType, 
  TaskTemplate, 
  TaskCompletion 
} from '../types';
import { 
  UtensilsCrossed, 
  ChefHat, 
  Wine, 
  ShieldCheck, 
  Boxes, 
  Sparkles, 
  Layers, 
  Clock, 
  SunMedium, 
  Moon, 
  Coffee 
} from 'lucide-react';

interface SectorSelectorProps {
  sectors: Sector[];
  activeSectorId: string;
  onSelectSector: (sectorId: string) => void;
  activeShift: ShiftType;
  onSelectShift: (shift: ShiftType) => void;
  tasks: TaskTemplate[];
  completions: Record<string, TaskCompletion>;
}

// Icon mapper helper
export const getSectorIcon = (iconName: string, className: string = 'w-5 h-5') => {
  switch (iconName) {
    case 'ChefHat':
      return <ChefHat className={className} />;
    case 'Wine':
      return <Wine className={className} />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} />;
    case 'Boxes':
      return <Boxes className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'UtensilsCrossed':
    default:
      return <UtensilsCrossed className={className} />;
  }
};

export const SectorSelector: React.FC<SectorSelectorProps> = ({
  sectors,
  activeSectorId,
  onSelectSector,
  activeShift,
  onSelectShift,
  tasks,
  completions,
}) => {
  const shifts: { id: ShiftType; label: string; icon: React.ReactNode }[] = [
    { id: 'abertura', label: 'Abertura', icon: <SunMedium className="w-3.5 h-3.5" /> },
    { id: 'durante', label: 'Durante Turno', icon: <Coffee className="w-3.5 h-3.5" /> },
    { id: 'fechamento', label: 'Fechamento', icon: <Moon className="w-3.5 h-3.5" /> },
    { id: 'todos', label: 'Todos os Turnos', icon: <Clock className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Sector Cards Carousel / Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Selecione o Setor</span>
          </label>
          <span className="text-xs text-slate-400">
            {sectors.length} setores operacionais
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {sectors.map((sector) => {
            const isSelected = sector.id === activeSectorId;
            
            // Calculate sector stats for current shift or all
            const sectorTasks = tasks.filter(
              (t) => t.sectorId === sector.id && (activeShift === 'todos' || t.shift === activeShift)
            );
            const totalTasks = sectorTasks.length;
            const completedCount = sectorTasks.filter(
              (t) => completions[t.id]?.completed
            ).length;
            const percentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
            const isFullyDone = totalTasks > 0 && completedCount === totalTasks;

            return (
              <button
                key={sector.id}
                type="button"
                onClick={() => onSelectSector(sector.id)}
                className={`relative text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                    : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {getSectorIcon(sector.icon, 'w-4 h-4 sm:w-5 sm:h-5')}
                    </div>

                    {totalTasks > 0 && (
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isFullyDone
                            ? 'bg-emerald-500/20 text-emerald-600 font-bold'
                            : isSelected
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {completedCount}/{totalTasks}
                      </span>
                    )}
                  </div>

                  <h3
                    className={`font-bold text-sm truncate ${
                      isSelected ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {sector.name}
                  </h3>
                  <p
                    className={`text-[11px] line-clamp-1 mt-0.5 ${
                      isSelected ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {sector.description}
                  </p>
                </div>

                {/* Progress bar */}
                {totalTasks > 0 && (
                  <div className="mt-3">
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          isFullyDone
                            ? 'bg-emerald-500'
                            : isSelected
                            ? 'bg-emerald-400'
                            : 'bg-slate-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Shift Filter Tabs */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>Filtrar por Turno</span>
        </label>
        
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          {shifts.map((shift) => {
            const isSelected = activeShift === shift.id;
            return (
              <button
                key={shift.id}
                type="button"
                onClick={() => onSelectShift(shift.id)}
                className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {shift.icon}
                <span>{shift.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
