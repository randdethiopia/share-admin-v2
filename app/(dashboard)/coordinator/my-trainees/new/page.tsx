"use client";

import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewCoordinatorTraineePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-black">
            New Trainee
          </h1>
          <p className="font-medium text-zinc-500">
            Add trainee details.
          </p>
        </div>

        <Button asChild variant="outline" className="h-10 rounded-xl">
          <Link href="/coordinator/my-trainees">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </Button>
      </div>

      <div className="rounded-[2.5rem] border border-blue-50 bg-white p-4 shadow-sm sm:p-6 lg:p-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input placeholder="Full name" />
          <Input placeholder="Phone number" />
          <Input type="email" placeholder="Email address" />
        </div>

        <div className="mt-6 flex justify-end">
          <Button className="h-10 rounded-xl bg-[#3B82F6] px-5 font-bold text-white hover:bg-blue-600">
            <Save className="mr-2 h-4 w-4" /> Save Trainee
          </Button>
        </div>
      </div>
    </div>
  );
}
