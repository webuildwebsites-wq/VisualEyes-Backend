import mongoose from "mongoose";

const shipToAddressSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    customerRefId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },
    shipToCustomerName: {
        type: String,
        required: true,
        trim: true
    },
    shipToCustomerEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },
    shipToCustomerContactNumber: {
        type: String,
        required: true,
        match: [/^[0-9]{10}$/, "Contact number must be 10 digits"]
    },
    billingAddress: {
        type: String,
        required: true,
        trim: true
    },
    shipToAddress: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    shipToAddressZipCode: {
        type: String,
        required: true,
        trim: true
    },
    gstNumber: {
        type: String,
        uppercase: true,
        trim: true
    },
    gstImage: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "employee",
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "employee"
    }
}, { timestamps: true });

export default shipToAddressSchema;