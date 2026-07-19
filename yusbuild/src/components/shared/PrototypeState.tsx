import { AlertTriangle, CheckCircle2, Lock, Loader2 } from "lucide-react";

interface PrototypeStateProps {
  state: "loading" | "empty" | "error" | "forbidden";
  label: string;
}

const stateIcon = {
  loading: Loader2,
  empty: CheckCircle2,
  error: AlertTriangle,
  forbidden: Lock,
};

export function PrototypeState({ state, label }: PrototypeStateProps) {
  const Icon = stateIcon[state];

  return (
    <div className="flex min-h-24 items-center gap-3 rounded-md border bg-muted/30 p-4">
      <Icon
        className={state === "loading" ? "h-5 w-5 animate-spin" : "h-5 w-5"}
      />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
