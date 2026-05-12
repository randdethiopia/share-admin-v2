"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, PlusCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import TrainingSessionApi, {
  type TrainingSessionStatus,
  trainingSessionErrorMessage,
} from "@/lib/api/training-session";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";

const SESSION_STATUSES: TrainingSessionStatus[] = [
  "draft",
  "scheduled",
  "completed",
  "cancelled",
];

const createSessionSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required."),
    description: z.string().optional(),
    /** `datetime-local` value — interpreted as the user's local timezone when converted to ISO. */
    scheduledAtLocal: z.string().min(1, "Date and time are required."),
    location: z.string().optional(),
    status: z.enum(SESSION_STATUSES),
  })
  .superRefine((data, ctx) => {
    const parsed = new Date(data.scheduledAtLocal);
    if (Number.isNaN(parsed.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid date and time.",
        path: ["scheduledAtLocal"],
      });
      return;
    }
    if (data.status === "scheduled" && parsed.getTime() < Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Scheduled sessions must have a future date and time.",
        path: ["scheduledAtLocal"],
      });
    }
  });

type CreateSessionFormValues = z.infer<typeof createSessionSchema>;

const defaultForm: CreateSessionFormValues = {
  title: "",
  description: "",
  scheduledAtLocal: "",
  location: "",
  status: "draft",
};

export function CreateSessionModal({
  coordinatorId,
  disabled,
}: {
  coordinatorId?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const form = useForm<CreateSessionFormValues>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: defaultForm,
  });

  const { mutate, isPending } = TrainingSessionApi.Create.useMutation();

  const handleOpenChange = (next: boolean) => {
    if (disabled) return;
    setOpen(next);
    if (next) {
      form.reset(defaultForm);
    }
  };

  const handleCreateTrainingSession = (values: CreateSessionFormValues) => {
    const scheduledAt = new Date(values.scheduledAtLocal).toISOString();
    const description = values.description?.trim();
    const location = values.location?.trim();
    const coordinatorIdTrimmed = coordinatorId?.trim();

    mutate(
      {
        title: values.title.trim(),
        scheduledAt,
        ...(description ? { description } : {}),
        ...(location ? { location } : {}),
        ...(coordinatorIdTrimmed ? { coordinatorId: coordinatorIdTrimmed } : {}),
        status: values.status,
      },
      {
        onSuccess: () => {
          toast.success("Training session created.");
          setOpen(false);
          form.reset(defaultForm);
        },
        onError: (error) => {
          toast.error(
            trainingSessionErrorMessage(
              error,
              "Could not create training session."
            )
          );
        },
      }
    );
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => handleOpenChange(true)}
        variant="outline"
        className="h-11 rounded-xl border-sky-200 bg-white px-5 font-bold text-sky-700 hover:bg-sky-50"
        disabled={disabled}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Schedule New Training
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Schedule New Training
            </DialogTitle>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(handleCreateTrainingSession)}
            noValidate
          >
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#4A5568]">
                Title
              </label>
              <Input
                {...form.register("title")}
                placeholder="Session title"
                className="border-slate-200"
                disabled={isPending}
              />
              {form.formState.errors.title && (
                <p className="text-xs font-medium text-red-500">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#4A5568]">
                Description (optional)
              </label>
              <Textarea
                {...form.register("description")}
                placeholder="Notes, agenda, or links…"
                className="min-h-20 border-slate-200"
                disabled={isPending}
              />
              {form.formState.errors.description && (
                <p className="text-xs font-medium text-red-500">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            {/* Interpreted in the user's local timezone; server receives UTC via toISOString(). */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#4A5568]">
                Scheduled date and time
              </label>
              <Input
                type="datetime-local"
                step={60}
                {...form.register("scheduledAtLocal")}
                className="border-slate-200"
                disabled={isPending}
              />
              {form.formState.errors.scheduledAtLocal && (
                <p className="text-xs font-medium text-red-500">
                  {form.formState.errors.scheduledAtLocal.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4A5568]">
                  Location (optional)
                </label>
                <Input
                  {...form.register("location")}
                  placeholder="Training Hall A"
                  className="border-slate-200"
                  disabled={isPending}
                />
                {form.formState.errors.location && (
                  <p className="text-xs font-medium text-red-500">
                    {form.formState.errors.location.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4A5568]">
                  Status
                </label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(v) => {
                    if (SESSION_STATUSES.includes(v as TrainingSessionStatus)) {
                      form.setValue(
                        "status",
                        v as TrainingSessionStatus,
                        { shouldValidate: true, shouldDirty: true }
                      );
                    }
                  }}
                  disabled={isPending}
                >
                  <SelectTrigger className="border-slate-200 w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.status && (
                  <p className="text-xs font-medium text-red-500">
                    {form.formState.errors.status.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 text-white hover:bg-blue-700"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save session"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
