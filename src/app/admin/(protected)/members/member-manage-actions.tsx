"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  blockMemberAction,
  removeMemberAction,
  unblockMemberAction,
  type MemberDecisionState,
} from "./actions";

const initialState: MemberDecisionState = {};

function ConfirmMemberActionButton({
  userId,
  triggerLabel,
  pendingLabel,
  title,
  description,
  action,
}: {
  userId: string;
  triggerLabel: string;
  pendingLabel: string;
  title: string;
  description: string;
  action: (state: MemberDecisionState, formData: FormData) => Promise<MemberDecisionState>;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(action, initialState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>{triggerLabel}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="userId" value={userId} />
          {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton label={triggerLabel} pendingLabel={pendingLabel} variant="destructive" />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function BlockMemberButton({ userId }: { userId: string }) {
  return (
    <ConfirmMemberActionButton
      userId={userId}
      triggerLabel="Block"
      pendingLabel="Blocking..."
      title="Block member"
      description="This member will no longer be able to sign in. If they are the only operable partner of a company, that company - and its properties, service areas, and group tours - will be permanently removed."
      action={blockMemberAction}
    />
  );
}

export function RemoveMemberButton({ userId }: { userId: string }) {
  return (
    <ConfirmMemberActionButton
      userId={userId}
      triggerLabel="Remove"
      pendingLabel="Removing..."
      title="Remove member"
      description="This permanently deletes the member's account. If they are the only partner of a company, that company - and its properties, service areas, and group tours - will be permanently removed too. This cannot be undone."
      action={removeMemberAction}
    />
  );
}

export function UnblockMemberButton({ userId }: { userId: string }) {
  const [state, formAction] = useActionState(unblockMemberAction, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="userId" value={userId} />
      <SubmitButton label="Unblock" pendingLabel="Unblocking..." variant="outline" size="sm" />
      {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}
    </form>
  );
}
