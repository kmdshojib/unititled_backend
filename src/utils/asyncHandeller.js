const asyncHandeller = (requestHandeller) => {
    (req, res, next) => {
        Promise.resolve(requestHandeller(req, res, next)).catch((err) => next(err));
    }
}


export { asyncHandeller }

// const asyncHandeller = (fn) => async (req, res, next) => {
//     try {
//         await { req, res, next }
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// } 