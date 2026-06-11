"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";

import CoordinatorApi, { type CoordinatorType } from "@/lib/api/coordinator";
import TraineeAuth, { type TraineeType } from "@/lib/api/trainee";
import Adress from "@/lib/api/adress";
import useAuthStore from "@/store/useAuthStore";
import type { ErrorRes } from "@/types/core";
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
  cityId: string;
  subcityId: string;
  gender: string;
};

type AppliedAddress = { id: string; name: string } | null;

type AppliedFilters = {
  minAge: string;
  maxAge: string;
  city: AppliedAddress;
  subcity: AppliedAddress;
  gender: string;
};

const ANY_GENDER = "any";

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

const initialFormFilters: AssignFilterForm = {
  minAge: "",
  maxAge: "",
  cityId: "",
  subcityId: "",
  gender: ANY_GENDER,
};

const initialAppliedFilters: AppliedFilters = {
  minAge: "",
  maxAge: "",
  city: null,
  subcity: null,
  gender: ANY_GENDER,
};

export function AssignTraineesToCoordinator() {
  const role = useAuthStore((s) => s.role);
  const isCoordinatorRole =
    typeof role === "string" && role.toLowerCase().includes("coordinator");

  const [open, setOpen] = useState(false);
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState("");
  const [filters, setFilters] =
    useState<AssignFilterForm>(initialFormFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<AppliedFilters>(initialAppliedFilters);
  const [hasApplied, setHasApplied] = useState(false);
  const lastTraineeSuccessToastKey = useRef("");

  const { data: cities = [], isLoading: isCitiesLoading } =
    Adress.GetCities.useQuery(open);

  const selectedFormCity = useMemo(
    () => cities.find((c) => c._id === filters.cityId),
    [cities, filters.cityId]
  );
  const formCityHasSubcity = Boolean(selectedFormCity?.hasSubcity);

  const { data: subcities = [], isLoading: isSubcitiesLoading } =
    Adress.GetSubCities.useQuery(
      filters.cityId,
      open && formCityHasSubcity
    );

  const queryFilters = useMemo(() => {
    const params: {
      minAge?: string;
      maxAge?: string;
      city?: string;
      subcity?: string;
      gender?: string;
    } = {};
    const minAge = normalizeAge(appliedFilters.minAge);
    if (minAge) params.minAge = minAge;
    const maxAge = normalizeAge(appliedFilters.maxAge);
    if (maxAge) params.maxAge = maxAge;
    if (appliedFilters.city?.id) params.city = appliedFilters.city.id;
    if (appliedFilters.subcity?.id)
      params.subcity = appliedFilters.subcity.id;
    const gender = normalizeGender(appliedFilters.gender);
    if (gender) params.gender = gender;
    return params;
  }, [appliedFilters]);

  const {
    data: traineeData,
    isLoading: isTraineeLoading,
    isError: isTraineeError,
    error: traineeError,
  } = TraineeAuth.FilterTraineesToAssign.useQuery(queryFilters, {
    enabled: open && hasApplied,
  });

  const {
    data: coordinatorData,
    isLoading: isCoordinatorLoading,
    isError: isCoordinatorError,
    error: coordinatorError,
  } = CoordinatorApi.GetList.useQuery({
    enabled: open,
  });

  const coordinators = useMemo(
    () => coordinatorData?.data ?? [],
    [coordinatorData]
  );

  const { mutate: assignCoordinator, isPending: isAssigning } =
    TraineeAuth.AssignCoordinator.useMutation();

  const trainees = useMemo(() => traineeData?.data ?? [], [traineeData]);
  const traineeIds = useMemo(
    () => trainees.map((trainee) => trainee._id).filter(Boolean),
    [trainees]
  );
  const totalTrainees = traineeData?.meta?.totalItems ?? trainees.length;

  useEffect(() => {
    if (!open || !isCoordinatorError || !coordinatorError) return;
    const ax = coordinatorError as AxiosError<ErrorRes>;
    const msg =
      ax.response?.data?.message?.trim() || "Failed to load coordinators.";
    toast.error(msg, { id: "assign-dialog-coordinators" });
  }, [open, isCoordinatorError, coordinatorError]);

  useEffect(() => {
    if (!open || !hasApplied || !isTraineeError || !traineeError) return;
    const ax = traineeError as AxiosError<ErrorRes>;
    const msg =
      ax.response?.data?.message?.trim() || "Failed to load trainees.";
    toast.error(msg, { id: "assign-dialog-trainees" });
  }, [open, hasApplied, isTraineeError, traineeError]);

  useEffect(() => {
    if (
      !open ||
      !hasApplied ||
      isTraineeLoading ||
      isTraineeError ||
      !traineeData
    ) {
      return;
    }
    const total = traineeData.meta?.totalItems ?? traineeData.data?.length ?? 0;
    const key = `${JSON.stringify(queryFilters)}:${total}`;
    if (lastTraineeSuccessToastKey.current === key) return;
    lastTraineeSuccessToastKey.current = key;
    if (total > 0) {
      toast.success(`Loaded ${total} trainee(s).`, {
        id: "assign-dialog-trainees-success",
      });
    } else {
      toast.message("No trainees match these filters.", {
        id: "assign-dialog-trainees-success",
      });
    }
  }, [
    open,
    hasApplied,
    isTraineeLoading,
    isTraineeError,
    traineeData,
    queryFilters,
  ]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      lastTraineeSuccessToastKey.current = "";
      setSelectedCoordinatorId("");
      setFilters(initialFormFilters);
      setAppliedFilters(initialAppliedFilters);
      setHasApplied(false);
    }
  };

  const handleApplyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const city = cities.find((c) => c._id === filters.cityId);
    const subcity = subcities.find((s) => s._id === filters.subcityId);
    setAppliedFilters({
      minAge: filters.minAge,
      maxAge: filters.maxAge,
      city: city ? { id: city._id, name: city.name } : null,
      subcity:
        city && city.hasSubcity && subcity
          ? { id: subcity._id, name: subcity.name }
          : null,
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

    assignCoordinator(
      {
        coordinatorId: selectedCoordinatorId,
        traineeIds,
      },
      {
        onSuccess: () => handleOpenChange(false),
      }
    );
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
              Filters: {appliedFilters.city?.name ?? "-"}
              {appliedFilters.subcity ? ` • ${appliedFilters.subcity.name}` : ""}
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
                  City
                </label>
                <Select
                  value={filters.cityId}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      cityId: value,
                      subcityId: "",
                    }))
                  }
                  disabled={isCitiesLoading}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue
                      placeholder={
                        isCitiesLoading ? "Loading cities..." : "Select city"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((option) => (
                      <SelectItem key={option._id} value={option._id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formCityHasSubcity && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Subcity
                  </label>
                  <Select
                    value={filters.subcityId}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, subcityId: value }))
                    }
                    disabled={!filters.cityId || isSubcitiesLoading}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue
                        placeholder={
                          isSubcitiesLoading
                            ? "Loading subcities..."
                            : "Select subcity"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {subcities.map((option) => (
                        <SelectItem key={option._id} value={option._id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
