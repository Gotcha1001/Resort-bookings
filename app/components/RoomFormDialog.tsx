// components/venues/RoomFormDialog.tsx  (or wherever it lives)
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { AmenitiesInput } from "../components/venues/AmenitiesInput";
import {
  RoomImageUpload,
  type RoomImage,
} from "../components/venues/RoomImageUpload";

interface RoomFormValues {
  name: string;
  roomType: "room" | "cottage";
  description: string;
  amenities: string[];
  maxGuests: string;
  pricePerNight: string;
  image: RoomImage | null;
}

const EMPTY_FORM: RoomFormValues = {
  name: "",
  roomType: "room",
  description: "",
  amenities: [],
  maxGuests: "2",
  pricePerNight: "",
  image: null,
};

function toFormValues(room: Doc<"rooms">): RoomFormValues {
  return {
    name: room.name,
    roomType: room.roomType,
    description: room.description,
    amenities: room.amenities,
    maxGuests: String(room.maxGuests),
    pricePerNight: String(room.pricePerNight),
    image:
      room.imageUrl && room.imagePublicId
        ? { url: room.imageUrl, publicId: room.imagePublicId }
        : null,
  };
}

interface RoomFormDialogProps {
  room?: Doc<"rooms">;
  trigger?: ReactNode;
}

export function RoomFormDialog({ room, trigger }: RoomFormDialogProps) {
  const isEditing = room !== undefined;
  const [open, setOpen] = useState<boolean>(false);
  const [values, setValues] = useState<RoomFormValues>(
    room ? toFormValues(room) : EMPTY_FORM,
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const createRoom = useMutation(api.rooms.create);
  const updateRoom = useMutation(api.rooms.update);

  function handleOpenChange(nextOpen: boolean): void {
    setOpen(nextOpen);
    if (nextOpen) {
      setValues(room ? toFormValues(room) : EMPTY_FORM);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    const pricePerNight = Number(values.pricePerNight);
    const maxGuests = Number(values.maxGuests);
    if (!values.name.trim()) {
      toast.error("Give the room or cottage a name");
      return;
    }
    if (Number.isNaN(pricePerNight) || pricePerNight < 0) {
      toast.error("Enter a valid price per night");
      return;
    }
    if (!Number.isInteger(maxGuests) || maxGuests < 1) {
      toast.error("Enter a valid maximum number of guests");
      return;
    }
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateRoom({
          roomId: room._id as Id<"rooms">,
          name: values.name,
          roomType: values.roomType,
          description: values.description,
          amenities: values.amenities,
          maxGuests,
          pricePerNight,
          imageUrl: values.image?.url,
          imagePublicId: values.image?.publicId,
        });
        toast.success("Room updated");
      } else {
        await createRoom({
          name: values.name,
          roomType: values.roomType,
          description: values.description,
          amenities: values.amenities,
          maxGuests,
          pricePerNight,
          imageUrl: values.image?.url,
          imagePublicId: values.image?.publicId,
        });
        toast.success("Room added");
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
            Add room / cottage
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={(e) => void handleSubmit(e)}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit room" : "Add a room or cottage"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={values.name}
                onChange={(e) =>
                  setValues((v) => ({ ...v, name: e.target.value }))
                }
                placeholder="Ocean View Cottage"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={values.roomType}
                  onValueChange={(val) =>
                    setValues((v) => ({
                      ...v,
                      roomType: val as "room" | "cottage",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="room">Room</SelectItem>
                    <SelectItem value="cottage">Cottage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="maxGuests">Max guests</Label>
                <Input
                  id="maxGuests"
                  type="number"
                  min={1}
                  value={values.maxGuests}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, maxGuests: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={values.description}
                onChange={(e) =>
                  setValues((v) => ({ ...v, description: e.target.value }))
                }
                rows={3}
                placeholder="A cosy two-bedroom cottage with a private braai area..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Amenities</Label>
              <AmenitiesInput
                amenities={values.amenities}
                onChange={(amenities) =>
                  setValues((v) => ({ ...v, amenities }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pricePerNight">Price per night (ZAR)</Label>
              <Input
                id="pricePerNight"
                type="number"
                min={0}
                step="0.01"
                value={values.pricePerNight}
                onChange={(e) =>
                  setValues((v) => ({ ...v, pricePerNight: e.target.value }))
                }
                placeholder="1500"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Photo</Label>
              <RoomImageUpload
                value={values.image}
                onChange={(image) => setValues((v) => ({ ...v, image }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : isEditing
                  ? "Save changes"
                  : "Add room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
