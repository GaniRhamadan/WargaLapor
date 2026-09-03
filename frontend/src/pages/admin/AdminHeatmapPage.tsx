import React, { useEffect, useState } from 'react';
import { mapService } from '../../services/mapService';
import { HeatmapView } from '../../components/maps/HeatmapView';
import { Card } from '../../components/common/Card';
import { Flame, Info } from 'lucide-react';

export const AdminHeatmapPage: React.FC = () => {
  const [points, setPoints] = useState<[number, number, number][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mapService
      .getHeatmapPoints()
      .then((res) => setPoints(res.points))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Flame className="w-6 h-6 text-rose-500" />
          Heatmap Konsentrasi Masalah Masyarakat
        </h1>
        <p className="text-xs text-slate-500">
          Visualisasi intensitas spasial untuk mengidentifikasi kawasan yang memerlukan intervensi infrastruktur skala besar
        </p>
      </div>

      <Card className="p-4 bg-slate-900 text-white flex items-center gap-3 text-xs">
        <Info className="w-5 h-5 text-teal-400 shrink-0" />
        <span>
          Area dengan warna merah pekat menandakan kepadatan laporan tinggi dan prioritas kritis (jalan rusak parah, banjir, atau pohon tumbang).
        </span>
      </Card>

      <HeatmapView points={points} height="600px" />
    </div>
  );
};
