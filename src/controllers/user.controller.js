import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { uploadOnCloudinary } from "../utils/uploadToCloudinary.js";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, mobile, password, role, fcmToken, deviceId } = req.body;

  if (
    [name, email, mobile, password, role].some((field) => field?.trim() === "")
  ) {
    return res
      .status(200)
      .json({ success: false, message: "All fields are required!" });
  }

  const existedUser = await User.findOne({
    $or: [{ mobile }, { email }],
  });

  if (existedUser) {
    return res.status(200).json({
      success: false,
      message: "User with email or mobile number already exists!",
    });
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    mobile,
    fcmToken,
    deviceId,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!createdUser) {
    return res.status(200).json({
      success: false,
      message: "Something went wrong while registering the user!",
    });
  }

  return res
    .status(200)
    .json({ success: true, message: "User registered successfully!" });
});

const loginUser = asyncHandler(async (req, res) => {
  const { emailMobile, password } = req.body;
  if (!emailMobile) {
    return res.status(200).json({
      success: false,
      message: "Email or mobile number is required!",
    });
  }

  const user = await User.findOne({
    $or: [{ mobile: emailMobile }, { email: emailMobile }],
  });
  if (!user) {
    return res.status(200).json({
      success: false,
      message: "User does not exist!",
    });
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    return res.status(200).json({
      success: false,
      message: "Invalid login credentials!",
    });
  }

  await User.findByIdAndUpdate(user._id, {
    is_logged_in: true,
  });

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      success: true,
      message: "User loggedin successfully",
      user: loggedInUser,
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
});

const logoutUser = asyncHandler(async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.body.userId, {
      $set: {
        refreshToken: null,
        is_logged_in: false,
      },
    });

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json({ success: true, message: "User logged out successfully!" });
  } catch (error) {
    console.log(error);
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    return res
      .status(200)
      .json({ success: false, message: "Unauthorized request!" });
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      return res.status(200).json({
        success: false,
        message: "Refresh token is expired or used!",
      });
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json({
        success: true,
        message: "Access token refreshed successfully!",
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
  } catch (error) {
    return res
      .status(200)
      .json({ success: false, message: "Invalid refresh token!" });
  }
});

const removeProfilePhoto = asyncHandler(async (req, res) => {
  const { user_id } = req.body;

  await User.findByIdAndUpdate(user_id, {
    profile_url: "",
  });

  return res.status(200).json({
    success: true,
    message: "Profile photo removed successfully!",
  });
});

const updateProfilePhoto = asyncHandler(async (req, res) => {
  const { user_id } = req.body;

  let avatarLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files.avatar[0].path;
  }

  if (!avatarLocalPath) {
    return res.status(200).json({
      success: false,
      message: "Profile photo file is required!",
    });
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath, "PROFILE_PHOTO");
  if (!avatar) {
    return res.status(200).json({
      success: false,
      message: "Profile photo file is required!",
    });
  }

  await User.findByIdAndUpdate(user_id, {
    profile_url: avatar.url,
  });

  return res.status(200).json({
    success: true,
    message: "Profile photo uploaded successfully!",
    profile_url: avatar.url,
  });
});

const updateDeviceIdentities = asyncHandler(async (req, res) => {
  const { fcmToken, deviceId, user_id } = req.body;

  const updatedUser = await User.findByIdAndUpdate(user_id, {
    fcmToken: fcmToken,
    deviceId: deviceId,
  });

  if (!updatedUser) {
    return res.status(200).json({
      success: false,
      message: "Failed to update device id and fcm token!",
    });
  }

  return res.status(200).json({
    success: false,
    message: "Device id and fcm token updated successfully!",
  });
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  removeProfilePhoto,
  updateProfilePhoto,
  updateDeviceIdentities,
};