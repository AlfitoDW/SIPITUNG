"use client"

import {
  ChevronRight,
  CheckCircle2,
  CircleDot,
  Clock,
  Unlock,
  XCircle,
  UserCircle2,
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  buildTimeline,
  fmtDateTime,
  stateMeta,
  type PermohonanDanaData,
} from "@/lib/permohonan-dana-timeline"

// ── StatusIcon ───────────────────────────────────────────────────────────────

function StatusIcon({ state }: { state: keyof typeof stateMeta }) {
  const Icon = stateMeta[state].icon
  return <Icon className="size-3.5" />
}

// ── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ state }: { state: keyof typeof stateMeta }) {
  const variants: Record<keyof typeof stateMeta, string> = {
    done: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
    rejected: "bg-red-50 text-red-700 border-red-200 hover:bg-red-50",
    active: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
    pending: "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-50",
    buka_kunci: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50",
  }

  const labels: Record<keyof typeof stateMeta, string> = {
    done: "Selesai",
    rejected: "Revisi",
    active: "Proses",
    pending: "Menunggu",
    buka_kunci: "Dibuka",
  }

  return (
    <Badge variant="outline" className={cn("text-[10px] font-medium", variants[state])}>
      {labels[state]}
    </Badge>
  )
}

// ── TimelineDot ────────────────────────────────────────────────────────────────

function TimelineDot({ state }: { state: keyof typeof stateMeta }) {
  const colors = {
    done: "bg-emerald-500 border-emerald-500",
    rejected: "bg-red-500 border-red-500",
    active: "bg-blue-500 border-blue-500 ring-4 ring-blue-200",
    pending: "bg-white border-gray-300",
    buka_kunci: "bg-orange-500 border-orange-500",
  }

  return (
    <div
      className={cn(
        "relative z-10 flex size-5 items-center justify-center rounded-full border-2 transition-all",
        colors[state]
      )}
    >
      <div
        className={cn(
          "size-2 rounded-full",
          state === "pending" ? "bg-gray-300" : "bg-white"
        )}
      />
    </div>
  )
}

// ── TimelineStepCard ─────────────────────────────────────────────────────────

function TimelineStepCard({
  step,
  isLeft,
}: {
  step: ReturnType<typeof buildTimeline>[number]
  isLeft: boolean
}) {
  const meta = stateMeta[step.state]
  const dt = fmtDateTime(step.ts)

  return (
    <div
      className={cn(
        "relative flex flex-1",
        isLeft ? "justify-end pr-8" : "justify-start pl-8"
      )}
    >
      <div
        className={cn(
          "max-w-[280px] rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md",
          meta.border
        )}
      >
        {/* Header: Date + Status */}
        <div className="flex items-center justify-between gap-2 mb-2">
          {dt && (
            <time className="text-[11px] font-medium text-muted-foreground">
              {dt.date}
            </time>
          )}
          <StatusBadge state={step.state} />
        </div>

        {/* Role */}
        <div className="mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {step.role}
          </span>
        </div>

        {/* Action */}
        <h4 className="text-sm font-semibold text-foreground mb-2">
          {step.action}
        </h4>

        {/* Actor */}
        {step.actorName && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserCircle2 className="size-3.5 shrink-0" />
            <span className="font-medium text-foreground/80">{step.actorName}</span>
          </div>
        )}

        {/* Catatan (expandable) */}
        {step.catatan && (
          <Collapsible defaultOpen={step.state === "rejected"} className="mt-3">
            <CollapsibleTrigger className="flex w-full items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors group/collapsible">
              <ChevronRight className="size-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              <span className="font-medium">
                {step.state === "rejected"
                  ? "Alasan revisi"
                  : step.state === "buka_kunci"
                    ? "Alasan pembukaan"
                    : "Catatan"}
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className="mt-2 text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2 leading-relaxed border border-border/50">
                {step.catatan}
              </p>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  )
}

// ── ApprovalTimeline ─────────────────────────────────────────────────────────

interface ApprovalTimelineProps {
  pd: PermohonanDanaData | null
  open: boolean
  onClose: () => void
}

export default function ApprovalTimeline({
  pd,
  open,
  onClose,
}: ApprovalTimelineProps) {
  if (!pd) return null
  const steps = buildTimeline(pd)
  const doneCount = steps.filter((s) => s.state === "done").length
  const pct = Math.round((doneCount / steps.length) * 100)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b bg-card">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <DialogTitle className="text-base font-semibold truncate">
                {pd.nomor_permohonan}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {pd.status_label}
              </DialogDescription>
            </div>
          </div>

          {/* Progress */}
          <div className="pt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Progress</span>
              <span>
                {doneCount} dari {steps.length} langkah
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </DialogHeader>

        {/* Timeline Body */}
        <div className="px-4 py-6 max-h-[60vh] overflow-y-auto bg-gradient-to-b from-background to-muted/20">
          <div className="relative">
            {/* Center Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />

            {/* Steps */}
            <div className="space-y-8">
              {steps.map((step, idx) => {
                const isLeft = idx % 2 === 0

                return (
                  <div
                    key={step.key}
                    className="relative flex items-center"
                  >
                    {isLeft ? (
                      <>
                        <TimelineStepCard step={step} isLeft={true} />
                        <div className="flex-shrink-0 mx-0">
                          <TimelineDot state={step.state} />
                        </div>
                        <div className="flex-1" />
                      </>
                    ) : (
                      <>
                        <div className="flex-1" />
                        <div className="flex-shrink-0 mx-0">
                          <TimelineDot state={step.state} />
                        </div>
                        <TimelineStepCard step={step} isLeft={false} />
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
