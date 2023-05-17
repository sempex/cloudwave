import { Handler } from "express";

const post: Handler = async (req, res) => {
  res.send({
    url: "test",
  });
};

export { post };
