"use client";

import { useEffect, useRef, type ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ideaBankSchema } from "@/lib/validator";
import IdeaBankApi from "@/api/idea-bank";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import Editor from "@/components/shared/Editor"; 
import { toast } from "sonner";
import { DetailPageSkeleton } from "@/components/shared/page-skeletons";

type IdeaBankFormValues = z.input<typeof ideaBankSchema>;

function getUpdateErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const maybe = err as {
      message?: string;
      response?: { data?: { message?: string } };
    };

    return maybe.response?.data?.message || maybe.message || "Not updated";
  }

  return "Not updated";
}

export default function EditIdeaPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id as string | string[] | undefined;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const updateToastIdRef = useRef<string | number | null>(null);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: idea, isLoading, isError } = IdeaBankApi.GetById.useQuery(id ?? "");
  const { mutate: updateIdea, isPending } = IdeaBankApi.Update.useMutation(id ?? "", {
    onMutate: () => {
      updateToastIdRef.current = toast.loading("Updating...");
    },
    onSuccess: () => {
      if (updateToastIdRef.current !== null) toast.dismiss(updateToastIdRef.current);
      toast.success("Updated successfully");
      redirectTimeoutRef.current = setTimeout(() => {
        router.push("/idea-bank");
      }, 1500);
    },
    onError: (err: unknown) => {
      if (updateToastIdRef.current !== null) toast.dismiss(updateToastIdRef.current);
      toast.error(getUpdateErrorMessage(err));
    },
  });

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
    };
  }, []);

  const form = useForm<IdeaBankFormValues>({
    resolver: zodResolver(ideaBankSchema),
    defaultValues: {
      title: "",
      description: "",
      source: "",
      tags: "",
      isPublic: false,
      image: { url: "", id: "" },
    },
  });

  const image = useWatch({ control: form.control, name: "image" });
  const imageUrl = image?.url;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastObjectUrlRef = useRef<string | null>(null);
  useEffect(() => {
    if (idea) {
      form.reset({
        title: idea.title,
        description: idea.description,
        source: idea.source,
        tags: idea.tags,
        isPublic: idea.isPublic,
        image: idea.image
      });
    }
  }, [idea, form]);

  useEffect(() => {
    return () => {
      if (lastObjectUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(lastObjectUrlRef.current);
      }
    };
  }, []);

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

    form.setValue(
      "image",
      { url: nextUrl, id: file.name },
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const handleSubmit = (data: IdeaBankFormValues) => {
    if (!id || !idea) {
      toast.error("Idea not loaded");
      return;
    }

    const nextImage = data.image?.url?.startsWith("blob:") ? idea.image : data.image;

    updateIdea({
      ...data,
      image: nextImage,
      isPublic: data.isPublic ?? false,
    });
  };

  if (isLoading) return <DetailPageSkeleton />;

  if (!id || isError || !idea) {
    return (
      <div className="p-10 text-center text-red-500">
        Idea not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
     <div>
        <h1 className="text-[28px] font-bold text-black">Update idea</h1>
        <p className="text-zinc-600 text-lg">Updating your Idea</p>
      </div>
      <div className="bg-white rounded-xl p-8 shadow-sm border border-blue-50">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8 max-w-4xl"
          >

            <FormField name="title" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel className="text-neutral-800 font-semibold">Blog Title <span className="text-red-500">*</span></FormLabel>
                <FormControl><Input placeholder="your title" className="bg-[#F3F8FF] border-none h-12" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="space-y-3">
              <h3 className="text-neutral-800 font-semibold">Do you Want to make this content public?</h3>
              <p className="text-stone-500 text-sm">
                If you make this content public, the content will be Published on the main site.
              </p>
              <FormField name="isPublic" control={form.control} render={({ field }) => (
                <div className="flex items-center gap-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <label className="text-stone-500 text-sm">Make it Public</label>
                </div>
              )} />
            </div>

            <FormField name="description" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel className="text-neutral-800 text-lg">Description</FormLabel>
                <FormControl>
                   <Editor value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex items-center gap-4">
               <div className="w-40 aspect-video rounded-lg bg-gray-100 overflow-hidden relative">
                <img src={imageUrl || "/placeholder.png"} className="object-cover w-full h-full" alt="" />
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
                 variant="secondary"
                 className="bg-blue-500 text-white hover:bg-blue-600"
                 onClick={handleBrowseClick}
               >
                 Browse
               </Button>
            </div>

            <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-10 h-12" disabled={isPending}>
              {isPending ? "Saving..." : "Submit For a review"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}