"use client";

import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Loading } from "../global/loading";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { saveActivityLogsNotification, sendInvitation } from "@/lib/queries";

type Props = {
  agencyId: string;
};

export const SendInvitationForm = ({ agencyId }: Props) => {
  const { toast } = useToast();

  const formSchema = z.object({
    email: z.string().email(),
    role: z.enum(["AGENCY_ADMIN", "SUBACCOUNT_USER", "SUBACCOUNT_GUEST"]),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      role: "SUBACCOUNT_USER",
    },
  });

  {/* ========== Form Submission Functionality ========== */}
  const handleOnSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const res = await sendInvitation(agencyId, values.email, values.role)

      await saveActivityLogsNotification({
        agencyId: agencyId,
        description: `Invited ${res.email}`,
        subaccountId: undefined,
      })

      toast({
        title: 'Success',
        description: 'Created and sent invitation',
      })

    } catch (error) {
      console.log(error)
      
      toast({
        variant: 'destructive',
        title: 'Oppse!',
        description: 'Could not send invitation',
      })
    }
  }

  return (
    <Card>
      {/* ========== Card Header ========== */}
      <CardHeader>
        <CardTitle>Invitation</CardTitle>
        <CardDescription>
          An invitation will be sent to the user. Users who already have an
          invitation sent out to their email, will not receive another
          invitation.
        </CardDescription>
      </CardHeader>

      {/* ========== Card Content ========== */}
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleOnSubmit)}
            className="space-y-8"
          >

      {/* ========== Email Form ========== */}
            <FormField
              disabled={form.formState.isSubmitting}
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter user Email here... " {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

      {/* ========== Invited User Role Form ========== */}
            <FormField
              disabled={form.formState.isSubmitting}
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>User Role</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value)}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user role..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="AGENCY_ADMIN">Agency Admin</SelectItem>
                      <SelectItem value="SUBACCOUNT_USER">Sub Account User</SelectItem>
                      <SelectItem value="SUBACCOUNT_GUEST">Sub Account Guest</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

      {/* ========== Submit Button ========== */}
            <Button disabled={form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting ? <Loading /> : "Send Invitation"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
