"use client";

import React, { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import CoordinatorApi, { type CoordinatorType } from "@/lib/api/coordinator";
import TraineeAuth, { type TraineeType } from "@/lib/api/trainee";
import useAuthStore from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AssignFilterForm = {
  minAge: string;
  maxAge: string;
  address: string;
  gender: string;
};

const ANY_GENDER = "any";
const DEFAULT_ADDRESS = "addis_ababa";

type Address = { name: string; slug: string };

const addresses: Address[] = [
  { name: "Addis Ababa", slug: "addis_ababa" },
  { name: "Adama", slug: "adama" },
  { name: "Bahir Dar", slug: "bahir_dar" },
  { name: "Hawassa", slug: "hawassa" },
  { name: "Mekelle", slug: "mekelle" },
];

const addressNameBySlug = (slug: string) =>
  addresses.find((a) => a.slug === slug)?.name ?? slug;

const genderOptions: Array<{ value: string; label: string }> = [
  { value: ANY_GENDER, label: "-- (not included)" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const resolveCoordinatorName = (coordinator: CoordinatorType) => {
  const fullName =
    `${coordinator.firstName || ""} ${coordinator.lastName || ""}`.trim();
  return fullName || coordinator.email || "-";
};

const resolveTraineeName = (trainee: TraineeType) => {
  const fullName = `${trainee.firstname || ""} ${trainee.lastname || ""}`.trim();
  return fullName || trainee.username || trainee.email || "-";
};

const resolveTraineeAddress = (trainee: TraineeType) =>
  trainee.address?.name || trainee.address?.slug || trainee.location || "-";

const normalizeAge = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? String(n) : "";
};

const normalizeGender = (value: string) => {
  const trimmed = value.trim();
  return trimmed && trimmed !== ANY_GENDER ? trimmed : "";
};

const initialFilters: AssignFilterForm = {
  minAge: "",
  maxAge: "",
  address: DEFAULT_ADDRESS,
  gender: ANY_GENDER,
};

export function AssignTraineesToCoordinator() {
  const role = useAuthStore((s) => s.role);
  const isCoordinatorRole =
    typeof role === "string" && role.toLowerCase().includes("coordinator");

  const [open, setOpen] = useState(false);
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState("");
  const [filters, setFilters] = useState<AssignFilterForm>(initialFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<AssignFilterForm>(initialFilters);
  const [hasApplied, setHasApplied] = useState(false);

  const addressFilter = appliedFilters.address.trim();

  const queryFilters = useMemo(
    () => ({
      minAge: normalizeAge(appliedFilters.minAge),
      maxAge: normalizeAge(appliedFilters.maxAge),
      address: appliedFilters.address.trim(),
      gender: normalizeGender(appliedFilters.gender),
    }),
    [appliedFilters]
  );

  const {
    data: traineeData,
    isLoading: isTraineeLoading,
    isError: isTraineeError,
  } = TraineeAuth.FilterTraineesToAssign.useQuery(queryFilters, {
    enabled: open && hasApplied,
  });

  const {
    data: coordinatorData,
    isLoading: isCoordinatorLoading,
    isError: isCoordinatorError,
  } = CoordinatorApi.GetList.useQuery({
    enabled: open,
  });

  const coordinators = useMemo(
    () => coordinatorData?.data ?? [],
    [coordinatorData]
  );

  const { mutate: assignCoordinator, isPending: isAssigning } =
    TraineeAuth.AssignCoordinator.useMutation({
      onSuccess: () => {
        handleOpenChange(false);
      },
    });

  const trainees = useMemo(() => traineeData?.data ?? [], [traineeData]);
  const traineeIds = useMemo(
    () => trainees.map((trainee) => trainee._id).filter(Boolean),
    [trainees]
  );
  const totalTrainees = traineeData?.meta?.totalItems ?? trainees.length;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSelectedCoordinatorId("");
      setFilters(initialFilters);
      setAppliedFilters(initialFilters);
      setHasApplied(false);
    }
  };

  const handleApplyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters({
      minAge: filters.minAge,
      maxAge: filters.maxAge,
      address: filters.address.trim(),
      gender: filters.gender,
    });
    setHasApplied(true);
  };

  const handleSubmit = () => {
    if (!selectedCoordinatorId) {
      toast.error("Select a coordinator");
      return;
    }
    if (isTraineeLoading) {
      toast.error("Trainees are still loading");
      return;
    }
    if (traineeIds.length === 0) {
      toast.error("No trainees found for these filters");
      return;
    }

    assignCoordinator({
      coordinatorId: selectedCoordinatorId,
      traineeIds,
    });
  };

  if (isCoordinatorRole) return null;

  return (
    <>
      <Button
        className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-6 font-bold"
        onClick={() => setOpen(true)}
      >
        Assign Coordinator
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[calc(100vh-4rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign trainees</DialogTitle>
            <DialogDescription>
              Confirm trainees from the selected filters, then choose a coordinator.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              Filters: {addressFilter ? addressNameBySlug(addressFilter) : "-"}
              {normalizeGender(appliedFilters.gender)
                ? ` • ${normalizeGender(appliedFilters.gender)}`
                : ""}
              {normalizeAge(appliedFilters.minAge)
                ? ` • min ${normalizeAge(appliedFilters.minAge)}`
                : ""}
              {normalizeAge(appliedFilters.maxAge)
                ? ` • max ${normalizeAge(appliedFilters.maxAge)}`
                : ""}
            </div>

            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={handleApplyFilters}
            >
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">
                  Address
                </label>
                <Select
                  value={filters.address || DEFAULT_ADDRESS}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, address: value }))
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select address" />
                  </SelectTrigger>
                  <SelectContent>
                    {addresses.map((option) => (
                      <SelectItem key={option.slug} value={option.slug}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">
                  Gender
                </label>
                <Select
                  value={filters.gender || ANY_GENDER}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, gender: value }))
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="--" />
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">
                  Min age{" "}
                  <span className="font-normal text-slate-400">
                    (leave empty to skip)
                  </span>
                </label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={filters.minAge}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, minAge: event.target.value }))
                  }
                  placeholder="--"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">
                  Max age{" "}
                  <span className="font-normal text-slate-400">
                    (leave empty to skip)
                  </span>
                </label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={filters.maxAge}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, maxAge: event.target.value }))
                  }
                  placeholder="--"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="sm:col-span-2">
                <Button type="submit" variant="outline" className="rounded-xl">
                  Apply filters
                </Button>
              </div>
            </form>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                Coordinator
              </label>
              <Select
                value={selectedCoordinatorId}
                onValueChange={setSelectedCoordinatorId}
                disabled={isCoordinatorLoading || isCoordinatorError}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue
                    placeholder={
                      isCoordinatorLoading
                        ? "Loading coordinators..."
                        : isCoordinatorError
                          ? "Failed to load coordinators"
                          : "Select coordinator"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {coordinators.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-slate-500">
                      {isCoordinatorLoading
                        ? "Loading..."
                        : isCoordinatorError
                          ? "Unable to load coordinators."
                          : "No coordinators found."}
                    </div>
                  ) : (
                    coordinators.map((coordinator) => (
                      <SelectItem key={coordinator._id} value={coordinator._id}>
                        {resolveCoordinatorName(coordinator)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-700">Trainees</p>
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                  {isTraineeLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" /> Loading...
                    </>
                  ) : (
                    <>
                      {trainees.length} Trainees
                      {totalTrainees && totalTrainees !== trainees.length
                        ? ` of ${totalTrainees}`
                        : ""}
                    </>
                  )}
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isTraineeLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-6 text-center text-sm">
                          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                          Loading trainees...
                        </TableCell>
                      </TableRow>
                    ) : isTraineeError ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-6 text-center text-sm text-red-600"
                        >
                          Failed to load trainees.
                        </TableCell>
                      </TableRow>
                    ) : trainees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-6 text-center text-sm">
                          No trainees found for these filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      trainees.map((trainee) => (
                        <TableRow key={trainee._id}>
                          <TableCell className="font-semibold text-slate-800">
                            {resolveTraineeName(trainee)}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {trainee.email || "-"}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {trainee.phoneNumber || "-"}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {resolveTraineeAddress(trainee)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isTraineeLoading || isAssigning}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isTraineeLoading || isAssigning}
            >
              {isAssigning ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  Assigning
                </span>
              ) : (
                "Assign"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
