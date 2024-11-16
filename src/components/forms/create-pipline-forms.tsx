"use client";

import { useModal } from "@/provider/modal-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pipeline } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { saveActivityLogsNotification, upsertPipeline } from "@/lib/queries";
import { toast } from "@/hooks/use-toast";
import { Button } from "../ui/button";
import { Loading } from "../global/loading";

interface CreatePipelineFormProps {
  defaultData?: Pipeline;
  subAccountId: string;
}

const CreatePipelineFormSchema = z.object({
  name: z.string().min(1),
});

export const CreatePipelineForm = ({
  subAccountId,
  defaultData,
}: CreatePipelineFormProps) => {
  const { data, isOpen, setOpen, setClose } = useModal();
  const router = useRouter();

  const form = useForm<z.infer<typeof CreatePipelineFormSchema>>({
    mode: "onChange",
    resolver: zodResolver(CreatePipelineFormSchema),
    defaultValues: {
      name: defaultData?.name || "",
    },
  });

  useEffect(() => {
    if (defaultData) {
      form.reset({
        name: defaultData.name || "",
      });
    }
  }, [defaultData]);

  const isLoading = form.formState.isLoading;

  const handleOnSubmit = async (
    values: z.infer<typeof CreatePipelineFormSchema>
  ) => {
    if (!subAccountId) return;
    try {
      const response = await upsertPipeline({
        ...values,
        id: defaultData?.id,
        subAccountId: subAccountId,
      });

      await saveActivityLogsNotification({
        agencyId: undefined,
        description: `Updates a pipeline | ${response?.name}`,
        subaccountId: subAccountId,
      });

      toast({
        title: "Success",
        description: "Saved pipeline details",
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Oppse!",
        description: "Could not save pipeline details",
      });
    }

    setClose();
  };

  return (
    <Card className="w-full ">
      <CardHeader>
        <CardTitle>Pipeline Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleOnSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              disabled={isLoading}
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pipeline Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="w-20 mt-4" disabled={isLoading} type="submit">
              {form.formState.isSubmitting ? <Loading /> : "Save"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
