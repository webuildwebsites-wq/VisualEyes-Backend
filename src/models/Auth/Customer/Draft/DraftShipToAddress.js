import mongoose from "mongoose";

const draftShipToAddressSchema = new mongoose.Schema({
    branchName: {
        type: String,
        required: false,
        trim: true
    },
    customerContactName: {
        type: String,
        required: false,
        trim: true
    },
    customerContactNumber: {
        type: String,
        required: false,
    },
    country: {
        type: String,
        required: false,
        trim: true
    },
    state: {
        type: String,
        required: false,
        trim: true
    },
    city: {
        type: String,
        required: false,
        trim: true
    },
    zipCode: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    billingCurrency: {
        type: String,
        required: false,
        trim: true
    },
    billingMode: {
        type: String,
        required: false,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "employee",
        required: false
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "employee"
    }
}, { timestamps: true, _id: true });

export default draftShipToAddressSchema;
