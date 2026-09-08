import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface CategoryChartProps {
  data: Array<{ name: string; count: number; color?: string }>;
  height?: number;
}

const DEFAULT_COLORS = [
  '#0D9488', // Teal
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#64748B', // Slate
];

export const CategoryChart: React.FC<CategoryChartProps> = ({ data = [], height = 320 }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    return (data || []).filter((d) => d && Number(d.count) > 0);
  }, [data]);

  const totalCount = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + Number(curr.count || 0), 0);
  }, [chartData]);

  if (!chartData || chartData.length === 0) {
    return (
      <div
        style={{ minHeight: height }}
        className="flex flex-col items-center justify-center text-slate-400 p-6 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50"
      >
        <span className="text-2xl mb-1.5">📊</span>
        <p className="text-xs font-semibold text-slate-600">Belum Ada Data Kategori</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Laporan per dinas belum tercatat pada periode ini</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full" style={{ minHeight: height }}>
      {/* 1. Donut Chart Section with Centered Summary */}
      <div className="relative w-full h-44 flex items-center justify-center shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={3}
              dataKey="count"
              nameKey="name"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {chartData.map((entry, index) => {
                const color = entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                const isHovered = activeIndex === index;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={color}
                    stroke="#FFFFFF"
                    strokeWidth={isHovered ? 3 : 1.5}
                    style={{
                      filter: isHovered ? 'drop-shadow(0px 4px 6px rgba(0,0,0,0.15))' : 'none',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                    }}
                  />
                );
              })}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  const pct = totalCount > 0 ? ((item.count / totalCount) * 100).toFixed(1) : '0';
                  const color = item.color || DEFAULT_COLORS[chartData.indexOf(item) % DEFAULT_COLORS.length];
                  return (
                    <div className="bg-white/95 backdrop-blur-xs border border-slate-200/80 shadow-lg rounded-xl p-2.5 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 gap-3 pt-0.5 text-[11px]">
                        <span>Jumlah Aduan:</span>
                        <span className="font-bold text-slate-900">{item.count} laporan ({pct}%)</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Centered Donut Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
            {totalCount}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
            Aduan
          </span>
        </div>
      </div>

      {/* 2. Structured & Elegant Custom Legend */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex-1 flex flex-col justify-start">
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {chartData.map((item, index) => {
            const color = item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
            const pct = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
            const isHovered = activeIndex === index;

            return (
              <div
                key={item.name}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`flex items-center justify-between text-xs py-1.5 px-2 rounded-xl transition-all cursor-pointer ${
                  isHovered ? 'bg-slate-100/90 shadow-xs' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span
                    className={`truncate text-xs ${
                      isHovered ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                    }`}
                    title={item.name}
                  >
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-slate-900 text-xs">{item.count}</span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
