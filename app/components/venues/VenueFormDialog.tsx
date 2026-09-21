"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { FacilitiesInput } from "./FacilitiesInput";
import { VenueImageUpload, type VenueImage } from "./VenueImageUpload";

interface VenueFormValues {
  name: string;
  description: string;
  facilities: string[];
  pricePerDay: string;
  image: VenueImage | null;
}

const EMPTY_FORM: VenueFormValues = {
  name: "",
  description: "",
  facilities: [],
  pricePerDay: "",
  image: null,
};

function toFormValues(venue: Doc<"venues">): VenueFormValues {
  return {
    name: venue.name,
    description: venue.description,
    facilities: venue.facilities,
    pricePerDay: String(venue.pricePerDay),
    image:
      venue.imageUrl && venue.imagePublicId
        ? { url: venue.imageUrl, publicId: venue.imagePublicId }
        : null,
  };
}

interface VenueFormDialogProps {
  venue?: Doc<"venues">;
  trigger?: ReactNode;
}

export function VenueFormDialog({ venue, trigger }: VenueFormDialogProps) {
  const isEditing = venue !== undefined;
  const [open, setOpen] = useState<boolean>(false);
  const [values, setValues] = useState<VenueFormValues>(
    venue ? toFormValues(venue) : EMPTY_FORM,
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const createVenue = useMutation(api.venues.create);
  const updateVenue = useMutation(api.venues.update);

  function handleOpenChange(nextOpen: boolean): void {
    setOpen(nextOpen);
    if (nextOpen) {
      setValues(venue ? toFormValues(venue) : EMPTY_FORM);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    const pricePerDay = Number(values.pricePerDay);
    if (!values.name.trim()) {
      toast.error("Give the room or venue a name");
      return;
    }
    if (Number.isNaN(pricePerDay) || pricePerDay < 0) {
      toast.error("Enter a valid price per day");
      return;
    }
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateVenue({
          venueId: venue._id as Id<"venues">,
          name: values.name,
          description: values.description,
          facilities: values.facilities,
          pricePerDay,
          imageUrl: values.image?.url,
          imagePublicId: values.image?.publicId,
        });
        toast.success("Venue updated");
      } else {
        await createVenue({
          name: values.name,
          description: values.description,
          facilities: values.facilities,
          pricePerDay,
          imageUrl: values.image?.url,
          imagePublicId: values.image?.publicId,
        });
        toast.success("Venue added");
      }
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <Plus size={16} />
            Add room / venue
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit venue" : "Add a room or place to stay"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="venue-name">Name</Label>
            <Input
              id="venue-name"
              value={values.name}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="e.g. Garden Cottage 2"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue-description">Short description</Label>
            <Textarea
              id="venue-description"
              value={values.description}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              placeholder="A quiet self-catering cottage with a private garden."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Photo</Label>
            <VenueImageUpload
              value={values.image}
              onChange={(image) => setValues((prev) => ({ ...prev, image }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Facilities</Label>
            <FacilitiesInput
              facilities={values.facilities}
              onChange={(facilities) =>
                setValues((prev) => ({ ...prev, facilities }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue-price-day">Price per day</Label>
            <Input
              id="venue-price-day"
              type="number"
              min={0}
              step="0.01"
              value={values.pricePerDay}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  pricePerDay: event.target.value,
                }))
              }
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving…"
                : isEditing
                  ? "Save changes"
                  : "Add venue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
