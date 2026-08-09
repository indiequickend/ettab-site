import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { connectToDatabase } from "@/lib/mongodb";
import { PERMISSION_LABELS, hasPermission, requireAnyPermission } from "@/lib/permissions";
import { Role, User } from "@/models";
import { RoleDialog } from "./role-dialog";
import { AssignRolesDialog } from "./assign-roles-dialog";
import { DeleteRoleButton } from "./delete-role-button";

export default async function AdminRolesPage() {
  const { permissions } = await requireAnyPermission(["roles.manage", "roles.assign"]);
  const canManageRoles = hasPermission(permissions, "roles.manage");
  await connectToDatabase();

  const [roles, approvedUsers] = await Promise.all([
    Role.find().sort({ name: 1 }).lean(),
    User.find({ status: "approved" }).sort({ name: 1 }).lean(),
  ]);

  const roleOptions = roles.map((role) => ({ id: role._id.toString(), name: role.name }));

  const rolesTable = (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <RoleDialog />
      </div>
      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role._id.toString()}>
                <TableCell>
                  {role.name}
                  {role.isSystem && (
                    <Badge variant="outline" className="ml-2">
                      System
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.map((permission) => (
                      <Badge key={permission} variant="secondary">
                        {permission === "*"
                          ? "All permissions"
                          : (PERMISSION_LABELS as Record<string, string>)[permission] ?? permission}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <RoleDialog
                      key={role.permissions.join(",")}
                      role={{
                        id: role._id.toString(),
                        name: role.name,
                        permissions: role.permissions,
                        isSystem: role.isSystem,
                      }}
                    />
                    <DeleteRoleButton roleId={role._id.toString()} isSystem={role.isSystem} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const assignTable = (
    <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {approvedUsers.map((user) => {
            const userRoleIds = user.roleIds.map((id) => id.toString());
            const userRoleNames = roleOptions.filter((role) => userRoleIds.includes(role.id));
            return (
              <TableRow key={user._id.toString()}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {userRoleNames.map((role) => (
                      <Badge key={role.id} variant="secondary">
                        {role.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <AssignRolesDialog
                    key={userRoleIds.join(",")}
                    user={{ id: user._id.toString(), name: user.name, roleIds: userRoleIds }}
                    roles={roleOptions}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Roles</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create and edit roles, and assign them to members.
        </p>
      </div>

      {canManageRoles ? (
        <Tabs defaultValue="roles">
          <TabsList>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="assign">Assign Roles</TabsTrigger>
          </TabsList>

          <TabsContent value="roles">{rolesTable}</TabsContent>
          <TabsContent value="assign">{assignTable}</TabsContent>
        </Tabs>
      ) : (
        assignTable
      )}
    </div>
  );
}
