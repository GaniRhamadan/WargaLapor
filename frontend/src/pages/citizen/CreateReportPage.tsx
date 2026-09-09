import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { reportService } from '../../services/reportService';
import { AiAnalysis, DuplicateReportItem, ReportCategory } from '../../types/report';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LocationPicker } from '../../components/maps/LocationPicker';
import { AiAnalysisBadge } from '../../components/reports/AiAnalysisBadge';
import { DuplicateAlertModal } from '../../components/reports/DuplicateAlertModal';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bot,
  Camera,
  Check,
  CheckCircle2,
  Droplets,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  Landmark,
  Lightbulb,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Plus,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  Sparkles,
  Tag,
  TrafficCone,
  Trash2,
  Trees,
  Upload,
  User,
  Waves,
  X,
} from 'lucide-react';

export const CreateReportPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const geo = useGeolocation();

  // Wizard Step state (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [categories, setCategories] = useState<ReportCategory[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState<boolean>(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [latitude, setLatitude] = useState<number>(-6.2088);
  const [longitude, setLongitude] = useState<number>(106.8227);
  const [address, setAddress] = useState<string>('Jl. Jenderal Sudirman, Jakarta Pusat');

  // AI & Duplicate State
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [duplicates, setDuplicates] = useState<DuplicateReportItem[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successReportId, setSuccessReportId] = useState<number | null>(null);

  // Inline Quick Re-Login Modal State
  const [showReloginModal, setShowReloginModal] = useState<boolean>(false);
  const [reloginEmail, setReloginEmail] = useState<string>(user?.email || 'warga@wargalapor.test');
  const [reloginPassword, setReloginPassword] = useState<string>('password');
  const [isReloggingIn, setIsReloggingIn] = useState<boolean>(false);

  const loadCategories = () => {
    setIsCategoriesLoading(true);
    reportService
      .getCategories()
      .then((res) => {
        if (res.categories && res.categories.length > 0) {
          setCategories(res.categories);
          if (!selectedCategoryId) {
            setSelectedCategoryId(res.categories[0].id);
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsCategoriesLoading(false));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Sync GPS updates
  useEffect(() => {
    if (geo.latitude && geo.longitude) {
      setLatitude(geo.latitude);
      setLongitude(geo.longitude);
      setAddress(geo.address);
    }
  }, [geo.latitude, geo.longitude, geo.address]);

  // Handle Photo Upload (Convert file to base64 preview)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} melebihi batas 5MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setImages((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Add mock sample image if user has no camera/files handy
  const addSampleImage = () => {
    const sampleUrls = [
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&auto=format&fit=crop&q=60',
    ];
    setImages((prev) => [...prev, sampleUrls[prev.length % sampleUrls.length]]);
  };

  // Trigger Step 5 AI & Duplicate analysis
  const runAiAndDuplicateCheck = async () => {
    setIsAiLoading(true);
    setErrorMsg(null);
    try {
      // 1. Trigger AI Analysis Preview
      const aiRes = await reportService.analyzeAi({
        title,
        description,
        category_id: selectedCategoryId || undefined,
      });
      setAiAnalysis(aiRes.analysis);

      // 2. Check Duplicates
      if (selectedCategoryId) {
        const dupRes = await reportService.checkDuplicates({
          latitude,
          longitude,
          category_id: selectedCategoryId,
          title,
          description,
        });

        if (dupRes.is_duplicate && dupRes.duplicates.length > 0) {
          setDuplicates(dupRes.duplicates);
          setShowDuplicateModal(true);
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleNextStep = async () => {
    setErrorMsg(null);

    if (currentStep === 1 && images.length === 0) {
      setErrorMsg('Mohon unggah minimal 1 foto bukti kondisi masalah di lapangan.');
      return;
    }
    if (currentStep === 2 && !selectedCategoryId) {
      setErrorMsg('Silakan pilih salah satu kategori masalah.');
      return;
    }
    if (currentStep === 3) {
      if (!title.trim() || title.length < 5) {
        setErrorMsg('Judul laporan minimal 5 karakter.');
        return;
      }
      if (!description.trim() || description.length < 10) {
        setErrorMsg('Deskripsi masalah minimal 10 karakter.');
        return;
      }
    }
    if (currentStep === 4) {
      if (!address.trim()) {
        setErrorMsg('Alamat lokasi tidak boleh kosong.');
        return;
      }
      // Entering Step 5: trigger AI & duplicate check
      runAiAndDuplicateCheck();
    }

    setCurrentStep((prev) => Math.min(5, prev + 1));
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  // Final Submit
  const handleSubmitReport = async (userAction: 'PROCEEDED' | 'MERGED' = 'PROCEEDED', mergedIntoId?: number) => {
    if (!selectedCategoryId) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await reportService.createReport({
        category_id: selectedCategoryId,
        title,
        description,
        latitude,
        longitude,
        address,
        images,
        user_action: userAction,
        merged_into_id: mergedIntoId,
      });

      setSuccessReportId(res.report.id);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setErrorMsg('Sesi login Anda telah berakhir. Silakan klik tombol Masuk / Login kembali.');
        setShowReloginModal(true);
      } else {
        setErrorMsg(err.response?.data?.message || 'Gagal mengirimkan laporan.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Inline Re-login Handler
  const handleQuickRelogin = async (e?: React.FormEvent, customEmail?: string) => {
    if (e) e.preventDefault();
    setIsReloggingIn(true);
    setErrorMsg(null);

    const emailToUse = customEmail || reloginEmail || 'warga@wargalapor.test';
    const passwordToUse = customEmail ? 'password' : (reloginPassword || 'password');

    try {
      await login({
        email: emailToUse,
        password: passwordToUse,
      });
      setShowReloginModal(false);
      // Auto-submit after successful re-authentication
      setTimeout(() => {
        handleSubmitReport('PROCEEDED');
      }, 200);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Login gagal. Periksa kembali email dan kata sandi.');
    } finally {
      setIsReloggingIn(false);
    }
  };

  const renderCategoryIcon = (iconName: string, color: string) => {
    const props = { className: 'w-5 h-5', style: { color } };
    switch (iconName) {
      case 'AlertTriangle':
        return <AlertTriangle {...props} />;
      case 'Trash2':
        return <Trash2 {...props} />;
      case 'Lightbulb':
        return <Lightbulb {...props} />;
      case 'Droplets':
        return <Droplets {...props} />;
      case 'Trees':
        return <Trees {...props} />;
      case 'Waves':
        return <Waves {...props} />;
      case 'Landmark':
        return <Landmark {...props} />;
      case 'GraduationCap':
        return <GraduationCap {...props} />;
      case 'TrafficCone':
        return <TrafficCone {...props} />;
      default:
        return <ShieldAlert {...props} />;
    }
  };

  // SUCCESS SCREEN
  if (successReportId) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Laporan Berhasil Terkirim!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Laporan Anda telah tercatat dalam sistem WargaLapor dan sedang dalam antrean verifikasi petugas dinas terkait.
          </p>
        </div>

        <Card className="p-5 text-left bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-400">Judul Laporan:</span>
            <span className="font-bold text-slate-800">{title}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-400">Lokasi:</span>
            <span className="font-medium text-slate-700 truncate max-w-xs">{address}</span>
          </div>
          {aiAnalysis && (
            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
              <span className="font-semibold text-slate-400">Estimasi Prioritas AI:</span>
              <span className="font-bold uppercase text-teal-700">{aiAnalysis.priority}</span>
            </div>
          )}
        </Card>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/citizen')}
          >
            Kembali ke Dashboard
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(`/citizen/reports/${successReportId}`)}
          >
            Lihat Progres Laporan Saya →
          </Button>
        </div>
      </div>
    );
  }

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Wizard Header & Step Tracker */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Buat Laporan Baru
            </h1>
            <p className="text-xs text-slate-500">
              Ikuti 5 langkah mudah untuk melaporkan masalah fasilitas lingkungan
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
            Langkah {currentStep} dari 5
          </span>
        </div>

        {/* Horizontal Step Bar */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { step: 1, label: 'Foto' },
            { step: 2, label: 'Kategori' },
            { step: 3, label: 'Deskripsi' },
            { step: 4, label: 'Lokasi' },
            { step: 5, label: 'Review & AI' },
          ].map((s) => (
            <div key={s.step} className="space-y-1.5">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentStep >= s.step ? 'bg-teal-600' : 'bg-slate-200'
                }`}
              />
              <p
                className={`text-[11px] font-bold text-center truncate ${
                  currentStep >= s.step ? 'text-teal-700' : 'text-slate-400'
                }`}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Error Alert Box */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-3 animate-shake">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          {errorMsg.toLowerCase().includes('login') && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setShowReloginModal(true)}
              className="shrink-0 font-bold"
            >
              Masuk / Login Lagi →
            </Button>
          )}
        </div>
      )}

      {/* STEP 1: UPLOAD FOTO */}
      {currentStep === 1 && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-teal-600" />
              Langkah 1: Unggah Foto Masalah
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Foto yang jelas membantu petugas mempercepat identifikasi dan mempersiapkan peralatan penanganan.
            </p>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-3xl p-8 text-center bg-slate-50/60 hover:bg-teal-50/20 transition-all cursor-pointer relative">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="p-4 rounded-2xl bg-white shadow-xs text-teal-600 border border-slate-100">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Klik untuk Memilih Foto atau Seret ke Sini
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Mendukung format JPG, PNG, WEBP (Maksimal 5MB per file)
                </p>
              </div>
            </div>
          </div>

          {/* Quick Demo Sample Photo Button */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-400">Tidak punya kamera saat ini?</span>
            <button
              type="button"
              onClick={addSampleImage}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 underline cursor-pointer"
            >
              + Gunakan Contoh Foto Laporan
            </button>
          </div>

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-700">Foto Terpilih ({images.length}):</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <div key={idx} className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-video group">
                    <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-md transition-all cursor-pointer opacity-90 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* STEP 2: PILIH KATEGORI */}
      {currentStep === 2 && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-teal-600" />
                Langkah 2: Pilih Kategori Masalah
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Pilih kategori yang paling sesuai agar laporan otomatis diteruskan ke dinas yang berwenang.
              </p>
            </div>

            {categories.length === 0 && !isCategoriesLoading && (
              <button
                type="button"
                onClick={loadCategories}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Muat Ulang Kategori
              </button>
            )}
          </div>

          {isCategoriesLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              <p className="text-xs">Memuat daftar kategori masalah...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-6 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-xs font-bold text-slate-700">Daftar kategori sedang tidak tersedia</p>
              <Button variant="primary" size="sm" onClick={loadCategories}>
                Coba Muat Ulang
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/40 shadow-xs ring-2 ring-teal-600/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      style={{ backgroundColor: `${cat.color}15` }}
                      className="p-3 rounded-xl shrink-0 font-bold flex items-center justify-center"
                    >
                      {renderCategoryIcon(cat.icon, cat.color)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{cat.name}</h4>
                        {isSelected && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {cat.description || 'Laporan masalah publik'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* STEP 3: DESKRIPSI MASALAH */}
      {currentStep === 3 && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              Langkah 3: Tulis Judul & Deskripsi
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Jelaskan kondisi kerusakan dan dampaknya bagi mobilitas atau keselamatan warga.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Judul Laporan Singkat & Jelas *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Lubang Aspal Dalam di Depan Gerbang Kompleks"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Deskripsi Lengkap Kondisi & Dampak *
              </label>
              <textarea
                rows={5}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan detail ukuran kerusakan, berapa lama terjadi, dan bahaya bagi pengendara / pejalan kaki..."
                className="w-full text-xs p-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none leading-relaxed"
              />
            </div>
          </div>
        </Card>
      )}

      {/* STEP 4: LOKASI GPS */}
      {currentStep === 4 && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-600" />
              Langkah 4: Tentukan Titik Lokasi Masalah
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan GPS otomatis atau geser pin merah pada peta persis di titik kerusakan.
            </p>
          </div>

          {/* Interactive Picker Map */}
          <LocationPicker
            latitude={latitude}
            longitude={longitude}
            onLocationChange={(lat, lon) => {
              setLatitude(lat);
              setLongitude(lon);
              geo.setManualLocation(lat, lon);
            }}
            onUseGps={geo.getCurrentLocation}
            isGpsLoading={geo.loading}
            height="380px"
          />

          {/* Address Field */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold text-slate-700">
              Patokan Alamat / Nama Jalan Terdekat *
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Contoh: Jl. Sudirman No. 12, Seberang Gedung Bank"
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
        </Card>
      )}

      {/* STEP 5: REVIEW & AI ANALYSIS */}
      {currentStep === 5 && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              Langkah 5: Tinjau Laporan & Evaluasi AI
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Periksa kembali kelengkapan informasi Anda sebelum dikirimkan ke sistem.
            </p>
          </div>

          {/* AI Analysis Loading / Results */}
          {isAiLoading ? (
            <div className="p-6 rounded-2xl bg-teal-50/50 border border-teal-100 flex items-center justify-center gap-3 text-xs text-teal-800">
              <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
              <span>Gemini AI sedang menganalisis tingkat keparahan laporan...</span>
            </div>
          ) : (
            aiAnalysis && <AiAnalysisBadge analysis={aiAnalysis} />
          )}

          {/* Summary Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Kategori & Judul</p>
              <div className="flex items-center gap-2">
                <span
                  style={{ backgroundColor: selectedCategory?.color || '#0D9488' }}
                  className="px-2 py-0.5 rounded text-white font-bold text-[10px]"
                >
                  {selectedCategory?.name}
                </span>
                <h4 className="font-bold text-slate-900 truncate">{title}</h4>
              </div>
              <p className="text-slate-600 line-clamp-3 leading-relaxed mt-1">{description}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Titik Lokasi & Koordinat</p>
              <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="truncate">{address}</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                GPS: {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </p>
              <p className="text-slate-500 text-[11px]">Lampiran: {images.length} Foto</p>
            </div>
          </div>
        </Card>
      )}

      {/* Wizard Bottom Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        {currentStep > 1 ? (
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handlePrevStep}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Sebelumnya
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => navigate('/citizen')}
          >
            Batal
          </Button>
        )}

        {currentStep < 5 ? (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleNextStep}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Lanjut
          </Button>
        ) : (
          <Button
            type="button"
            variant="success"
            size="lg"
            isLoading={isSubmitting}
            onClick={() => handleSubmitReport('PROCEEDED')}
            leftIcon={<Send className="w-4 h-4" />}
            className="bg-emerald-600 hover:bg-emerald-700 font-bold shadow-lg"
          >
            Kirim Laporan Sekarang
          </Button>
        )}
      </div>

      {/* Duplicate Report Alert Modal */}
      <DuplicateAlertModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        duplicates={duplicates}
        onMerge={(origId) => {
          setShowDuplicateModal(false);
          handleSubmitReport('MERGED', origId);
        }}
        onProceedAnyway={() => {
          setShowDuplicateModal(false);
          handleSubmitReport('PROCEEDED');
        }}
      />

      {/* INLINE RE-LOGIN MODAL (Preserves all wizard form data & photos) */}
      <Modal
        isOpen={showReloginModal}
        onClose={() => setShowReloginModal(false)}
        title="Konfirmasi Sesi Login Warga"
        maxWidth="md"
      >
        <div className="space-y-5">
          <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs leading-relaxed">
            Tenang! Seluruh data formulir, foto, dan lokasi laporan Anda <strong>tetap tersimpan aman</strong>. Cukup klik tombol di bawah untuk menyegarkan sesi login Anda.
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
            <p className="text-xs font-bold text-slate-800">
              Opsi Cepat: Masuk Akun Warga Aktif
            </p>
            <Button
              type="button"
              variant="success"
              size="md"
              isLoading={isReloggingIn}
              onClick={() => handleQuickRelogin(undefined, 'warga@wargalapor.test')}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold shadow-md"
            >
              Masuk Otomatis & Langsung Kirim Laporan
            </Button>
          </div>

          <div className="relative text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative px-3 bg-white text-[11px] text-slate-400 font-semibold uppercase">
              atau gunakan akun lain
            </span>
          </div>

          <form onSubmit={(e) => handleQuickRelogin(e)} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Email Akun</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={reloginEmail}
                  onChange={(e) => setReloginEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Kata Sandi</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={reloginPassword}
                  onChange={(e) => setReloginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowReloginModal(false)}
              >
                Tutup
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isReloggingIn}
              >
                Login & Kirim
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
