import express from "express";
import {
  createDonation,
  getDonations,
  deleteDonation,
  getDonation,
  updateDonationStatus,
  claimDonation,
  countDonations,
  countDonorsRecipients,
  countClaimedDonations
} from "../controllers/donation.controller.mjs";

const router = express.Router();

router.post("/add", createDonation);
router.get("/all", getDonations);
router.get("/:id/show", getDonation);
router.get("/count", countDonations);
router.get("/count/donors-recipients", countDonorsRecipients);
router.get("/count/claimed-donations", countClaimedDonations);
router.delete("/:id/delete", deleteDonation);
router.patch("/:id/update", updateDonationStatus);
router.patch("/:id/claim", claimDonation);

export default router;
