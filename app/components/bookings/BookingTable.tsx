// components/bookings/BookingTable.tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge, PaidBadge } from "./StatusBadge";

type BookingWithRoomName = Doc<"bookings"> & { roomName?: string };

interface BookingTableProps {
  bookings: BookingWithRoomName[];
  showRoomColumn?: boolean;
  emptyMessage?: string;
}

export function BookingTable({
  bookings,
  showRoomColumn = false,
  emptyMessage = "No bookings yet.",
}: BookingTableProps) {
  const markAsPaid = useMutation(api.bookings.markAsPaid);
  const markAsUnpaid = useMutation(api.bookings.markAsUnpaid);
  const cancelBooking = useMutation(api.bookings.cancel);
  const removeBooking = useMutation(api.bookings.remove);
  const [pendingId, setPendingId] = useState<Id<"bookings"> | null>(null);

  async function togglePaid(booking: Doc<"bookings">): Promise<void> {
    setPendingId(booking._id);
    try {
      if (booking.isPaid) {
        await markAsUnpaid({ bookingId: booking._id });
      } else {
        await markAsPaid({ bookingId: booking._id });
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update payment status",
      );
    } finally {
      setPendingId(null);
    }
  }

  async function handleCancel(bookingId: Id<"bookings">): Promise<void> {
    setPendingId(bookingId);
    try {
      await cancelBooking({ bookingId });
      toast.success("Booking cancelled");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not cancel booking",
      );
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(bookingId: Id<"bookings">): Promise<void> {
    setPendingId(bookingId);
    try {
      await removeBooking({ bookingId });
      toast.success("Booking deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete booking",
      );
    } finally {
      setPendingId(null);
    }
  }

  if (bookings.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white dark:bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="bg-white text-xs uppercase tracking-wide text-muted-foreground dark:bg-surface">
          <tr>
            {showRoomColumn && <th className="px-4 py-3 font-medium">Room</th>}
            <th className="px-4 py-3 font-medium">Guest</th>
            <th className="px-4 py-3 font-medium">Contact</th>
            <th className="px-4 py-3 font-medium">Period</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Payment</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {bookings.map((booking) => {
            const isBusy = pendingId === booking._id;
            // Active bookings can be cancelled / payment toggled.
            // Pending payment can still be cancelled (frees the hold).
            const canModify =
              booking.status === "active" ||
              booking.status === "pending_payment";
            const isCancelled = booking.status === "cancelled";

            return (
              <tr key={booking._id}>
                {showRoomColumn && (
                  <td className="px-4 py-3 font-medium text-foreground">
                    {booking.roomName ?? "—"}
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">
                    {booking.guestName}
                  </div>
                  {booking.guestEmail && (
                    <div className="text-xs text-muted-foreground">
                      {booking.guestEmail}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {booking.guestPhone}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <div>{formatDate(booking.startDate)}</div>
                  <div className="text-xs text-muted-foreground/80">
                    to {formatDate(booking.endDate)}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {formatCurrency(booking.amount)}
                  <div className="text-xs font-normal text-muted-foreground">
                    {booking.numberOfNights}{" "}
                    {booking.numberOfNights === 1 ? "night" : "nights"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={booking.status} />
                </td>
                <td className="px-4 py-3">
                  <PaidBadge isPaid={booking.isPaid} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {/* Manual paid toggle – mainly for walk-ins / admin overrides.
                        PayFast ITN flips isPaid automatically for online bookings. */}
                    <Button
                      size="sm"
                      variant={booking.isPaid ? "outline" : "default"}
                      disabled={!canModify || isBusy}
                      onClick={() => void togglePaid(booking)}
                    >
                      {booking.isPaid ? "Mark unpaid" : "Mark paid"}
                    </Button>

                    {canModify && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isBusy}
                          >
                            Cancel
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Cancel this booking?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This frees up {booking.roomName ?? "the room"} for{" "}
                              {formatDate(booking.startDate)} –{" "}
                              {formatDate(booking.endDate)}. This can&apos;t be
                              undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep booking</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => void handleCancel(booking._id)}
                            >
                              Cancel booking
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {isCancelled && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isBusy}
                          >
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete this booking record?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This permanently removes {booking.guestName}
                              &apos;s cancelled booking for{" "}
                              {booking.roomName ?? "this room"}. This can&apos;t
                              be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep record</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => void handleDelete(booking._id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
