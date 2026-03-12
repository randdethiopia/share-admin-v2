"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";


const createSessionSchema = z.object({
    date: z.string().min(1, "Date is required."),
    startTime: z.string().min(1, "Start time is required."),
    endTime: z.string().min(1, "End time is required."),
    coordinatorId: z.string().min(1, "Coordinator ID is required."),
    location: z.string().min(1, "Location is required."),
  })

type CreateSessionFormValues = z.infer<typeof createSessionSchema>;


export const CreateSessionModal  = () => {
  const [open, setOpen] = useState(false);

  const createSessionForm = useForm<CreateSessionFormValues>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      date: "",
      startTime: "",
      endTime: "",
      location: "",
    },
  });

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (open) {
      createSessionForm.reset({
        date: "",
        startTime: "",
        endTime: "",
        location: "",
      });
    }
  };

  const handleCreateTrainingSession = (values: CreateSessionFormValues) => {
    console.log("training session values:", values);
    toast.success("Session created successfully.");
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => handleOpenChange(true)}
        variant="outline"
        className="h-11 rounded-xl border-sky-200 bg-white px-5 font-bold text-sky-700 hover:bg-sky-50"
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
            onSubmit={createSessionForm.handleSubmit(handleCreateTrainingSession)}
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4A5568]">
                  Date
                </label>
                <Input type="date" {...createSessionForm.register("date")} />
                {createSessionForm.formState.errors.date && (
                  <p className="text-xs font-medium text-red-500">
                    {createSessionForm.formState.errors.date.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4A5568]">
                  Location
                </label>
                <Input
                  {...createSessionForm.register("location")}
                  placeholder="Training Hall A"
                  className="border-slate-200"
                />
                {createSessionForm.formState.errors.location && (
                  <p className="text-xs font-medium text-red-500">
                    {createSessionForm.formState.errors.location.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4A5568]">
                  Start Time
                </label>
                <Input
                  type="time"
                  step="60"
                  {...createSessionForm.register("startTime")}
                  className="border-slate-200"
                />
                {createSessionForm.formState.errors.startTime && (
                  <p className="text-xs font-medium text-red-500">
                    {createSessionForm.formState.errors.startTime.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#4A5568]">
                  End Time
                </label>
                <Input
                  type="time"
                  step="60"
                  {...createSessionForm.register("endTime")}
                  className="border-slate-200"
                />
                {createSessionForm.formState.errors.endTime && (
                  <p className="text-xs font-medium text-red-500">
                    {createSessionForm.formState.errors.endTime.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Save Session
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
