import { ApiError } from "../utils/ApiErrors.js";
import { asyncHandeler } from "../utils/asyncHandeller.js";
import { User } from "../models/user.model.js";
import { uploadOnCloud } from "../utils/cloudenery.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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


export { registerUser };