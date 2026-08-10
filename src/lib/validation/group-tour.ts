import * as z from "zod";

const groupTourFieldsShape = {
  title: z.string().trim().min(2, "Title must be at least 2 characters long."),
  startDate: z.coerce.date({ error: "Please enter a valid start date." }),
  endDate: z.coerce.date({ error: "Please enter a valid end date." }),
  durationLabel: z.string().trim().min(1, "Please enter a duration, e.g. 6D/5N."),
  totalSeats: z.coerce.number().int().positive("Total seats must be a positive number."),
  bookedSeats: z.coerce.number().int().nonnegative().default(0),
  rateB2B: z.string().trim().optional(),
  rateB2C: z.string().trim().optional(),
  description: z.string().min(1, "Please add a description."),
};

function requiresValidDateRange(data: { startDate: Date; endDate: Date }) {
  return data.endDate >= data.startDate;
}

function requiresSeatsWithinTotal(data: { totalSeats: number; bookedSeats: number }) {
  return data.bookedSeats <= data.totalSeats;
}

export const groupTourSchema = z
  .object({ companyId: z.string().min(1), ...groupTourFieldsShape })
  .refine(requiresValidDateRange, {
    error: "End date must be on or after the start date.",
    path: ["endDate"],
  })
  .refine(requiresSeatsWithinTotal, {
    error: "Booked seats cannot exceed total seats.",
    path: ["bookedSeats"],
  });

export const updateGroupTourSchema = z
  .object({ groupTourId: z.string().min(1), ...groupTourFieldsShape })
  .refine(requiresValidDateRange, {
    error: "End date must be on or after the start date.",
    path: ["endDate"],
  })
  .refine(requiresSeatsWithinTotal, {
    error: "Booked seats cannot exceed total seats.",
    path: ["bookedSeats"],
  });

export const deleteGroupTourSchema = z.object({
  groupTourId: z.string().min(1),
});

export const toggleFullGroupTourSchema = z.object({
  groupTourId: z.string().min(1),
  isFull: z.enum(["true", "false"]).transform((value) => value === "true"),
});
