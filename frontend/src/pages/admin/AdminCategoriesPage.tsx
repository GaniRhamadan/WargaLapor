import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { reportService } from '../../services/reportService';
import { ReportCategory, ReportPriority } from '../../types/report';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Tag, Plus, Edit2, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { PriorityBadge } from '../../components/common/Badge';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<ReportCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ReportCategory | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#0D9488');
  const [defaultPriority, setDefaultPriority] = useState<ReportPriority>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = () => {
    setLoading(true);
    reportService
      .getCategories()
      .then((res) => setCategories(res.categories))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setColor('#0D9488');
    setDefaultPriority('MEDIUM');
    setShowModal(true);
  };

  const handleOpenEdit = (cat: ReportCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setColor(cat.color);
    setDefaultPriority(cat.default_priority);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await adminService.updateCategory(editingCategory.id, {
          name,
          description,
          color,
          default_priority: defaultPriority,
        });
      } else {
        await adminService.createCategory({
          name,
          description,
          color,
          default_priority: defaultPriority,
        });
      }
      setShowModal(false);
      fetchCategories();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: number) => {
    await adminService.deleteCategory(id);
    fetchCategories();
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Kategori Masalah</h1>
          <p className="text-xs text-slate-500">Kelola master data klasifikasi aduan masyarakat</p>
        </div>

        <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd}>
          Tambah Kategori Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => (
          <Card key={cat.id} className="p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div
                  style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                >
                  <Tag className="w-5 h-5" />
                </div>
                <PriorityBadge priority={cat.default_priority} size="sm" />
              </div>

              <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
              <p className="text-xs text-slate-500 line-clamp-2">{cat.description || 'Kategori aduan publik'}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {cat.reports_count || 0} Total Laporan
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(cat)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* CREATE / EDIT CATEGORY MODAL */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCategory ? 'Edit Kategori Masalah' : 'Tambah Kategori Baru'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Nama Kategori *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Lampu Jalan & PJU"
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Deskripsi Ringkas</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Penjelasan cakupan jenis kerusakan..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Prioritas Default</label>
              <select
                value={defaultPriority}
                onChange={(e) => setDefaultPriority(e.target.value as ReportPriority)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="CRITICAL">Kritis</option>
                <option value="HIGH">Tinggi</option>
                <option value="MEDIUM">Sedang</option>
                <option value="LOW">Rendah</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Warna Tag Kategori</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5"
                />
                <span className="text-xs font-mono text-slate-600">{color}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
