/**
 * Quicky — Time slot utilities
 *
 * Assumptions:
 * - Times use HH:mm (24-hour format).
 * - All slots belong to the same calendar day.
 * - Overnight sessions are not supported yet.
 */

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const toMinutes = (time) => {
  if (typeof time !== "string" || !TIME_PATTERN.test(time)) {
    return null;
  }

  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const toTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

/**
 * Internal helper: normalize and merge time ranges.
 * Adjacent and overlapping ranges are merged.
 *
 * Invalid ranges are excluded.
 */
const getMergedRanges = (slotIds = [], slots = []) => {
  if (!Array.isArray(slotIds) || !Array.isArray(slots)) {
    return [];
  }

  const slotMap = new Map(slots.map((slot) => [slot.id, slot]));

  const ranges = [...new Set(slotIds)]
    .map((id) => slotMap.get(id))
    .filter(Boolean)
    .map((slot) => ({
      start: toMinutes(slot.startTime),
      end: toMinutes(slot.endTime),
    }))
    .filter(({ start, end }) => start !== null && end !== null && start < end)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const merged = [];

  for (const range of ranges) {
    const last = merged[merged.length - 1];

    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }

  return merged;
};

/**
 * 1. Merge participant slots for display.
 *
 * Example:
 * 13:00–15:00 + 15:00–16:00 => "13:00–16:00"
 * 13:00–15:00 + 14:00–16:00 => "13:00–16:00"
 * 13:00–14:00 + 16:00–17:00
 *   => "13:00–14:00, 16:00–17:00"
 */
export const mergeTimeSlots = (slotIds = [], slots = []) => {
  return getMergedRanges(slotIds, slots)
    .map(({ start, end }) => `${toTime(start)}–${toTime(end)}`)
    .join(", ");
};

/**
 * 2. Calculate participant playing time in minutes.
 * Overlapping intervals are counted only once.
 *
 * Returns: integer number of minutes.
 */
export const getParticipantMinutes = (slotIds = [], slots = []) => {
  return getMergedRanges(slotIds, slots).reduce(
    (total, { start, end }) => total + (end - start),
    0,
  );
};

/**
 * 3. Validate session slots before saving.
 *
 * Returns:
 * {
 *   valid: boolean,
 *   errors: Array<{
 *     code: string,
 *     index: number,
 *     relatedIndex?: number
 *   }>
 * }
 *
 * Notes:
 * - Adjacent slots are valid.
 * - Overlapping slots are invalid.
 * - Empty slots are invalid.
 * - courtCount must be a positive integer.
 */
export const validateSessionSlots = (slots) => {
  const errors = [];

  if (!Array.isArray(slots) || slots.length === 0) {
    return {
      valid: false,
      errors: [{ code: "NO_SLOTS", index: -1 }],
    };
  }

  const validRanges = [];

  slots.forEach((slot, index) => {
    if (!slot || typeof slot !== "object" || Array.isArray(slot)) {
      errors.push({ code: "INVALID_SLOT", index });
      return;
    }

    const start = toMinutes(slot.startTime);
    const end = toMinutes(slot.endTime);

    if (start === null || end === null) {
      errors.push({ code: "INVALID_TIME_FORMAT", index });
    } else if (start >= end) {
      errors.push({ code: "INVALID_TIME_RANGE", index });
    } else {
      validRanges.push({ start, end, index });
    }

    if (
      !Number.isInteger(Number(slot.courtCount)) ||
      Number(slot.courtCount) < 1 ||
      slot.courtCount === null ||
      slot.courtCount === ""
    ) {
      errors.push({ code: "INVALID_COURT_COUNT", index });
    }

    // maxPlayers is optional; null or 0 means unspecified.
    if (
      slot.maxPlayers != null &&
      slot.maxPlayers !== "" &&
      Number(slot.maxPlayers) !== 0 &&
      (!Number.isInteger(Number(slot.maxPlayers)) ||
        Number(slot.maxPlayers) < 1)
    ) {
      errors.push({ code: "INVALID_MAX_PLAYERS", index });
    }
  });

  validRanges.sort((a, b) => a.start - b.start || a.end - b.end);

  // Detect every overlapping pair, including nested intervals.
  for (let i = 0; i < validRanges.length; i++) {
    for (let j = i + 1; j < validRanges.length; j++) {
      const first = validRanges[i];
      const second = validRanges[j];

      if (second.start >= first.end) break;

      if (second.start < first.end && second.end > first.start) {
        errors.push({
          code: "OVERLAPPING_SLOTS",
          index: first.index,
          relatedIndex: second.index,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
