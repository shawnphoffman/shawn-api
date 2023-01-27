import Cors from "src/utils/cors";

export default async function handler(req, res) {
  await Cors(req, res, {
    methods: ["GET", "HEAD"],
    origin: [/\.shawn\.party$/],
  });

  res.status(200).json({ hello: "world" });
}
