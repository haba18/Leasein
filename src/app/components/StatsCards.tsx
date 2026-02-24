import { Package, AlertTriangle, Clock } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    total_en_preparacion: number;
    total_urgentes: number;
    total_dias_custodia: number;
  };
  onFilterClick: (filter: 'preparacion' | 'urgentes' | 'dias') => void;
}

export function StatsCards({ stats, onFilterClick }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
      {/* Total en Preparación */}
      <button
        onClick={() => onFilterClick('preparacion')}
        className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/30 border-2 border-blue-200 dark:border-blue-900 rounded-xl p-3 lg:p-6 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer text-left"
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs lg:text-sm text-blue-600 dark:text-blue-400 font-medium truncate">En Preparación</p>
            <p className="text-xl lg:text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">
              {stats.total_en_preparacion}
            </p>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
              Click para filtrar
            </p>
          </div>
          <div className="bg-blue-200 dark:bg-blue-900 p-2 lg:p-3 rounded-full flex-shrink-0 ml-2 shadow-md">
            <Package className="h-4 w-4 lg:h-6 lg:w-6 text-blue-700 dark:text-blue-400" />
          </div>
        </div>
      </button>

      {/* Urgentes */}
      <button
        onClick={() => onFilterClick('urgentes')}
        className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/30 border-2 border-red-200 dark:border-red-900 rounded-xl p-3 lg:p-6 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer text-left"
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs lg:text-sm text-red-600 dark:text-red-400 font-medium truncate">Urgentes</p>
            <p className="text-xl lg:text-3xl font-bold text-red-900 dark:text-red-100 mt-1">
              {stats.total_urgentes}
            </p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">
              Click para filtrar
            </p>
          </div>
          <div className="bg-red-200 dark:bg-red-900 p-2 lg:p-3 rounded-full flex-shrink-0 ml-2 shadow-md">
            <AlertTriangle className="h-4 w-4 lg:h-6 lg:w-6 text-red-700 dark:text-red-400" />
          </div>
        </div>
      </button>

      {/* Promedio Días en Custodia */}
      <button
        onClick={() => onFilterClick('dias')}
        className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/30 border-2 border-purple-200 dark:border-purple-900 rounded-xl p-3 lg:p-6 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer text-left"
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs lg:text-sm text-purple-600 dark:text-purple-400 font-medium truncate">Promedio Días Custodia</p>
            <p className="text-xl lg:text-3xl font-bold text-purple-900 dark:text-purple-100 mt-1">
              {stats.total_dias_custodia || 0}
              <span className="text-sm font-normal text-purple-600 ml-1">días</span>
            </p>
            <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
              Click para ordenar
            </p>
          </div>
          <div className="bg-purple-200 dark:bg-purple-900 p-2 lg:p-3 rounded-full flex-shrink-0 ml-2 shadow-md">
            <Clock className="h-4 w-4 lg:h-6 lg:w-6 text-purple-700 dark:text-purple-400" />
          </div>
        </div>
      </button>
    </div>
  );
}