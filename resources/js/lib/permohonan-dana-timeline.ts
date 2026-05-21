import {
  CheckCircle2,
  CircleDot,
  Clock,
  Unlock,
  XCircle,
  type LucideIcon,
} from "lucide-react"

// ── Types ────────────────────────────────────────────────────────────────────

export interface TimelineStep {
  key: string
  stepNo: number
  role: string
  action: string
  actorName: string | null
  ts: string | null
  catatan: string | null
  state: "done" | "rejected" | "active" | "pending" | "buka_kunci"
}

export interface PermohonanDanaData {
  nomor_permohonan: string
  status: string
  status_label: string
  created_by_name?: string | null
  created_at?: string
  submitted_at: string | null
  katim_approved_by_name: string | null
  katim_approved_at: string | null
  catatan_katim?: string | null
  kabag_approved_by_name: string | null
  kabag_approved_at: string | null
  catatan_kabag?: string | null
  ppk_approved_by_name: string | null
  ppk_approved_at: string | null
  catatan_ppk?: string | null
  pic_approved_by_name: string | null
  pic_approved_at: string | null
  catatan_pic?: string | null
  dicairkan_by_name: string | null
  dicairkan_at: string | null
  catatan_pencairan?: string | null
  rejected_at_step: string | null
  dibuka_kunci_by_name?: string | null
  dibuka_kunci_at?: string | null
  alasan_pembukaan_kunci?: string | null
}

// ── State helpers ────────────────────────────────────────────────────────────

export const stateMeta: Record<
  TimelineStep["state"],
  { icon: LucideIcon; border: string; iconColor: string; dotColor: string }
> = {
  done: {
    icon: CheckCircle2,
    border: "border-l-emerald-500",
    iconColor: "text-emerald-600",
    dotColor: "#10b981",
  },
  rejected: {
    icon: XCircle,
    border: "border-l-red-500",
    iconColor: "text-red-600",
    dotColor: "#ef4444",
  },
  active: {
    icon: CircleDot,
    border: "border-l-blue-500",
    iconColor: "text-blue-600",
    dotColor: "#3b82f6",
  },
  pending: {
    icon: Clock,
    border: "border-l-gray-200",
    iconColor: "text-gray-400",
    dotColor: "#e5e7eb",
  },
  buka_kunci: {
    icon: Unlock,
    border: "border-l-orange-500",
    iconColor: "text-orange-600",
    dotColor: "#f97316",
  },
}

// ── buildTimeline ────────────────────────────────────────────────────────────

export function buildTimeline(pd: PermohonanDanaData): TimelineStep[] {
  const isRej = pd.status === "rejected"
  const rejStep = pd.rejected_at_step ?? ""
  const isBukaKunci = rejStep === "dibuka_kunci"

  const steps: TimelineStep[] = [
    {
      key: "dibuat",
      stepNo: 1,
      role: "PUMK",
      action: "Permohonan Dibuat",
      actorName: pd.created_by_name ?? null,
      ts: pd.created_at ?? null,
      catatan: null,
      state: "done",
    },
    {
      key: "submitted",
      stepNo: 2,
      role: "PUMK",
      action: "Diajukan ke KA.TIM",
      actorName: pd.created_by_name ?? null,
      ts: pd.submitted_at,
      catatan: null,
      state: pd.submitted_at ? "done" : "pending",
    },
    {
      key: "katim",
      stepNo: 3,
      role: "KA.TIM",
      action: isRej && rejStep === "katim" ? "Revisi" : "Disetujui",
      actorName: pd.katim_approved_by_name,
      ts: pd.katim_approved_at,
      catatan: pd.catatan_katim ?? null,
      state:
        isRej && rejStep === "katim"
          ? "rejected"
          : pd.katim_approved_at
            ? "done"
            : pd.status === "submitted"
              ? "active"
              : "pending",
    },
    {
      key: "kabag",
      stepNo: 4,
      role: "Kabag Umum",
      action: isRej && rejStep === "kabag" ? "Revisi" : "Disetujui",
      actorName: pd.kabag_approved_by_name,
      ts: pd.kabag_approved_at,
      catatan: pd.catatan_kabag ?? null,
      state:
        isRej && rejStep === "kabag"
          ? "rejected"
          : pd.kabag_approved_at
            ? "done"
            : pd.status === "katim_approved"
              ? "active"
              : "pending",
    },
    {
      key: "ppk",
      stepNo: 5,
      role: "PPK",
      action: isRej && rejStep === "ppk" ? "Revisi" : "Disetujui",
      actorName: pd.ppk_approved_by_name,
      ts: pd.ppk_approved_at,
      catatan: pd.catatan_ppk ?? null,
      state:
        isRej && rejStep === "ppk"
          ? "rejected"
          : pd.ppk_approved_at
            ? "done"
            : pd.status === "kabag_approved"
              ? "active"
              : "pending",
    },
    {
      key: "pic",
      stepNo: 6,
      role: "PIC Keuangan",
      action: isRej && rejStep === "pic" ? "Revisi" : "Diverifikasi",
      actorName: pd.pic_approved_by_name,
      ts: pd.pic_approved_at,
      catatan: pd.catatan_pic ?? null,
      state:
        isRej && rejStep === "pic"
          ? "rejected"
          : pd.pic_approved_at
            ? "done"
            : pd.status === "ppk_approved"
              ? "active"
              : "pending",
    },
    {
      key: "cair",
      stepNo: 7,
      role: "Bendahara",
      action: isRej && rejStep === "bendahara" ? "Revisi" : "Dana Dicairkan",
      actorName: pd.dicairkan_by_name,
      ts: pd.dicairkan_at,
      catatan: pd.catatan_pencairan ?? null,
      state:
        isRej && rejStep === "bendahara"
          ? "rejected"
          : pd.dicairkan_at
            ? "done"
            : pd.status === "pic_approved"
              ? "active"
              : "pending",
    },
  ]

  if (isBukaKunci) {
    steps.push({
      key: "buka_kunci",
      stepNo: 8,
      role: "Admin",
      action: "Dibuka Kunci",
      actorName: pd.dibuka_kunci_by_name ?? null,
      ts: pd.dibuka_kunci_at ?? null,
      catatan: pd.alasan_pembukaan_kunci ?? null,
      state: "buka_kunci",
    })
  }

  return steps
}

// ── Date formatter (shared) ────────────────────────────────────────────────

export function fmtDateTime(s: string | null): { date: string; time: string } | null {
  if (!s) return null
  const d = new Date(s)
  return {
    date: d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
  }
}
