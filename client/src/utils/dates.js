export const parse = (d) => new Date(`${d}T00:00:00`);

export const fmt = (d, day = "numeric") =>
  parse(d).toLocaleDateString("en-US", { month: "long", day, year: "numeric" });

export const fmtShort = (d) =>
  parse(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });