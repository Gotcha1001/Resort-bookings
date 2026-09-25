// components/settings/ContentManager.tsx
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  EyeOff,
  ImageOff,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { ContentDoc } from "@/convex/siteContent";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SECTION_TEXT, type ContentSection } from "@/lib/siteContent";
import { ImageUploadField, type UploadedImage } from "./ImageUploadField";
import Image from "next/image";

interface ContentManagerProps {
  section: ContentSection;
  /** Sentence under the heading explaining where the items appear. */
  helpText: string;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function ContentManager({ section, helpText }: ContentManagerProps) {
  const { singular, plural, publicHref } = SECTION_TEXT[section];

  const items = useQuery(api.siteContent.listAdmin, { section });
  const setArchived = useMutation(api.siteContent.setArchived);
  const remove = useMutation(api.siteContent.remove);
  const move = useMutation(api.siteContent.move);
  const seedDefaults = useMutation(api.siteContent.seedDefaults);

  const [editing, setEditing] = useState<ContentDoc | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function run(id: string, action: () => Promise<unknown>, fail: string) {
    setBusyId(id);
    try {
      await action();
    } catch (err) {
      toast.error(errorMessage(err, fail));
    } finally {
      setBusyId(null);
    }
  }

  async function handleSeed() {
    try {
      const count = await seedDefaults({ section });
      toast.success(`Added ${count} starter ${plural}`);
    } catch (err) {
      toast.error(errorMessage(err, "Could not load starter content"));
    }
  }

  function handleDelete(item: ContentDoc) {
    if (
      !window.confirm(
        `Delete "${item.title}"? Its photo will be deleted too. This can't be undone.`,
      )
    ) {
      return;
    }
    void run(
      item._id,
      async () => {
        await remove({ section, id: item._id });
        toast.success("Deleted");
      },
      "Could not delete",
    );
  }

  const withPhotos = items?.filter((i) => !i.isArchived && i.imageUrl).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-lg font-semibold capitalize text-foreground">
            {plural}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {helpText}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={publicHref} target="_blank">
              <ExternalLink size={14} className="mr-1.5" />
              View page
            </Link>
          </Button>
          <Button size="sm" onClick={() => setIsCreating(true)}>
            <Plus size={14} className="mr-1.5" />
            Add {singular}
          </Button>
        </div>
      </div>

      {items === undefined ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No {plural} yet, so guests see an empty page.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={() => setIsCreating(true)}>
              Add your first {singular}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void handleSeed()}
            >
              Load starter {plural}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white dark:bg-surface">
            {items.map((item, index) => {
              const busy = busyId === item._id;
              return (
                <li
                  key={item._id}
                  className={`flex items-center gap-3 p-3 ${
                    item.isArchived ? "opacity-60" : ""
                  }`}
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt=""
                      width={80}
                      height={56}
                      className="h-14 w-20 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-md bg-muted/30 text-muted-foreground">
                      <ImageOff size={18} />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.title}
                      </p>
                      {item.isArchived && (
                        <span className="shrink-0 rounded-full bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {item.description || "No description"}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={busy || index === 0}
                      aria-label="Move up"
                      onClick={() =>
                        void run(
                          item._id,
                          () =>
                            move({ section, id: item._id, direction: "up" }),
                          "Could not reorder",
                        )
                      }
                    >
                      <ArrowUp size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={busy || index === items.length - 1}
                      aria-label="Move down"
                      onClick={() =>
                        void run(
                          item._id,
                          () =>
                            move({ section, id: item._id, direction: "down" }),
                          "Could not reorder",
                        )
                      }
                    >
                      <ArrowDown size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={busy}
                      aria-label={
                        item.isArchived ? "Show on page" : "Hide from page"
                      }
                      title={
                        item.isArchived ? "Show on page" : "Hide from page"
                      }
                      onClick={() =>
                        void run(
                          item._id,
                          () =>
                            setArchived({
                              section,
                              id: item._id,
                              isArchived: !item.isArchived,
                            }),
                          "Could not update",
                        )
                      }
                    >
                      {item.isArchived ? (
                        <EyeOff size={15} />
                      ) : (
                        <Eye size={15} />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={busy}
                      aria-label="Edit"
                      onClick={() => setEditing(item)}
                    >
                      <Pencil size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      disabled={busy}
                      aria-label="Delete"
                      onClick={() => handleDelete(item)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-muted-foreground">
            {withPhotos === 0
              ? "Add photos to your items and they appear in the carousel at the top of the page."
              : `${withPhotos} photo${withPhotos === 1 ? "" : "s"} showing in the page carousel. The order here is the order guests see.`}
          </p>
        </>
      )}

      <ContentFormDialog
        key={editing?._id ?? "new"}
        section={section}
        open={isCreating || editing !== null}
        item={editing}
        onClose={() => {
          setIsCreating(false);
          setEditing(null);
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add / edit dialog
// ---------------------------------------------------------------------------

interface ContentFormDialogProps {
  section: ContentSection;
  open: boolean;
  item: ContentDoc | null;
  onClose: () => void;
}

function ContentFormDialog({
  section,
  open,
  item,
  onClose,
}: ContentFormDialogProps) {
  const { singular } = SECTION_TEXT[section];
  const create = useMutation(api.siteContent.create);
  const update = useMutation(api.siteContent.update);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Reset the form each time the dialog opens (for a new item or a different one).
  useEffect(() => {
    if (!open) return;
    setTitle(item?.title ?? "");
    setDescription(item?.description ?? "");
    setImage(
      item?.imageUrl
        ? { url: item.imageUrl, publicId: item.imagePublicId ?? "" }
        : null,
    );
  }, [open, item]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("A title is required.");
      return;
    }
    setIsSaving(true);
    try {
      const imageFields = {
        imageUrl: image?.url,
        imagePublicId: image?.publicId || undefined,
      };
      if (item) {
        await update({
          section,
          id: item._id,
          title,
          description,
          ...imageFields,
        });
        toast.success("Saved");
      } else {
        await create({ section, title, description, ...imageFields });
        toast.success(`Added ${singular}`);
      }
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Could not save"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && !isSaving && onClose()}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {item ? `Edit ${singular}` : `Add ${singular}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="content-title">Title *</Label>
            <Input
              id="content-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5"
              maxLength={120}
              required
            />
          </div>

          <div>
            <Label htmlFor="content-description">Description</Label>
            <Textarea
              id="content-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5"
              rows={4}
              maxLength={2000}
            />
          </div>

          <div>
            <Label>Photo</Label>
            <div className="mt-1.5">
              <ImageUploadField
                value={image}
                onChange={setImage}
                alt={title || "Photo"}
                disabled={isSaving}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : item ? "Save changes" : `Add ${singular}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
