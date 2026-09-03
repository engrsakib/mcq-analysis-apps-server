type DateRangeResult =
  | { ok: true; startDate: Date; endDate: Date }
  | { ok: false; message: string };

const endOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

export function parsePersonalGrowthDateRange(
  range: string,
  startQuery?: string,
  endQuery?: string
): DateRangeResult {
  let startDate: Date;
  let endDate: Date;

  switch (range) {
    case "last7":
      endDate = endOfDay(new Date());
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 6);
      startDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate()
      );
      break;
    case "last15":
      endDate = endOfDay(new Date());
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 14);
      startDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate()
      );
      break;
    case "last30":
      endDate = endOfDay(new Date());
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 29);
      startDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate()
      );
      break;
    case "lastMonth": {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - 1);
      startDate = new Date(d.getFullYear(), d.getMonth(), 1);
      endDate = endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));
      break;
    }
    case "lastYear": {
      const d = new Date();
      const year = d.getFullYear() - 1;
      startDate = new Date(year, 0, 1);
      endDate = endOfDay(new Date(year, 11, 31));
      break;
    }
    case "custom": {
      if (!startQuery || !endQuery) {
        return {
          ok: false,
          message: "Custom range requires start and end query parameters",
        };
      }
      startDate = new Date(startQuery);
      endDate = endOfDay(new Date(endQuery));
      break;
    }
    default:
      endDate = endOfDay(new Date());
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 6);
      startDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate()
      );
  }

  return { ok: true, startDate, endDate };
}
