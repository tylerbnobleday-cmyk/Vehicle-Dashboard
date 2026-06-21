import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  let colorClass = "bg-muted text-muted-foreground";

  const s = status.toUpperCase();

  if (['OK', 'COMPLETED', 'EXCELLENT', 'GOOD'].includes(s)) {
    colorClass = "bg-green-500/20 text-green-500 border-green-500/30";
  } else if (['DUE SOON', 'MEDIUM', 'IN PROGRESS', 'FAIR'].includes(s)) {
    colorClass = "bg-amber-500/20 text-amber-500 border-amber-500/30";
  } else if (['OVERDUE', 'CRITICAL', 'POOR', 'REPLACE'].includes(s)) {
    colorClass = "bg-red-500/20 text-red-500 border-red-500/30";
  } else if (['HIGH', 'BOOKED'].includes(s)) {
    colorClass = "bg-orange-500/20 text-orange-500 border-orange-500/30";
  } else if (['WAITING FOR PARTS'].includes(s)) {
    colorClass = "bg-blue-500/20 text-blue-500 border-blue-500/30";
  }

  return (
    <Badge variant="outline" className={cn("font-bold tracking-wider uppercase text-[10px] px-2 py-0.5", colorClass, className)}>
      {status}
    </Badge>
  );
}
