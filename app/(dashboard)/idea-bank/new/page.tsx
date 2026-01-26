"use client";

import { useEffect, useRef, type ChangeEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ideaBankSchema, type IdeaBankFormData } from "@/lib/validator";
import IdeaBankApi from "@/api/idea-bank";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Editor from "@/components/shared/Editor"; 
import { Loader2, X } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";

type IdeaBankFormValues = z.input<typeof ideaBankSchema>;

export default function NewIdeaPage() {
  const { mutate: createIdea, isPending } = IdeaBankApi.Create.useMutation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastObjectUrlRef = useRef<string | null>(null);

  const form = useForm<IdeaBankFormValues>({
    resolver: zodResolver(ideaBankSchema),
    defaultValues: {
      title: "",
      source: "",
      tags: "",
      description: "",
      isPublic: false,
      image: { url: "", id: "" },
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

  const onSubmit = (data: IdeaBankFormValues) => {
    createIdea({
      ...(data as IdeaBankFormData),
      isPublic: data.isPublic ?? false,
    });
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const nextUrl = URL.createObjectURL(file);
    if (lastObjectUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(lastObjectUrlRef.current);
    }
    lastObjectUrlRef.current = nextUrl;
    form.setValue("image", { url: nextUrl, id: file.name }, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div className="min-h-screen bg-[#E2EDF8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="p-6 sm:p-8">
            <Link
              href="/idea-bank"
              className="text-blue-600 text-sm font-semibold inline-flex items-center gap-2 hover:underline"
            >
              <ArrowLeft size={16} /> Back
            </Link>

            <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight wrap-break-word">
              New Idea
            </h1>
            <p className="mt-1 text-sm sm:text-base text-slate-600">Write for Idea Bank</p>
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="p-6 sm:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Idea Title */}
            <FormField name="title" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-semibold">Idea Title <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="your title" className="bg-[#F3F8FF] border-none h-12 rounded-xl" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Source */}
            <FormField name="source" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-semibold">Source <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="your title" className="bg-[#F3F8FF] border-none h-12 rounded-xl" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Tags */}
            <FormField name="tags" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-semibold">Tags <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Enter tags" className="bg-[#F3F8FF] border-none h-12 rounded-xl" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Visibility Section */}
            <div className="space-y-3">
              <h3 className="text-gray-800 font-bold text-sm">Do you Want to make this content public?</h3>
              
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

            {/* Content / Editor */}
            <FormField name="description" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-semibold">Content</FormLabel>
                <FormControl>
                  <Editor value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Image Picker Section */}
            <div className="flex items-center gap-6">
              <div className="relative w-40 aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                <img
                  src={imageUrl || "/placeholder.png"}
                  className="object-cover w-full h-full"
                  alt="Preview"
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
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                onClick={handleBrowseClick}
                className="bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl px-8 h-10 shadow-md"
              >
                Browse
              </Button>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <Button type="submit" className="bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl px-10 h-12 font-bold shadow-md" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 animate-spin" /> : null}
                Submit for review
              </Button>
            </div>

              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}