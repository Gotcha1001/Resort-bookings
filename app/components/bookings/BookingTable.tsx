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

type BookingWithVenueName = Doc<"bookings"> & { venueName?: string };

interface BookingTableProps {
  bookings: BookingWithVenueName[];
  showVenueColumn?: boolean;
  emptyMessage?: string;
}

export function BookingTable({
  bookings,
  showVenueColumn = false,
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
      <p className="rounded-lg border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500 dark:border-stone-700">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500 dark:bg-stone-900 dark:text-stone-400">
          <tr>
            {showVenueColumn && (
              <th className="px-4 py-3 font-medium">Venue</th>
            )}
            <th className="px-4 py-3 font-medium">Customer</th>
            <th className="px-4 py-3 font-medium">Contact</th>
            <th className="px-4 py-3 font-medium">Period</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Payment</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
          {bookings.map((booking) => {
            const isBusy = pendingId === booking._id;
            const canModify = booking.status === "active";
            const isCancelled = booking.status === "cancelled";
            return (
              <tr key={booking._id}>
                {showVenueColumn && (
                  <td className="px-4 py-3 font-medium text-stone-900 dark:text-stone-100">
                    {booking.venueName ?? "—"}
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="font-medium text-stone-900 dark:text-stone-100">
                    {booking.customerName}
                  </div>
                  {booking.email && (
                    <div className="text-xs text-stone-400">
                      {booking.email}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-stone-600 dark:text-stone-300">
                  {booking.contactNumber}
                </td>
                <td className="px-4 py-3 text-stone-600 dark:text-stone-300">
                  <div>{formatDate(booking.startDate)}</div>
                  <div className="text-xs text-stone-400">
                    to {formatDate(booking.endDate)}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-stone-900 dark:text-stone-100">
                  {formatCurrency(booking.amount)}
                  <div className="text-xs font-normal text-stone-400">
                    {booking.numberOfDays}{" "}
                    {booking.numberOfDays === 1 ? "night" : "nights"}
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
                              This frees up {booking.venueName ?? "the venue"}{" "}
                              for {formatDate(booking.startDate)} –{" "}
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
                              This permanently removes {booking.customerName}
                              &apos;s cancelled booking for{" "}
                              {booking.venueName ?? "this venue"}. This
                              can&apos;t be undone.
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
