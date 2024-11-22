

class CustomError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}


const errorHandler = (err, req, res, next) =>{
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success:false,
        message:err.message || "Internal Server Error"
    })
}


module.exports ={ CustomError, errorHandler}