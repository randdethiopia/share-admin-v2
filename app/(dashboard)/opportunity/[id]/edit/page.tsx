"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { opportunitySchema, type OpportunityFormData } from "@/lib/validator";
import OpportunityApi from "@/lib/api/opportunity";
import Link from "next/link";
import { uploadFileFn } from "@/lib/api/upload";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Editor from "@/components/shared/Editor";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { DetailPageSkeleton } from "@/components/shared/page-skeletons";

function getUpdateErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const maybe = err as { message?: string; response?: { data?: { message?: string } } };
    return maybe.response?.data?.message || maybe.message || "Not updated";
  }
  return "Not updated";
}

function safeUrl(value?: string | null): string {
  if (!value) return "";
  try { new URL(value); return value; } catch { return ""; }
}

function coerceTags(tags: unknown): string {
  if (!tags) return "";
  if (Array.isArray(tags)) return tags.join(", ");
  return String(tags);
}

export default function EditOpportunityPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const updateToastIdRef = useRef<string | number | null>(null);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingFileRef = useRef<File | null>(null);
  const lastObjectUrlRef = useRef<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: opportunities, isLoading } = OpportunityApi.GetList.useQuery();
  const item = opportunities?.find((op) => op._id === id);

  const { mutate: updateOp, isPending: isUpdating } = OpportunityApi.Update.useMutation(id, {
    onMutate: () => {
      updateToastIdRef.current = toast.loading("Updating...");
    },
    onSuccess: () => {
      if (updateToastIdRef.current !== null) toast.dismiss(updateToastIdRef.current);
      toast.success("Updated successfully");
      setIsRedirecting(true);
      redirectTimeoutRef.current = setTimeout(() => {
        router.push("/opportunity");
      }, 1500);
    },
    onError: (err: unknown) => {
      if (updateToastIdRef.current !== null) toast.dismiss(updateToastIdRef.current);
      toast.error(getUpdateErrorMessage(err));
      setIsRedirecting(false);
    },
  });

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
      if (lastObjectUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(lastObjectUrlRef.current);
      }
    };
  }, []);

  const form = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      title: "",
      organizationName: "",
      isPublic: false,
      description: "",
      externalLink: "",
      tags: "",
      deadlineDate: "",
      image: { url: "", id: "" },
    },
  });

  const image = useWatch({ control: form.control, name: "image" });
  const imageUrl = image?.url;

  useEffect(() => {
    if (item) {
      pendingFileRef.current = null;
      if (lastObjectUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(lastObjectUrlRef.current);
      }
      lastObjectUrlRef.current = null;
      const formattedDate = item.deadlineDate
        ? new Date(item.deadlineDate).toISOString().split("T")[0]
        : "";
      form.reset({
        title: item.title || "",
        organizationName: item.organizationName || "",
        isPublic: item.isPublic ?? false,
        description: item.description || "",
        externalLink: safeUrl(item.externalLink),
        tags: coerceTags(item.tags),
        deadlineDate: formattedDate,
        image: item.image || { url: "", id: "" },
      });
    }
  }, [item, form]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    pendingFileRef.current = file;

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

  const handleRemoveImage = () => {
    pendingFileRef.current = null;
    if (lastObjectUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(lastObjectUrlRef.current);
    }
    lastObjectUrlRef.current = null;
    form.setValue(
      "image",
      { url: "", id: "" },
      { shouldDirty: true, shouldValidate: true }
    );
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (data: OpportunityFormData) => {
    if (isUpdating || isRedirecting || isSubmitting) return;

    const file = pendingFileRef.current;
    let imageData = data.image ?? { url: "", id: "" };

    if (file) {
      setIsSubmitting(true);
      try {
        imageData = await uploadFileFn(file);
      } catch (err) {
        setIsSubmitting(false);
        const message = err instanceof Error ? err.message : "Failed to upload image";
        toast.error(message);
        return;
      }
    }

    updateOp(
      { ...data, image: imageData },
      { onSettled: () => setIsSubmitting(false) }
    );
  };

  const isWorking = isSubmitting || isUpdating || isRedirecting;

  if (isLoading) return <DetailPageSkeleton />;

  return (
    <div className="min-h-screen bg-[#E2EDF8]">
      <div className="py-10 px-8">
        <Link
          href={`/opportunity/${id}`}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
        >
          <ArrowLeft size={16} /> Back
        </Link>

        <h1 className="text-[28px] font-bold text-black">Edit Opportunity</h1>
        <p className="text-zinc-500 text-sm">Update details for this opportunity</p>
      </div>

      <div className="mx-6 mb-10 bg-white rounded-[3rem] p-10 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-5xl">

            <FormField name="title" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-gray-700">Opportunity Title *</FormLabel>
                <FormControl><Input className="bg-[#F3F8FF] border-none h-12 rounded-xl" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField name="organizationName" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-gray-700">Organization Name *</FormLabel>
                <FormControl><Input className="bg-[#F3F8FF] border-none h-12 rounded-xl" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField name="description" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-gray-700">Content *</FormLabel>
                <FormControl><Editor value={field.value} onChange={field.onChange} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex items-center gap-6">
              <div className="relative w-40 aspect-video rounded-2xl bg-gray-100 overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center">
                {imageUrl ? (
                  <img src={imageUrl} className="object-cover w-full h-full" alt="Preview" />
                ) : (
                  <span className="text-gray-400 text-xs text-center p-2">No Image Selected</span>
                )}
                {imageUrl ? (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={isWorking}
                    className="absolute top-2 left-2 bg-white rounded-lg shadow-sm p-1 disabled:opacity-60"
                    aria-label="Remove image"
                  >
                    <X size={14} className="text-red-500" />
                  </button>
                ) : null}
              </div>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isWorking}
                className="bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl h-10 px-8 shadow-md"
              >
                Browse
              </Button>
            </div>

            <Button
              type="submit"
              className="bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl px-12 h-12 font-bold shadow-lg"
              disabled={isWorking}
            >
              {isWorking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? "Uploading image..." : isUpdating ? "Updating..." : isRedirecting ? "Updated — redirecting..." : "Save Opportunity"}
            </Button>

          </form>
        </Form>
      </div>
    </div>
  );
}