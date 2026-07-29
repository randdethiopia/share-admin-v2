import { Badge } from "@/components/ui/badge";

export function statusToVariant(
  status?: string,
): "success" | "warning" | "pending" | "destructive" | "rejected" | "secondary" {
  const normalized = (status ?? "").trim().toLowerCase();

  if (normalized.includes("accept") || normalized.includes("hire")) {
    return "success";
  }
  if (normalized.includes("reject")) {
    return "rejected";
  }

  switch ((status ?? "").trim().toUpperCase()) {
    case "APPROVED":
      return "success";
    case "REJECTED":
      return "rejected";
    case "PENDING":
      return "pending";
    case "DRAFT":
      return "secondary";
    default:
      return "pending";
  }
}

type StatusBadgeProps = {
  status?: string;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = (status ?? "PENDING").trim().toUpperCase() || "PENDING";

  return (
    <Badge variant={statusToVariant(status)} className={className}>
      {label}
    </Badge>
  );
}
