"use client";

import { z } from "zod";
import { v4 } from "uuid";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";

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
  FormDescription,
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
import { AlertDialog } from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Loading } from "../global/loading";
import { FileUpload } from "../global/file-upload";

import { SubAccount, User } from "@prisma/client";
import { useModal } from "@/provider/modal-provider";
import { Separator } from "../ui/separator";
import {
  AuthUserWithAgencySigebarOptionsSubAccounts,
  UserWithPermissionsAndSubAccounts,
} from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "../ui/switch";
import {
  changeUserPermissions,
  getAuthUserDetails,
  getUserPermissions,
  saveActivityLogsNotification,
  updateUser,
} from "@/lib/queries";

type Props = {
  id: string | null;
  type: "agency" | "subaccount";
  userData?: Partial<User>;
  subAccounts?: SubAccount[];
};

const formSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  avatarUrl: z.string(),
  role: z.enum([
    "AGENCY_OWNER",
    "AGENCY_ADMIN",
    "SUBACCOUNT_USER",
    "SUBACCOUNT_GUEST",
  ]),
});

export const UserForm = ({ id, type, userData, subAccounts }: Props) => {
  const { data, setClose } = useModal();
  const { toast } = useToast();
  const router = useRouter();
  const [roleState, setRoleState] = useState("");
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [subAccountPermissions, setSubAccountsPermissions] =
    useState<UserWithPermissionsAndSubAccounts | null>(null);
  const [authUserData, setAuthUserData] =
    useState<AuthUserWithAgencySigebarOptionsSubAccounts | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: userData ? userData.name : data?.user?.name,
      email: userData ? userData.email : data?.user?.email,
      avatarUrl: userData ? userData.avatarUrl : data?.user?.avatarUrl,
      role: userData ? userData.role : data?.user?.role,
    },
  });

  // {/* ========== Get Auth User Details ========== */}
  useEffect(() => {
    if (data.user) {
      const fetchDetails = async () => {
        const response = await getAuthUserDetails();
        if (response) setAuthUserData(response);
      };
      fetchDetails();
    }
  }, [data]);

  // {/* ========== Get User Permissions ========== */}
  useEffect(() => {
    if (!data.user) return;
    const getPermissions = async () => {
      if (!data.user) return;
      const permission = await getUserPermissions(data.user.id);
      setSubAccountsPermissions(permission);
    };
    getPermissions();
  }, [data, form]);

  // {/* ========== Reset form after submitting ========== */}
  useEffect(() => {
    if (data.user) {
      form.reset(data.user);
    }
    if (userData) {
      form.reset(userData);
    }
  }, [userData, data, form]);

  // {/* ========== Changes user role and permission ========== */}
  const onChangePermission = async (
    subAccountId: string,
    val: boolean,
    permissionsId: string | undefined
  ) => {
    if (!data.user?.email) return;

    setLoadingPermissions(true);

    const response = await changeUserPermissions(
      permissionsId ? permissionsId : v4(),
      data.user.email,
      subAccountId,
      val
    );

    if (type === "agency") {
      await saveActivityLogsNotification({
        agencyId: authUserData?.Agency?.id,
        description: `Gave ${userData?.name} access to | ${
          subAccountPermissions?.Permissions.find(
            (p) => p.subAccountId === subAccountId
          )?.SubAccount.name
        } `,
        subaccountId: subAccountPermissions?.Permissions.find(
          (permission) => permission.subAccountId === subAccountId
        )?.SubAccount.id,
      });
    }

    if (response) {
      toast({
        title: "Success",
        description: "The request was successfull",
      });

      if (subAccountPermissions) {
        subAccountPermissions.Permissions.find((permission) => {
          if (permission.subAccountId === subAccountId) {
            return { ...permission, access: !permission.access };
          }
          return permission;
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Failed",
        description: "Could not update permissions",
      });
    }
    router.refresh();
    setLoadingPermissions(false);
  };

  // {/* ========== Submit Agency Form and add details in DB ========== */}
  const handleSubmitAgency = async (values: z.infer<typeof formSchema>) => {
    if (!id) return;
    if (userData || data?.user) {
      const updatedUser = await updateUser(values);
      authUserData?.Agency?.SubAccount.filter((subacc) =>
        authUserData.Permissions.find(
          (p) => p.subAccountId === subacc.id && p.access
        )
      ).forEach(async (subaccount) => {
        await saveActivityLogsNotification({
          agencyId: undefined,
          description: `Updated ${userData?.name} information`,
          subaccountId: subaccount.id,
        });
      });

      if (updatedUser) {
        toast({
          title: "Success",
          description: "Update User Information",
        });

        setClose();
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Oppse!",
          description: "Could not update user information",
        });
      }
    } else {
      console.log("Error could not submit");
    }
  };

  const { isSubmitting } = form.formState;
  return (
    <AlertDialog>
      {/* ========== Card Component ========== */}
      <Card className="w-full">
        {/* ========== Card Header ========== */}
        <CardHeader>
          <CardTitle className="text-2xl font-bold">User Details</CardTitle>
          <CardDescription className="text-gray-400">
            Add or update your information
          </CardDescription>
        </CardHeader>

        {/* ========== Card Contect    ========== */}
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmitAgency)}
              className="space-y-4"
            >
              {/* ========== User Avatar Form    ========== */}
              <FormField
                disabled={isSubmitting}
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile picture</FormLabel>
                    <FormControl>
                      <FileUpload
                        apiEndpoint="avatar"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ========== User Full Name Form    ========== */}
              <FormField
                disabled={isSubmitting}
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input required placeholder="Full Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ========== User Email Form    ========== */}
              <FormField
                disabled={isSubmitting}
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        readOnly={
                          userData?.role === "AGENCY_OWNER" || isSubmitting
                        }
                        placeholder="Email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ========== User Role Form using Select Component ========== */}
              <FormField
                disabled={isSubmitting}
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel> User Role</FormLabel>
                    <Select
                      disabled={field.value === "AGENCY_OWNER"}
                      onValueChange={(value) => {
                        if (
                          value === "SUBACCOUNT_USER" ||
                          value === "SUBACCOUNT_GUEST"
                        ) {
                          setRoleState(
                            "You need to have subaccounts to assign Subaccount access to team members."
                          );
                        } else {
                          setRoleState("");
                        }
                        field.onChange(value);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user role..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="AGENCY_ADMIN">
                          Agency Admin
                        </SelectItem>
                        {(data?.user?.role === "AGENCY_OWNER" ||
                          userData?.role === "AGENCY_OWNER") && (
                          <SelectItem value="AGENCY_OWNER">
                            Agency Owner
                          </SelectItem>
                        )}
                        <SelectItem value="SUBACCOUNT_USER">
                          Sub Account User
                        </SelectItem>
                        <SelectItem value="SUBACCOUNT_GUEST">
                          Sub Account Guest
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-muted-foreground">{roleState}</p>
                  </FormItem>
                )}
              />

              {/* ========== Submit Button ========== */}
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? <Loading /> : "Save User Details"}
              </Button>

              {/* ========== Give SubAccount Access to Team Member ========== */}
              {authUserData?.role === "AGENCY_OWNER" && (
                <div>
                  <Separator className="my-4" />
                  <FormLabel> User Permissions</FormLabel>
                  <FormDescription className="mb-4">
                    You can give Sub Account access to team member by turning on
                    access control for each Sub Account. This is only visible to
                    agency owners
                  </FormDescription>
                  <div className="flex flex-col gap-4">
                    {subAccounts?.map((subAccount) => {
                      const subAccountPermissionsDetails =
                        subAccountPermissions?.Permissions.find(
                          (p) => p.subAccountId === subAccount.id
                        );
                      return (
                        <div
                          key={subAccount.id}
                          className="flex items-center justify-between rounded-lg border p-4"
                        >
                          <div>
                            <p>{subAccount.name}</p>
                          </div>
                          <Switch
                            disabled={loadingPermissions}
                            checked={subAccountPermissionsDetails?.access}
                            onCheckedChange={(permission) => {
                              onChangePermission(
                                subAccount.id,
                                permission,
                                subAccountPermissionsDetails?.id
                              );
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </AlertDialog>
  );
};
