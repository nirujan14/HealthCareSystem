import Record from "../models/Record.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const listRecords = asyncHandler(async (req, res) => {
  const items = await Record.find({ patient: req.user.id }).sort({ visitDate: -1 });
  res.json(items);
});
