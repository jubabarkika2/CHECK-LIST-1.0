import React from 'react';
import { 
  ClipboardCheck, 
  Lock, 
  ShieldCheck, 
  Store, 
  UserCheck, 
  ChefHat, 
  Sparkles,
  PhoneCall,
  Cloud
} from 'lucide-react';
import { ManagerSettings } from '../types';

interface HeaderProps {
  isManagerMode: boolean;
  onToggleManagerMode: () => void;
  settings: ManagerSettings;
  activeStaffName: string;
  onChangeStaffName: () => void;
  isCloudSynced?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isManagerMode,
  onToggleManagerMode,
  settings,
  activeStaffName,
  onChangeStaffName,
  isCloudSynced = true,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          
          {/* Logo & Restaurant Name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-inner flex-shrink-0 text-white font-bold">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg text-slate-100 truncate tracking-tight">
                  {settings.restaurantName || 'Restaurante & Bistrô'}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                  <Cloud className="w-3 h-3 mr-1 text-emerald-400" /> Nuvem Ativa
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                {isManagerMode 
                  ? '🔒 Painel Administrativo do Gestor' 
                  : activeStaffName 
                    ? `Colaborador em turno: ${activeStaffName}` 
                    : 'Modo Operacional • Preenchimento & Fotos'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isManagerMode && activeStaffName && (
              <button
                type="button"
                onClick={onChangeStaffName}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 hover:text-white border border-slate-700 transition shadow-xs"
                title="Voltar para a tela de identificação / Trocar funcionário"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="max-w-[100px] sm:max-w-[140px] truncate">{activeStaffName}</span>
                <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                  Voltar
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onToggleManagerMode}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition shadow-sm ${
                isManagerMode
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold ring-2 ring-amber-400/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isManagerMode ? (
                <>
                  <Store className="w-4 h-4" />
                  <span>Voltar ao Checklist</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Painel do Gestor</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
