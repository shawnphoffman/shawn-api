import Cors from "src/utils/cors";

/*

To find your Star Wars name:
1. You take the first 3 letters from your first name and the first 2 from your last name to make your first name.
2. Then to make your last name you take the first 2 letters from your mother maiden name and the then the first 3 of the city you were born in.

For example:
- Name: Michael Johnson
- Mother's Maiden Name: Hill
- City of Birth: Talladega

First Name: *Mic*hael *Jo*hnson > "Micjo"
Last Name: *Hi*ll + *Tal*ladega > "Hital"
Output: "Micjo Hital"

*/

export default async function handler(req, res) {
  await Cors(req, res, {
    methods: ["POST", "HEAD"],
    origin: [/\.shawn\.party$/],
  });

  if (req.method !== "POST") {
    res.status(405).send({ message: "Only POST requests allowed" });
    return;
  }

  const { first, last, maiden, town } = req.body;

  // Set Cache Headers
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=599"
  );

  res.json({ first, last, maiden, town });
}
