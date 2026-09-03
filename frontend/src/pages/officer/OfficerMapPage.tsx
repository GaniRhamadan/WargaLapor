import React, { useEffect, useState } from 'react';
import { officerService } from '../../services/officerService';
import { Report } from '../../types/report';
import { ReportMap } from '../../components/maps/ReportMap';
import { Card } from '../../components/common/Card';

export const OfficerMapPage: React.FC = () => {
  const [tasks, setTasks] = useState<Report[]>([]);

  useEffect(() => {
    officerService.getTasks().then((res) => setTasks(res.tasks.data));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Peta Tugas Lapangan</h1>
        <p className="text-xs text-slate-500">Visualisasi sebaran koordinat tugas yang dialokasikan ke unit Anda</p>
      </div>

      <ReportMap reports={tasks} height="600px" />
    </div>
  );
};
