import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/api";
import type { Role } from "@/lib/api/access";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

interface AssignTarget {
  id: string;
  name: string;
  phoneNumber: string;
};

interface AssignRoleModalProps {
  open: boolean;
  admin: AssignTarget | null;
  onOpenChange: (open: boolean) => void;
};

const AssignRoleModal: React.FC<AssignRoleModalProps> = ({ open, admin, onOpenChange }) => {
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const { mutate: assignRole, isPending: roleAssigning } =
    api.Access.assignRole.useMutation();
  const { data: rolesData, isLoading: isRolesLoading } =
    api.Access.getRoles.useQuery();
  const roles: Role[] = rolesData?.roles ?? [];

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedRoleIds([]);
    }
    onOpenChange(nextOpen);
  };

  const toggleRoleSelection = (roleId: string, checked: boolean) => {
    setSelectedRoleIds((prev) => {
      if (checked) return Array.from(new Set([...prev, roleId]));
      return prev.filter((id) => id !== roleId);
    });
  };

  const handleAssignRoleSubmit = () => {
    if (!admin) return;
    if (selectedRoleIds.length === 0) {
      toast.error("Please select at least one role");
      return;
    }

    assignRole(
      {
        userId: admin.id,
        roleIds: selectedRoleIds,
      },
      {
        onSuccess: () => {
          toast.success("Roles assigned successfully");
          setSelectedRoleIds([]);
          onOpenChange(false);
        },
        onError: () => {
          toast.error("Failed to assign roles");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Role</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm">
            <p className="font-semibold text-slate-800">
              {admin?.name || "-"}
            </p>
            <p className="text-slate-600">{admin?.phoneNumber || "-"}</p>
          </div>

          <div className="space-y-2">
            <label className="pl-2 text-sm font-bold text-gray-700">Roles</label>
            <div className="max-h-52 space-y-2 overflow-y-auto rounded-xl border border-gray-200 bg-white p-3">
              {isRolesLoading ? (
                <div className="flex items-center justify-center">
                  <Spinner />
                  <p className="text-sm text-gray-500">Loading roles...</p>
                </div>
              ) : roles.length === 0 ? (
                <p className="text-sm text-gray-500">No roles found.</p>
              ) : (
                roles.map((role) => (
                  <label
                    key={role._id}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <Checkbox
                      checked={selectedRoleIds.includes(role._id)}
                      onCheckedChange={(checked) =>
                        toggleRoleSelection(role._id, checked === true)
                      }
                      disabled={roleAssigning}
                    />
                    <span>{role.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={roleAssigning}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAssignRoleSubmit}
            disabled={roleAssigning || isRolesLoading || !admin}
          >
            {roleAssigning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignRoleModal;
