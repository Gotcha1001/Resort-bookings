import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Every hour, free up any venue whose booking period has ended.
crons.interval(
  "expire past bookings",
  { hours: 1 },
  internal.bookings.expirePastBookings,
);

export default crons;
