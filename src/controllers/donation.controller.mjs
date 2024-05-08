import mongoose from "mongoose";
import Donation from "../models/donation.model.mjs";
import Item from "../models/item.model.mjs";
import User from "../models/user.model.mjs";
import Chat from "../models/chat.model.mjs";
import Message from "../models/message.model.mjs";

// @route   POST /api/donation/add
// @desc    Create a new donation
// @access  Private
export const createDonation = async (req, res) => {
  const {
    items,
    donationType,
    amount,
    cardNumber,
    cardName,
    expiry,
    cvv,
    quantity,
  } = req.body;
  const errors = [];

  if (!donationType) {
    errors.push({ message: "Donation Type is required" });
  }

  if (donationType === "Money") {
    if (!cardNumber) {
      errors.push({ message: "Card Number is required" });
    }

    if (!cardName) {
      errors.push({ message: "Card Name is required" });
    }

    if (!expiry) {
      errors.push({ message: "Expiry is required" });
    }

    if (!cvv) {
      errors.push({ message: "CVV is required" });
    }
  }

  if (donationType === "Food Items" && items.length === 0) {
    errors.push({ message: "Items are required" });
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0].message });
  }

  try {
    // Create a new donation
    const donation = new Donation({
      donor: req.user._id,
      donationType,
      amount,
      quantity,
      items,
      cardNumber,
      cardName,
      expiry,
      cvv,
    });

    // Save the donation to the database
    await donation.save();

    // Minus the quantity of the items
    if (donationType === "Food Items") {
      for (let i = 0; i < items.length; i++) {
        const item = await Item.findById(items[i]);
        item.quantity = parseInt(item.quantity, 10) - parseInt(quantity[i], 10);
        await item.save();
      }
    }

    // Send the donation as a response
    return res
      .status(201)
      .json({ success: true, message: "Donation created successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/donation/all
// @desc    Show all donations
// @access  Private
export const getDonations = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.userType === "Recipient" || user.userType === "Admin") {
      const donations = await Donation.aggregate([
        {
          $match: {},
        },
        {
          $lookup: {
            from: "items",
            localField: "items",
            foreignField: "_id",
            as: "items",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "donor",
            foreignField: "_id",
            as: "donor",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "recipient",
            foreignField: "_id",
            as: "recipient",
          },
        },
        {
          $unwind: "$donor",
        },
        {
          $unwind: "$recipient",
        },
        {
          $project: {
            "donor.password": 0,
            "donor.email": 0,
            "donor.phone": 0,
            "donor.isVerified": 0,
            "donor.userType": 0,
            "donor.createdAt": 0,
            "donor.updatedAt": 0,
            "donor.__v": 0,
            "recipient.password": 0,
            "recipient.email": 0,
            "recipient.phone": 0,
            "recipient.isVerified": 0,
            "recipient.userType": 0,
            "recipient.createdAt": 0,
            "recipient.updatedAt": 0,
            "recipient.__v": 0,
          },
        },
      ]);
      return res.status(200).json({ success: true, donations });
    } else {
      const donations = await Donation.aggregate([
        {
          $match: {
            donor: req.user._id,
          },
        },
        {
          $lookup: {
            from: "items",
            localField: "items",
            foreignField: "_id",
            as: "items",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "donor",
            foreignField: "_id",
            as: "donor",
          },
        },
        {
          $unwind: "$donor",
        },
        {
          $project: {
            "donor.password": 0,
            "donor.email": 0,
            "donor.phone": 0,
            "donor.isVerified": 0,
            "donor.userType": 0,
            "donor.createdAt": 0,
            "donor.updatedAt": 0,
            "donor.__v": 0,
          },
        },
      ]);
      return res.status(200).json({ success: true, donations });
    }
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

// @route   GET /api/donation/:id/show
// @desc    Show a single donation
// @access  Private
export const getDonation = async (req, res) => {
  try {
    const donation = await Donation.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.id),
        },
      },
      {
        $lookup: {
          from: "items",
          localField: "items",
          foreignField: "_id",
          as: "items",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "donor",
          foreignField: "_id",
          as: "donor",
        },
      },
      {
        $unwind: "$donor",
      },
      {
        $project: {
          "donor.password": 0,
          "donor.email": 0,
          "donor.phone": 0,
          "donor.isVerified": 0,
          "donor.userType": 0,
          "donor.createdAt": 0,
          "donor.updatedAt": 0,
          "donor.__v": 0,
        },
      },
    ]);
    return res.status(200).json({ success: true, donation: donation[0] });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

// @route   PATCH /api/donation/:id/update
// @desc    Update a donation status
// @access  Private
export const updateDonationStatus = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    donation.donationStatus = req.body.donationStatus;
    donation.donationStatusDescription = req.body.donationStatusDescription;
    await donation.save();
    return res.status(200).json({
      success: true,
      message: "Donation status is updated successfully",
    });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

// @route   DELETE /api/donation/:id/delete
// @desc    Delete a donation
// @access  Private
export const deleteDonation = async (req, res) => {
  try {
    await Donation.findByIdAndDelete(req.params.id);

    // Revert the quantity of the items
    const donation = await Donation.findById(req.params.id);
    if (donation.donationType === "Food Items") {
      for (let i = 0; i < donation.items.length; i++) {
        const item = await Item.findById(donation.items[i]);
        item.quantity = item.quantity + donation.quantity[i];
        await item.save();
      }
    }

    return res
      .status(200)
      .json({ success: true, message: "Donation deleted successfully" });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

// @route  PATCH /api/donation/:id/claim
// @desc   Claim a donation
// @access Private
export const claimDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id).populate("items");
    donation.recipient = req.user._id;
    donation.donationStatus = "Claimed";
    donation.donationStatusDescription = "Recipient has claimed the donation";
    await donation.save();

    const chat = await Chat.find({
      $and: [
        { users: { $elemMatch: { $eq: donation.donor } } },
        { users: { $elemMatch: { $eq: donation.recipient } } },
      ],
    });

    if (chat.length === 0) {
      const newChat = new Chat({
        chatName: "sender",
        users: [donation.donor, donation.recipient],
      });
      await newChat.save();

      // Map the items and add comma between them
      const items = donation.items.map((item) => item.name).join(", ");

      // Send message to the donor
      const newMessage = new Message({
        sender: req.user._id,
        content: `I have claimed ${items || donation.amount}`,
        chat: newChat._id,
      });
      await newMessage.save();
    }

    return res
      .status(200)
      .json({ success: true, message: "Donation claimed successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route  GET /api/donation/count
// @desc   Count the number of donations
// @access Private
export const countDonations = async (req, res) => {
  try {
    const count = await Donation.countDocuments();
    return res.status(200).json({ success: true, count });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route  GET /api/donation/count/donors-recipients
// @desc   Count the number of donors and recipients
// @access Private
export const countDonorsRecipients = async (_req, res) => {
  try {
    const donors = await User.countDocuments({
      $and: [{ userType: "Donor" }, { isVerified: true }],
    });
    const recipients = await User.countDocuments({
      $and: [{ userType: "Recipient" }, { isVerified: true }],
    });
    return res.status(200).json({ success: true, donors, recipients });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/donation/count/claimed-donations
// @desc Count the number of claimed donations
// @access Private
export const countClaimedDonations = async (_req, res) => {
  try {
    const claimedDonations = await Donation.countDocuments({
      donationStatus: "Claimed",
    });
    return res.status(200).json({ success: true, claimedDonations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
