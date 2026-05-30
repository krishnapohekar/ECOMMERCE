import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import {
  deleteAddress,
  getProfile,
  listAddresses,
  saveAddress,
  updateProfile,
} from "@/lib/shop.functions";

export const Route = createFileRoute("/account/")({ component: Overview });

function Overview() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getProfile);
  const saveProfileFn = useServerFn(updateProfile);
  const fetchAddresses = useServerFn(listAddresses);
  const saveAddressFn = useServerFn(saveAddress);
  const deleteAddressFn = useServerFn(deleteAddress);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const { data: addresses } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => fetchAddresses(),
  });
  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "" });
  const [addressForm, setAddressForm] = useState({
    id: "",
    full_name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
    is_default: true,
  });

  useEffect(() => {
    if (profile) setProfileForm({ full_name: profile.full_name ?? "", phone: profile.phone ?? "" });
  }, [profile]);

  const resetAddress = () =>
    setAddressForm({
      id: "",
      full_name: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "US",
      is_default: true,
    });

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProfileFn({ data: profileForm });
    await qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Profile saved");
  };

  const submitAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveAddressFn({ data: { ...addressForm, id: addressForm.id || undefined } });
    resetAddress();
    await qc.invalidateQueries({ queryKey: ["addresses"] });
    toast.success("Address saved");
  };

  return (
    <div className="space-y-12">
      <h1 className="font-display text-4xl">Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">{user?.email}</p>

      <form onSubmit={saveProfile} className="max-w-xl space-y-4">
        <h2 className="font-display text-2xl">Profile</h2>
        <Field
          label="Full name"
          value={profileForm.full_name}
          onChange={(v) => setProfileForm({ ...profileForm, full_name: v })}
        />
        <Field
          label="Phone"
          value={profileForm.phone}
          onChange={(v) => setProfileForm({ ...profileForm, phone: v })}
        />
        <button className="bg-ink px-5 py-3 text-xs uppercase tracking-widest text-primary-foreground">
          Save profile
        </button>
      </form>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl">Addresses</h2>
          {addressForm.id && (
            <button
              onClick={resetAddress}
              className="text-xs uppercase tracking-widest text-muted-foreground ink-link"
            >
              New address
            </button>
          )}
        </div>
        {addresses && addresses.length > 0 && (
          <div className="mb-8 grid gap-4 md:grid-cols-2">
            {addresses.map((a: any) => (
              <div key={a.id} className="border border-border p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      {a.full_name}{" "}
                      {a.is_default && (
                        <span className="ml-2 text-xs uppercase tracking-widest text-muted-foreground">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-muted-foreground">
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ""}
                    </div>
                    <div className="text-muted-foreground">
                      {a.city}, {a.state} {a.postal_code}
                    </div>
                    <div className="text-muted-foreground">{a.country}</div>
                    {a.phone && <div className="mt-2 text-muted-foreground">{a.phone}</div>}
                  </div>
                  <div className="flex gap-3 text-xs uppercase tracking-widest">
                    <button
                      onClick={() =>
                        setAddressForm({
                          id: a.id,
                          full_name: a.full_name ?? "",
                          phone: a.phone ?? "",
                          line1: a.line1 ?? "",
                          line2: a.line2 ?? "",
                          city: a.city ?? "",
                          state: a.state ?? "",
                          postal_code: a.postal_code ?? "",
                          country: a.country ?? "US",
                          is_default: !!a.is_default,
                        })
                      }
                      className="ink-link"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        await deleteAddressFn({ data: { id: a.id } });
                        await qc.invalidateQueries({ queryKey: ["addresses"] });
                        toast.success("Address deleted");
                      }}
                      className="text-muted-foreground hover:text-ink"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={submitAddress} className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <Field
            label="Full name"
            value={addressForm.full_name}
            onChange={(v) => setAddressForm({ ...addressForm, full_name: v })}
            required
            full
          />
          <Field
            label="Address"
            value={addressForm.line1}
            onChange={(v) => setAddressForm({ ...addressForm, line1: v })}
            required
            full
          />
          <Field
            label="Apt, suite"
            value={addressForm.line2}
            onChange={(v) => setAddressForm({ ...addressForm, line2: v })}
            full
          />
          <Field
            label="City"
            value={addressForm.city}
            onChange={(v) => setAddressForm({ ...addressForm, city: v })}
            required
          />
          <Field
            label="State"
            value={addressForm.state}
            onChange={(v) => setAddressForm({ ...addressForm, state: v })}
          />
          <Field
            label="Postal code"
            value={addressForm.postal_code}
            onChange={(v) => setAddressForm({ ...addressForm, postal_code: v })}
            required
          />
          <Field
            label="Country"
            value={addressForm.country}
            onChange={(v) => setAddressForm({ ...addressForm, country: v })}
            required
          />
          <Field
            label="Phone"
            value={addressForm.phone}
            onChange={(v) => setAddressForm({ ...addressForm, phone: v })}
          />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={addressForm.is_default}
              onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
              className="h-4 w-4 accent-ink"
            />
            Use as default shipping address
          </label>
          <button className="bg-ink px-5 py-3 text-xs uppercase tracking-widest text-primary-foreground sm:w-fit">
            {addressForm.id ? "Update address" : "Save address"}
          </button>
        </form>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  full,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-ink"
      />
    </label>
  );
}
