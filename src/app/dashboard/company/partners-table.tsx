"use client";

import { useActionState, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  removePartnerAction,
  revokeInviteAction,
  updatePartnerContactAction,
  type CompanyActionState,
} from "./actions";

export interface PartnerRow {
  id: string;
  userId: string;
  personName: string;
  personPhone: string;
  roleInCompany: "owner" | "partner";
}

export interface InviteRow {
  id: string;
  email: string;
  createdAt: string;
  expiresAt: string;
}

const initialState: CompanyActionState = {};

function EditContactDialog({ partner }: { partner: PartnerRow }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(updatePartnerContactAction, initialState);

  useEffect(() => {
    if (state !== initialState && !state.formError && !state.fieldErrors) {
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>Edit my info</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit my contact info</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="partnerId" value={partner.id} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="personName">Name</Label>
            <Input id="personName" name="personName" defaultValue={partner.personName} required />
            {state.fieldErrors?.personName && (
              <p className="text-sm text-destructive">{state.fieldErrors.personName[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="personPhone">Phone</Label>
            <Input
              id="personPhone"
              name="personPhone"
              type="tel"
              defaultValue={partner.personPhone}
              required
            />
            {state.fieldErrors?.personPhone && (
              <p className="text-sm text-destructive">{state.fieldErrors.personPhone[0]}</p>
            )}
          </div>

          {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton label="Save" pendingLabel="Saving..." />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RemovePartnerButton({ partnerId }: { partnerId: string }) {
  const [state, formAction] = useActionState(removePartnerAction, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="partnerId" value={partnerId} />
      <SubmitButton label="Remove" pendingLabel="Removing..." variant="destructive" size="sm" />
      {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}
    </form>
  );
}

export function PartnersTable({
  partners,
  currentUserId,
}: {
  partners: PartnerRow[];
  currentUserId: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {partners.map((partner) => {
            const isSelf = partner.userId === currentUserId;
            return (
              <TableRow key={partner.id}>
                <TableCell>{partner.personName}</TableCell>
                <TableCell>{partner.personPhone}</TableCell>
                <TableCell>
                  <Badge variant={partner.roleInCompany === "owner" ? "default" : "secondary"}>
                    {partner.roleInCompany}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {isSelf ? (
                    <EditContactDialog partner={partner} />
                  ) : (
                    <RemovePartnerButton partnerId={partner.id} />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function RevokeInviteButton({ inviteId }: { inviteId: string }) {
  const [state, formAction] = useActionState(revokeInviteAction, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="inviteId" value={inviteId} />
      <SubmitButton label="Revoke" pendingLabel="Revoking..." variant="destructive" size="sm" />
      {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}
    </form>
  );
}

export function PendingInvitesTable({ invites }: { invites: InviteRow[] }) {
  if (invites.length === 0) {
    return <p className="text-sm text-muted-foreground">No pending invites.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Invited</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invites.map((invite) => (
            <TableRow key={invite.id}>
              <TableCell>{invite.email}</TableCell>
              <TableCell>{invite.createdAt}</TableCell>
              <TableCell>{invite.expiresAt}</TableCell>
              <TableCell className="text-right">
                <RevokeInviteButton inviteId={invite.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
