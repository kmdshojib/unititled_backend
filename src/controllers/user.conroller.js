import { ApiError } from "../utils/ApiErrors.js";
import { asyncHandeler } from "../utils/asyncHandeller.js";
import { User } from "../models/user.model.js";
import { uploadOnCloud } from "../utils/cloudenery.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access toekn", error);
    }
}

const registerUser = asyncHandeler(async (req, res) => {
    // first we need data from user
    // validation - not empty
    // check if user already exists
    //  check for images, check for avatar,
    // upload cloudenary
    // create user object - create entry in db
    // remove password and refresh token from feild
    // check if there is user cration
    // return  response

    const { fullName, email, userName, password } = req.body;
    console.log({ fullName, email, userName, password });
    if (
        [fullName, email, userName, password].some((feild) => feild?.trim() == "")
    ) {
        throw new ApiError(400, "All feilds is required!")
    }
    const existedUser = await User.findOne({
        $or: [{ userName }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User already exists! give new Eamil or username!")
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImagePath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImagePath = req.files.coverImage[0].path;
    }
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required!");
    }
    const avatar = await uploadOnCloud(avatarLocalPath);
    const coverImage = await uploadOnCloud(coverImagePath);

    if (!avatar) {
        throw new ApiError(400, "Avatar is required!");
    }
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        userName,
        password,
        email,
        userName: userName.toLowerCase(),
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating a new user!")
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User created successfully!")
    )
})

// login user

const loginUser = asyncHandeler(async (req, res) => {
    // get data from user
    // username and email
    // find the user
    // check for password
    // access and refresh token
    // send cockies
    // send res

    const { email, userName, password } = req.body;

    if (!(userName || email)) {
        throw new ApiError(400, "Username or email is required!");
    }
    const user = await User.findOne({
        $or: [{ userName }, { email }]
    })
    if (!user) {
        throw new (404, "User does not exist!")
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Password is not correct!");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
    const loggedInUSer = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUSer, accessToken, refreshToken },
                "User logged in successfully!"
            )
        )
})

// logout the user

const logoutUser = asyncHandeler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set: { refreshToken: undefined }
    })
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully!"))
})

// refresh access token

const refreshAccessToken = asyncHandeler(async (req, res) => {
    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incommingRefreshToken) {
        throw new ApiError(401, "Unauthorized access to refresh token!")
    }
    try {
        const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid refresh token!")
        }
        if (incommingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired or invalid!");
        }
        const options = {
            httpOnly: true,
            secure: true,
        }
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)
        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access Token successfully returned!")
            )
    } catch (error) {
        throw new ApiError(401, error.message || "invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandeler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid old password")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully!"))
})
const getCurrentUser = asyncHandeler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current User fetched successfully"))
})

const updateAccountDtails = asyncHandeler(async (req, res) => {
    const { fullName, email } = req.body
    if (!fullName || !email) {
        throw new ApiError(400, "All feilds are required!")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { fullName, email }
        },
        { new: true }
    ).select("-password")

    return res.status(200)
        .json(new ApiResponse(200, user, "Account successfully updated!"))
})
const updateUserAvatar = asyncHandeler(async (req, res) => {
    const avatarLocalPath = req.files?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is missing");
    }
    const avatar = await uploadOnCloud(avatarLocalPath)

    if (!avatar?.url) {
        throw new ApiError(400, "Error uploading avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url,
            }
        },
        { new: true }
    ).select("-password")
    return res.status(200).json(
        new ApiResponse(200, user, "Avatar updated successfully!")
    )
})
const updateUserCoverImage = asyncHandeler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Cover Image is missing");
    }
    const coverImage = await uploadOnCloud(coverImageLocalPath)

    if (!avatar?.url) {
        throw new ApiError(400, "Error uploading Cover Image")
    }
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url,
            }
        },
        { new: true }
    ).select("-password")
    return res.status(200).json(
        new ApiResponse(200, user, "Cover Image updated successfully!")
    )
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserAvatar,
    updateUserCoverImage
};