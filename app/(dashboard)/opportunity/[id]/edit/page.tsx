"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { opportunitySchema, type OpportunityFormData } from "@/lib/validator";
import OpportunityApi from "@/api/opportunity";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Editor from "@/components/shared/Editor"; 
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DetailPageSkeleton } from "@/components/shared/page-skeletons";

function getUpdateErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const maybe = err as { message?: string; response?: { data?: { message?: string } } };
    return maybe.response?.data?.message || maybe.message || "Not updated";
  }
  return "Not updated";
}

export default function EditOpportunityPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const updateToastIdRef = useRef<string | number | null>(null);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // 1. DATA LOGIC
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
    };
  }, []);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      title: "", organizationName: "", isPublic: false,
      description: "", externalLink: "", tags: "", deadlineDate: "",
      image: { url: "", id: "temp" },
    },
  });

  useEffect(() => {
    if (item) {
      const formattedDate = item.deadlineDate ? new Date(item.deadlineDate).toISOString().split('T')[0] : "";
      form.reset({ 
        ...item,
        externalLink: item.externalLink || "",
        tags: item.tags || "",
        deadlineDate: formattedDate,
        image: item.image || { url: "", id: "temp" }
      });
    }
  }, [item, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
  };

  const onSubmit = (data: OpportunityFormData) => {
    if (isUpdating || isRedirecting) return;
    updateOp(data);
  };

  if (isLoading) return <DetailPageSkeleton />;

  const effectivePreviewUrl = previewUrl || item?.image?.url || "";

  return (
    <div className="min-h-screen bg-[#E2EDF8]">
      <div className="py-10 px-8">
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
               <div className="w-40 aspect-video rounded-2xl bg-gray-100 overflow-hidden relative border-2 border-dashed border-gray-200 flex-center">
                {effectivePreviewUrl ? (
                  <img src={effectivePreviewUrl} className="object-cover w-full h-full" alt="" />
                ) : (
                  <span className="text-gray-400 text-xs text-center p-2">No Image Selected</span>
                )}
               </div>
               <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
               <Button type="button" onClick={() => fileInputRef.current?.click()} className="bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl h-10 px-8 shadow-md">
                 Browse
               </Button>
            </div>

            <Button
              type="submit"
              className="bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl px-12 h-12 font-bold shadow-lg"
              disabled={isUpdating || isRedirecting}
            >
              {(isUpdating || isRedirecting) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isUpdating ? "Updating..." : isRedirecting ? "Updated — redirecting..." : "Save Opportunity"}
            </Button>

          </form>
        </Form>
      </div>
    </div>
  );
}