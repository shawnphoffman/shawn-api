import cors from "cors";

function init(middleware) {
  return (req, res, options) =>
    new Promise((resolve, reject) => {
      middleware(options)(req, res, (result) => {
        if (result instanceof Error) {
          return reject(result);
        }

        return resolve(result);
      });
    });
}

const CorsBoi = init(cors);

export default CorsBoi;
