"use client";

import { useFormStatus } from "react-dom";

import { Button, type buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

interface SubmitButtonProps extends VariantProps<typeof buttonVariants> {
  label: string;
  pendingLabel: string;
  className?: string;
}

export function SubmitButton({ label, pendingLabel, variant, size, className }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant={variant} size={size} className={className}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
