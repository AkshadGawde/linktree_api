import Referral from "../models/Referral.js";

export const getReferrals = async (req, res) => {
  try {
    console.log("🔍 User ID from JWT:", req.user.id);

    const referrals = await Referral.find({ referrerId: req.user.id }).populate(
      "referredUserId",
      "username email"
    );

    res.json(referrals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getReferralStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const totalReferrals = await Referral.countDocuments({
      referrerId: userId,
    });
    const successfulReferrals = await Referral.countDocuments({
      referrerId: userId,
      status: "successful",
    });
    const pendingReferrals = await Referral.countDocuments({
      referrerId: userId,
      status: "pending",
    });

    res.json({
      totalReferrals,
      successfulReferrals,
      pendingReferrals,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
