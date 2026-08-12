import { UserModel } from '../models/userModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const userController = {
  getMe: asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  }),

  updateMe: asyncHandler(async (req, res) => {
    const { first_name, last_name, phone_number, avatar_url } = req.body;
    const updatedUser = await UserModel.updateProfile(req.user.id, {
      first_name,
      last_name,
      phone_number,
      avatar_url
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(updatedUser);
  })
};
