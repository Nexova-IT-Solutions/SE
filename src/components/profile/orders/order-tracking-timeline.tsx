import { CheckCircle2, Circle } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatOrderStatusLabel } from "@/lib/admin-orders";

type TrackingTimelineItem = {
  id: string;
  status: string;
  note?: string | null;
  createdAt: string | Date;
};

type OrderTrackingTimelineProps = {
  statusHistory: TrackingTimelineItem[];
  currentStatus: string;
  orderCreatedAt: string | Date;
};

const pipeline = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "READY_TO_SHIP", "SHIPPED", "DELIVERED"] as const;

export function OrderTrackingTimeline({ statusHistory, currentStatus, orderCreatedAt }: OrderTrackingTimelineProps) {
  const normalizedCurrentStatus = currentStatus.toUpperCase();
  const isCancelledFlow = normalizedCurrentStatus === "CANCELLED" || normalizedCurrentStatus === "REFUNDED";
  const currentIndex = pipeline.indexOf(normalizedCurrentStatus as (typeof pipeline)[number]);

  const historyMap = new Map<string, TrackingTimelineItem>();
  for (const entry of statusHistory) {
    const key = entry.status.toUpperCase();
    if (!historyMap.has(key)) {
      historyMap.set(key, entry);
    }
  }

  const lastCompletedIndex = Math.max(
    ...pipeline.map((step, index) => (historyMap.has(step) ? index : -1))
  );

  const visiblePipeline = isCancelledFlow && lastCompletedIndex >= 0 ? pipeline.slice(0, lastCompletedIndex + 1) : pipeline;
  const cancelledRecord = historyMap.get("CANCELLED") || historyMap.get("REFUNDED");

  const getFallbackTimestamp = (index: number) => {
    if (index === 0) return orderCreatedAt;

    const searchEnd = currentIndex >= 0 ? currentIndex : lastCompletedIndex;
    if (searchEnd < index) return null;

    for (let i = index; i <= searchEnd; i += 1) {
      const candidate = historyMap.get(pipeline[i]);
      if (candidate?.createdAt) {
        return candidate.createdAt;
      }
    }

    return orderCreatedAt;
  };

  return (
    <div className="relative ml-3 border-l-2 border-gray-200 pl-6">
      <div className="space-y-6">
        {visiblePipeline.map((step, index) => {
          const historyRecord = historyMap.get(step);
          const isPendingStep = step === "PENDING";
          const isCompleted = isPendingStep || Boolean(historyRecord) || (currentIndex >= 0 && index <= currentIndex);
          const isCurrent = normalizedCurrentStatus === step;
          const displayTimestamp = historyRecord?.createdAt || (isCompleted ? getFallbackTimestamp(index) : null);
          const displayNote = historyRecord?.note || (isPendingStep ? "Order placed" : null);

          return (
            <div key={step} className="relative">
              <span className="absolute -left-[35px] top-0 inline-flex size-5 items-center justify-center rounded-full bg-white">
                {isCompleted ? (
                  <CheckCircle2 className="size-5 text-[#A7066A]" />
                ) : (
                  <Circle className="size-4 text-gray-400" />
                )}
              </span>

              <div className="space-y-1 pb-1">
                <p className={cn("text-sm font-semibold", isCompleted || isCurrent ? "text-[#1F1720]" : "text-gray-400")}>
                  {formatOrderStatusLabel(step)}
                </p>
                {displayTimestamp ? <p className="text-xs text-gray-500">{formatDateTime(displayTimestamp)}</p> : null}
                {displayNote ? <p className="text-sm text-gray-600">{displayNote}</p> : null}
              </div>
            </div>
          );
        })}

        {isCancelledFlow ? (
          <div className="relative">
            <span className="absolute -left-[35px] top-0 inline-flex size-5 items-center justify-center rounded-full bg-white">
              <CheckCircle2 className="size-5 text-red-600" />
            </span>
            <div className="space-y-1 pb-1">
              <p className="text-sm font-semibold text-red-600">{normalizedCurrentStatus === "REFUNDED" ? "Refunded" : "Cancelled"}</p>
              {cancelledRecord ? <p className="text-xs text-gray-500">{formatDateTime(cancelledRecord.createdAt)}</p> : null}
              {cancelledRecord?.note ? <p className="text-sm text-gray-600">{cancelledRecord.note}</p> : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatDateTime(value: string | Date) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("en-LK", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
