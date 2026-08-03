import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineLoader } from "./Loaders";
import { buttonVariants } from "@/components/ui/button.variants";
import { cn } from "@/lib/utils";

/**
 * Confirmation dialog for consequential actions.
 *
 * Needed across every domain: submit, revise, approve, reject, certify, lock,
 * delete. Without a shared one each team builds their own, and the wording and
 * safeguards drift.
 */
export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  /** Disables the buttons and shows a spinner while the mutation runs. */
  isPending?: boolean;
  onConfirm: () => void | Promise<void>;
  /**
   * Require the user to type this string before confirming. Reserve it for
   * genuinely irreversible operations — locking a certification package, say —
   * because it is friction by design.
   */
  requireTypedConfirmation?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isPending = false,
  onConfirm,
  requireTypedConfirmation,
}: ConfirmDialogProps) {
  const [typed, setTyped] = React.useState("");
  const inputId = React.useId();

  // Reset the challenge whenever the dialog reopens, so a previous attempt
  // cannot leave it pre-satisfied.
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setTyped("");
  }

  const challengeMet =
    !requireTypedConfirmation || typed.trim() === requireTypedConfirmation;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        {requireTypedConfirmation ? (
          <div className="space-y-2">
            <Label htmlFor={inputId} className="text-body font-normal">
              Type{" "}
              <span className="font-mono font-medium text-foreground">
                {requireTypedConfirmation}
              </span>{" "}
              to confirm
            </Label>
            <Input
              id={inputId}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
            />
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            // Not auto-closed: the caller closes on success, so a failed
            // mutation leaves the dialog open with its error rather than
            // vanishing and losing the context.
            onClick={(event) => {
              event.preventDefault();
              void onConfirm();
            }}
            disabled={isPending || !challengeMet}
            className={cn(
              variant === "destructive" &&
                buttonVariants({ variant: "destructive" }),
            )}
          >
            {isPending ? <InlineLoader label={confirmLabel} /> : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
