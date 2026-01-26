"use client";

import { useEffect, useRef, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { opportunitySchema, type OpportunityFormData } from "@/lib/validator";
import OpportunityApi from "@/api/opportunity";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Editor from "@/components/shared/Editor";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

type OpportunityFormValues = z.input<typeof opportunitySchema>;

export default function NewOpportunityPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastObjectUrlRef = useRef<string | null>(null);

  const { mutate: createOp, isPending } = OpportunityApi.Create.useMutation({
    onSuccess: () => {
      toast.success("Opportunity created!");
      router.push("/opportunity");
    }
  });

  
  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      title: "", organizationName: "", isPublic: false,
      description: "", externalLink: "", deadlineDate: "",
      tags: "", image: { url: "", id: "" },
    },
  });

  const image = useWatch({ control: form.control, name: "image" });
  const imageUrl = image?.url;

  useEffect(() => {
    return () => {
      if (lastObjectUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(lastObjectUrlRef.current);
      }
    };
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const nextUrl = URL.createObjectURL(file);
    if (lastObjectUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(lastObjectUrlRef.current);
    }
    lastObjectUrlRef.current = nextUrl;

    form.setValue(
      "image",
      { url: nextUrl, id: file.name },
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const onSubmit = (data: OpportunityFormValues) => {
    createOp({
      ...(data as OpportunityFormData),
      deadlineDate: data.deadlineDate ?? "",
      isPublic: data.isPublic ?? false,
    });
  };

  return (
    <div className="min-h-screen bg-[#E2EDF8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="p-6 sm:p-8">
            <Link
              href="/opportunity"
              className="text-blue-600 text-sm font-semibold inline-flex items-center gap-2 hover:underline"
            >
              <ArrowLeft size={16} /> Back
            </Link>

            <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight wrap-break-word">
              New Opportunity
            </h1>
            <p className="mt-1 text-sm sm:text-base text-slate-600">Create a new opportunity post</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="p-6 sm:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <FormField name="title" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-gray-700 text-sm">Opportunity Title <span className="text-red-500">*</span></FormLabel>
                <FormControl><Input placeholder="Enter opportunity title" className="bg-[#F3F8FF] border-none h-12 rounded-xl" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField name="organizationName" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-gray-700 text-sm">Organization Name <span className="text-red-500">*</span></FormLabel>
                <FormControl><Input placeholder="Enter organization name" className="bg-[#F3F8FF] border-none h-12 rounded-xl" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="space-y-3">
              <h3 className="text-gray-800 font-bold text-sm">Do you Want to make this content public?</h3>
              <p className="text-gray-500 text-[12px] leading-relaxed">
                If you make this content public, the content will be Published on the <span className="underline">https://share.com.et/</span>. Else it will be only published on <span className="underline">https://adviser.share.com.et/</span>.
              </p>
              <FormField name="isPublic" control={form.control} render={({ field }) => (
                <div className="flex items-center gap-3 mt-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <label className="text-gray-500 text-sm font-medium">Make it Public</label>
                </div>
              )} />
            </div>

            <FormField name="description" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-gray-700 text-sm">Content</FormLabel>
                <FormControl><Editor value={field.value} onChange={field.onChange} /></FormControl>
              </FormItem>
            )} />

            <FormField name="externalLink" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-gray-700 text-sm">External Link <span className="text-red-500">*</span></FormLabel>
                <FormControl><Input placeholder="Enter external link (optional)" className="bg-[#F3F8FF] border-none h-12 rounded-xl" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField name="deadlineDate" control={form.control} render={({ field }) => (
                <FormItem>
                    <FormLabel className="font-semibold text-gray-700 text-sm">Deadline Date</FormLabel>
                    <FormControl><Input type="date" className="bg-[#F3F8FF] border-none h-12 rounded-xl text-gray-500" {...field} /></FormControl>
                </FormItem>
                )} />
            </div>

            <FormField name="tags" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-gray-700 text-sm">Tags <span className="text-red-500">*</span></FormLabel>
                <FormControl><Input placeholder="Enter tags" className="bg-[#F3F8FF] border-none h-12 rounded-xl" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* IMAGE SECTION */}
            <div className="flex items-center gap-6">
              <div className="relative w-40 aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                <img
                  src={imageUrl || "/placeholder.png"}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                {imageUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (lastObjectUrlRef.current?.startsWith("blob:")) {
                        URL.revokeObjectURL(lastObjectUrlRef.current);
                      }
                      lastObjectUrlRef.current = null;
                      form.setValue(
                        "image",
                        { url: "", id: "" },
                        { shouldDirty: true, shouldValidate: true }
                      );
                    }}
                    className="absolute top-2 left-2 bg-white rounded-lg shadow-sm p-1"
                    aria-label="Remove image"
                  >
                    <X size={14} className="text-red-500" />
                  </button>
                ) : null}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="image/*"
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl h-10 px-8 shadow-md"
              >
                Browse
              </Button>
            </div>

            <Button type="submit" className="bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl px-12 h-12 font-bold shadow-md" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit for review
            </Button>

              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}