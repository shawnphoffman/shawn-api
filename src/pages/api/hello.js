import Cors from "cors";

const cors = Cors({
  methods: ["GET", "HEAD"],
  origin: [/\.shawn\.party$/],
});

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        // console.log("rejected");
        return reject(result);
      }

      // console.log("resolved");
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  // console.log("middleware");

  await runMiddleware(req, res, cors);

  // console.log("response");
  res.status(200).json({ hello: "world" });
}
