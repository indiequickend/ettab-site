"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { approveMemberAction, rejectMemberAction, type MemberDecisionState } from "./actions";

const initialState: MemberDecisionState = {};

export function MemberRowActions({ userId }: { userId: string }) {
  const [approveState, approveFormAction] = useActionState(approveMemberAction, initialState);
  const [rejectState, rejectFormAction] = useActionState(rejectMemberAction, initialState);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <form action={approveFormAction}>
          <input type="hidden" name="userId" value={userId} />
          <SubmitButton label="Approve" pendingLabel="Approving..." size="sm" />
        </form>

        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogTrigger render={<Button variant="destructive" size="sm" />}>Reject</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject registration</DialogTitle>
              <DialogDescription>
                Optionally add a reason. It will be included in the email sent to the applicant.
              </DialogDescription>
            </DialogHeader>
            <form action={rejectFormAction} className="flex flex-col gap-3">
              <input type="hidden" name="userId" value={userId} />
              <Textarea name="reason" placeholder="Reason (optional)" />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRejectDialogOpen(false)}>
                  Cancel
                </Button>
                <SubmitButton label="Reject" pendingLabel="Rejecting..." variant="destructive" />
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {approveState.formError && (
        <p className="text-sm text-destructive">{approveState.formError}</p>
      )}
      {rejectState.formError && <p className="text-sm text-destructive">{rejectState.formError}</p>}
    </div>
  );
}
