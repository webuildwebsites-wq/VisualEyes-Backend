import mongoose from "mongoose";
import { sendErrorResponse, sendSuccessResponse } from "../../../../Utils/response/responseHandler.js";
import Customer from "../../../../models/Auth/Customer.js";
import customerDraftSchema from "../../../../models/Auth/CustomerDraft.js";
import dotenv from "dotenv";
dotenv.config();

export const customerDraftRegistration = async (req, res) => {
  try {
    const {
      CustomerType,
      CustomerTypeRefId,
      zone,
      zoneRefId,
      brandCategories,
      specificLab,
      specificLabRefId,
      emailId,
      businessEmail,
      shopName,
      ownerName,
      orderMode,
      mobileNo1,
      mobileNo2,
      landlineNo,
      gstType,
      gstTypeRefId,
      plant,
      plantRefId,
      fittingCenter,
      fittingCenterRefId,
      creditDays,
      creditDaysRefId,
      creditLimit,
      courierName,
      courierNameRefId,
      courierTime,
      courierTimeRefId,
      address,
      IsGSTRegistered,
      GSTNumber,
      GSTCertificateImg,
      PANCard,
      AadharCard,
      PANCardImg,
      AadharCardImg,
      salesPerson,
      salesPersonRefId,
      customerpassword,
    } = req.body;

    const userEmployeeType = req.user?.EmployeeType;
    const userDepartment = userEmployeeType === 'SUPERADMIN' ? 'SUPERADMIN' : req.user?.Department?.name || req.user?.Department;
    const isSalesDepartment = userDepartment === "SALES";
    const isFinanceDepartment = userDepartment === "FINANCE" || userEmployeeType === "SUPERADMIN";


     const normalizedEmail = emailId?.trim().toLowerCase();
     console.log("normalizedEmail :  ",normalizedEmail);

    if (normalizedEmail) {
      const query = [];

      if (normalizedEmail) {
        query.push({ emailId : normalizedEmail });
      }

      const existingDraft = await customerDraftSchema.findOne({ $or: query });

      if (existingDraft) {
        return sendErrorResponse(res,409,"DRAFT_EXISTS","Draft employee with this email or username already exists");
      }
    }
    
    const customerData = {
      // Customer Info.
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      CustomerType: CustomerTypeRefId ? {
        name: CustomerType,
        refId: CustomerTypeRefId
      } : undefined,
      orderMode,
      mobileNo1,
      mobileNo2,
      landlineNo,
      emailId: emailId && emailId.trim() ? emailId.toLowerCase().trim() : undefined,
      businessEmail: businessEmail && businessEmail.trim() ? businessEmail.toLowerCase().trim() : undefined,
      IsGSTRegistered,
      GSTNumber: IsGSTRegistered ? GSTNumber : undefined,
      gstType: IsGSTRegistered && gstType ? {
        name: gstType,
        refId: gstTypeRefId
      } : undefined,
      GSTCertificateImg: IsGSTRegistered ? GSTCertificateImg : undefined,
      PANCard: !IsGSTRegistered ? PANCard : undefined,
      AadharCard: !IsGSTRegistered ? AadharCard : undefined,
      PANCardImg: !IsGSTRegistered ? PANCardImg : undefined,
      AadharCardImg: !IsGSTRegistered ? AadharCardImg : undefined,

      // Address
      address: address.map((addr) => ({
        branchAddress: addr.branchAddress.trim(),
        contactPerson: addr.contactPerson.trim(),
        contactNumber: addr.contactNumber.trim(),
        country: addr.country,
        state: addr.state,
        zipCode: addr.zipCode,
        city: addr.city.trim(),
        billingCurrency: addr.billingCurrency,
        billingMode: addr.billingMode,
      })),

      // Customer Registration - Only for FINANCE department or SUPERADMIN
      password: (isFinanceDepartment || userEmployeeType === 'SUPERADMIN') ? customerpassword : undefined,
      brandCategories: (isFinanceDepartment || userEmployeeType === 'SUPERADMIN') && brandCategories 
        ? brandCategories
            .filter(bc => bc.brandId && bc.brandId.trim() !== '')
            .map(bc => ({
              brandName: bc.brandName,
              brandId: bc.brandId,
              categories: bc.categories
                .filter(cat => cat.categoryId && cat.categoryId.trim() !== '')
                .map(cat => ({
                  categoryName: cat.categoryName,
                  categoryId: cat.categoryId
                }))
            }))
        : undefined,

      zone: (isFinanceDepartment || userEmployeeType === 'SUPERADMIN') && zone && zoneRefId ? {
        name: zone,
        refId: zoneRefId
      } : undefined,
      
      salesPerson: (isFinanceDepartment || userEmployeeType === 'SUPERADMIN') && salesPerson && salesPersonRefId ? {
        name: salesPerson,
        refId: salesPersonRefId
      } : undefined,
      
      specificLab: (isFinanceDepartment || userEmployeeType === 'SUPERADMIN') && specificLab && specificLabRefId ? {
        name: specificLab,
        refId: specificLabRefId
      } : undefined,

      fittingCenter: (isFinanceDepartment || userEmployeeType === 'SUPERADMIN') && fittingCenter && fittingCenterRefId ? {
        name: fittingCenter,
        refId: fittingCenterRefId
      } : undefined,

      plant: (isFinanceDepartment || userEmployeeType === 'SUPERADMIN') && plant && plantRefId ? {
        name: plant,
        refId: plantRefId
      } : undefined,

      creditLimit: (isFinanceDepartment || userEmployeeType === 'SUPERADMIN') ? creditLimit : null,

      creditDays: (isFinanceDepartment || userEmployeeType === 'SUPERADMIN') && creditDays && creditDaysRefId ? {
        name: creditDays,
        refId: creditDaysRefId
      } : undefined,

      courierName: (isFinanceDepartment || userEmployeeType === 'SUPERADMIN') && courierName && courierNameRefId ? {
        name: courierName,
        refId: courierNameRefId
      } : undefined,

      courierTime: (isFinanceDepartment || userEmployeeType === 'SUPERADMIN') && courierTime && courierTimeRefId ? {
        name: courierTime,
        refId: courierTimeRefId
      } : undefined,

      // System Internal details
      dcWithoutValue: false,
      designation: "Customer",
      createdBy: req.user.id,
      createdByDepartment: userDepartment,
      approvalStatus: isSalesDepartment ? 'PENDING_FINANCE' : 'APPROVED',
    };

    const customer = await customerDraftSchema.create(customerData);
    const customerObj = customer.toObject();
    delete customerObj.password;
    delete customerObj.emailOtp;
    delete customerObj.mobileOtp;

    const message = isSalesDepartment
      ? "Customer registered successfully. Pending Finance approval."
      : "Customer registered and approved successfully.";

    return sendSuccessResponse(res, 201, { customer: customerObj }, message);
  } catch (error) {
    console.error("Customer registration error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return sendErrorResponse(
        res,
        400,
        "MONGOOSE_VALIDATION_ERROR",
        messages.join(", "),
      );
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return sendErrorResponse(
        res,
        409,
        "DUPLICATE_FIELD",
        `${field} already exists`,
      );
    }
    return sendErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      "Customer registration failed",
    );
  }
};

export const getAllDraftCustomers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const { 
      shopName, 
      customerType, 
      status = "active", 
      createdByDepartment, 
      zone, 
      specificBrand, 
      specificCategory, 
      fromDate, 
      toDate 
    } = req.query;

    let query = {};

    if (shopName) {
      query.shopName = { $regex: shopName, $options: 'i' };
    }

    if (customerType) {
      query['CustomerType.refId'] = customerType;
    }

    if (status) {
      if (status.toLowerCase() === 'active') {
        query['Status.isActive'] = true;
        query['Status.isSuspended'] = false;
      } else if (status.toLowerCase() === 'suspended') {
        query['Status.isSuspended'] = true;
      } else if (status.toLowerCase() === 'inactive') {
        query['Status.isActive'] = false;
      }
    }

    if (createdByDepartment) {
      query.createdByDepartment = createdByDepartment.toUpperCase();
    }

    if (zone) {
      query['zone.refId'] = zone;
    }

    if (specificBrand) {
      query['brandCategories.brandId'] = specificBrand;
    }

    if (specificCategory) {
      query['brandCategories.categories.categoryId'] = specificCategory;
    }

    if (fromDate || toDate) {
      query.createdAt = {};
      
      if (fromDate) {
        const startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0);
        query.createdAt.$gte = startDate;
      }
      
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    const [customers, total] = await Promise.all([
      customerDraftSchema
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      customerDraftSchema.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    const pagination = {
      currentPage: page,
      totalPages,
      totalCustomers: total,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    return sendSuccessResponse(res, 200, { customers, pagination }, 'Customers retrieved successfully');

  } catch (error) {
    console.error('Get filtered customers error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve customers');
  }
};

export const getMyDraftCustomers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;
    const userId = req.user.id;

    const { 
      shopName, 
      customerType, 
      status, 
      createdByDepartment, 
      zone, 
      specificBrand, 
      specificCategory, 
      fromDate, 
      toDate 
    } = req.query;

    let query = { createdBy: userId };

    if (shopName) {
      query.shopName = { $regex: shopName, $options: 'i' };
    }

    if (customerType) {
      query['CustomerType.refId'] = customerType;
    }

    if (status) {
      if (status.toLowerCase() === 'active') {
        query['Status.isActive'] = true;
        query['Status.isSuspended'] = false;
      } else if (status.toLowerCase() === 'suspended') {
        query['Status.isSuspended'] = true;
      } else if (status.toLowerCase() === 'inactive') {
        query['Status.isActive'] = false;
      }
    }

    if (createdByDepartment) {
      query.createdByDepartment = createdByDepartment.toUpperCase();
    }

    if (zone) {
      query['zone.refId'] = zone;
    }

    if (specificBrand) {
      query['brandCategories.brandId'] = specificBrand;
    }

    if (specificCategory) {
      query['brandCategories.categories.categoryId'] = specificCategory;
    }

    if (fromDate || toDate) {
      query.createdAt = {};
      
      if (fromDate) {
        const startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0);
        query.createdAt.$gte = startDate;
      }
      
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    const [customers, total] = await Promise.all([
      customerDraftSchema
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      customerDraftSchema.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    const pagination = {
      currentPage: page,
      totalPages,
      totalCustomers: total,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    return sendSuccessResponse(res, 200, { customers, pagination }, 'Draft customers retrieved successfully');

  } catch (error) {
    console.error('Get draft customers error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve draft customers');
  }
};


export const updateDraftCustomer = async (req, res) => {
  try {
    const { draftId } = req.params;
    const updateData = req.body;
    const userId = req.user.id;
    const userEmployeeType = req.user?.EmployeeType;
    const userDepartment = userEmployeeType === 'SUPERADMIN' ? 'SUPERADMIN' : req.user?.Department?.name || req.user?.Department;

    const draftCustomer = await customerDraftSchema.findById(draftId);

    if (!draftCustomer) {
      return sendErrorResponse(res, 404, 'NOT_FOUND', 'Draft customer not found');
    }

    // Check if user has permission to update
    const isCreator = draftCustomer.createdBy.toString() === userId;
    const isFinanceDepartment = userDepartment === 'FINANCE' || userEmployeeType === 'SUPERADMIN';

    if (!isCreator && !isFinanceDepartment) {
      return sendErrorResponse(res, 403, 'FORBIDDEN', 'You do not have permission to update this draft');
    }

    // Check if email is being changed and if it already exists
    if (updateData.emailId && updateData.emailId.toLowerCase() !== draftCustomer.emailId) {
      const [existingCustomer, existingDraft] = await Promise.all([
        Customer.findOne({ emailId: updateData.emailId.toLowerCase() }),
        customerDraftSchema.findOne({
          emailId: updateData.emailId.toLowerCase(),
          _id: { $ne: draftId }
        })
      ]);

      if (existingCustomer || existingDraft) {
        return sendErrorResponse(res, 409, 'EMAIL_EXISTS', 'Email already exists');
      }
    }

    // Prepare update object
    const updateFields = {};

    // Basic fields that can be updated by creator
    if (updateData.shopName) updateFields.shopName = updateData.shopName.trim();
    if (updateData.ownerName) updateFields.ownerName = updateData.ownerName.trim();
    if (updateData.orderMode) updateFields.orderMode = updateData.orderMode;
    if (updateData.mobileNo1) updateFields.mobileNo1 = updateData.mobileNo1;
    if (updateData.mobileNo2) updateFields.mobileNo2 = updateData.mobileNo2;
    if (updateData.landlineNo !== undefined) updateFields.landlineNo = updateData.landlineNo;
    if (updateData.emailId) updateFields.emailId = updateData.emailId.toLowerCase().trim();
    if (updateData.businessEmail) updateFields.businessEmail = updateData.businessEmail.toLowerCase().trim();
    
    // Business details fields (can be updated by creator)
    if (updateData.yearOfEstablishment !== undefined) updateFields.yearOfEstablishment = updateData.yearOfEstablishment;
    if (updateData.proposedDiscount !== undefined) updateFields.proposedDiscount = updateData.proposedDiscount;
    if (updateData.currentlyDealtBrands !== undefined) updateFields.currentlyDealtBrands = updateData.currentlyDealtBrands?.trim();
    if (updateData.minSalesValue !== undefined) updateFields.minSalesValue = updateData.minSalesValue;

    if (updateData.CustomerType && updateData.CustomerTypeRefId) {
      updateFields.CustomerType = {
        name: updateData.CustomerType,
        refId: updateData.CustomerTypeRefId
      };
    }

    if (updateData.IsGSTRegistered !== undefined) {
      updateFields.IsGSTRegistered = updateData.IsGSTRegistered;

      if (updateData.IsGSTRegistered) {
        if (updateData.GSTNumber) updateFields.GSTNumber = updateData.GSTNumber;
        if (updateData.GSTCertificateImg) updateFields.GSTCertificateImg = updateData.GSTCertificateImg;
        if (updateData.gstType && updateData.gstTypeRefId) {
          updateFields.gstType = {
            name: updateData.gstType,
            refId: updateData.gstTypeRefId
          };
        }
        // Clear non-GST fields
        updateFields.PANCard = undefined;
        updateFields.AadharCard = undefined;
        updateFields.PANCardImg = undefined;
        updateFields.AadharCardImg = undefined;
      } else {
        if (updateData.PANCard) updateFields.PANCard = updateData.PANCard;
        if (updateData.AadharCard) updateFields.AadharCard = updateData.AadharCard;
        if (updateData.PANCardImg) updateFields.PANCardImg = updateData.PANCardImg;
        if (updateData.AadharCardImg) updateFields.AadharCardImg = updateData.AadharCardImg;
        // Clear GST fields
        updateFields.GSTNumber = undefined;
        updateFields.GSTCertificateImg = undefined;
        updateFields.gstType = undefined;
      }
    }

    if (updateData.address && Array.isArray(updateData.address)) {
      updateFields.address = updateData.address.map((addr) => ({
        branchAddress: addr.branchAddress?.trim(),
        contactPerson: addr.contactPerson?.trim(),
        contactNumber: addr.contactNumber?.trim(),
        country: addr.country,
        state: addr.state,
        zipCode: addr.zipCode,
        city: addr.city?.trim(),
        billingCurrency: addr.billingCurrency,
        billingMode: addr.billingMode,
      }));
    }

    // Finance-only fields
    if (isFinanceDepartment) {
      if (updateData.customerpassword) {
        updateFields.password = updateData.customerpassword;
      }

      if (updateData.brandCategories) {
        updateFields.brandCategories = updateData.brandCategories
          .filter(bc => bc.brandId && bc.brandId.trim() !== '')
          .map(bc => ({
            brandName: bc.brandName,
            brandId: bc.brandId,
            categories: bc.categories
              .filter(cat => cat.categoryId && cat.categoryId.trim() !== '')
              .map(cat => ({
                categoryName: cat.categoryName,
                categoryId: cat.categoryId
              }))
          }));
      }

      if (updateData.zone && updateData.zoneRefId) {
        updateFields.zone = {
          name: updateData.zone,
          refId: updateData.zoneRefId
        };
      }

      if (updateData.salesPerson && updateData.salesPersonRefId) {
        updateFields.salesPerson = {
          name: updateData.salesPerson,
          refId: updateData.salesPersonRefId
        };
      }

      if (updateData.specificLab && updateData.specificLabRefId) {
        updateFields.specificLab = {
          name: updateData.specificLab,
          refId: updateData.specificLabRefId
        };
      }

      if (updateData.fittingCenter && updateData.fittingCenterRefId) {
        updateFields.fittingCenter = {
          name: updateData.fittingCenter,
          refId: updateData.fittingCenterRefId
        };
      }

      if (updateData.plant && updateData.plantRefId) {
        updateFields.plant = {
          name: updateData.plant,
          refId: updateData.plantRefId
        };
      }

      if (updateData.creditLimit !== undefined) {
        updateFields.creditLimit = updateData.creditLimit;
      }

      if (updateData.creditDays && updateData.creditDaysRefId) {
        updateFields.creditDays = {
          name: updateData.creditDays,
          refId: updateData.creditDaysRefId
        };
      }

      if (updateData.courierName && updateData.courierNameRefId) {
        updateFields.courierName = {
          name: updateData.courierName,
          refId: updateData.courierNameRefId
        };
      }

      if (updateData.courierTime && updateData.courierTimeRefId) {
        updateFields.courierTime = {
          name: updateData.courierTime,
          refId: updateData.courierTimeRefId
        };
      }

      if (updateData.finalDiscount !== undefined) {
        updateFields.finalDiscount = updateData.finalDiscount;
      }
    }

    const updatedDraft = await customerDraftSchema.findByIdAndUpdate(
      draftId,
      { $set: updateFields },
      { returnDocument: 'after', runValidators: true }
    ).select('-password');

    return sendSuccessResponse(res, 200, { customer: updatedDraft }, 'Draft customer updated successfully');

  } catch (error) {
    console.error('Update draft customer error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', messages.join(', '));
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return sendErrorResponse(res, 409, 'DUPLICATE_FIELD', `${field} already exists`);
    }
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to update draft customer');
  }
};

export const deactivateCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const userEmployeeType = req.user?.EmployeeType;
    const userDepartment = userEmployeeType === 'SUPERADMIN' ? 'SUPERADMIN' : req.user?.Department?.name || req.user?.Department;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return sendErrorResponse(res, 400, 'INVALID_ID', 'Invalid customer ID format');
    }

    const isFinanceDepartment = userDepartment === 'FINANCE' || userEmployeeType === 'SUPERADMIN';

    if (!isFinanceDepartment) {
      return sendErrorResponse(res, 403, 'FORBIDDEN', 'You do not have permission to delete this customer');
    }

    const user = await Customer.findOne({ _id: customerId, 'Status.isActive': true, isDeleted: false });
    if (!user) {
      return sendErrorResponse(res, 404, 'USER_NOT_FOUND', 'Customer not found or already deactivated');
    }

    user.Status.isActive = false;
    user.Status.isSuspended = true;
    user.Status.suspensionReason = req?.body?.suspensionReason || 'N/A';
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = req.user.id;
    await user.save({ validateBeforeSave: false });

    return sendSuccessResponse(res, 200, null, 'Customer moved to recycle bin. Will be permanently deleted after 30 days');

  } catch (error) {
    console.error('Deactivate Customer Error:', error);

    if (error.name === 'CastError') {
      return sendErrorResponse(res, 400, 'INVALID_ID', `Invalid ${error.path} format. Please provide a valid MongoDB ObjectId`);
    }

    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to deactivate customer');
  }
};

export const deactivateDraftCustomer = async (req, res) => {
  try {
    const { draftId } = req.params;
    const userEmployeeType = req.user?.EmployeeType;
    const userDepartment = userEmployeeType === 'SUPERADMIN' ? 'SUPERADMIN' : req.user?.Department?.name || req.user?.Department;

    if (!mongoose.Types.ObjectId.isValid(draftId)) {
      return sendErrorResponse(res, 400, 'INVALID_ID', 'Invalid draft customer ID format');
    }

    const isFinanceDepartment = userDepartment === 'FINANCE' || userEmployeeType === 'SUPERADMIN';

    const draftCustomer = await customerDraftSchema.findOne({ _id: draftId, 'Status.isActive': true, isDeleted: false });
    if (!draftCustomer) {
      return sendErrorResponse(res, 404, 'DRAFT_NOT_FOUND', 'Draft customer not found or already deactivated');
    }

    if (draftCustomer.createdBy.toString() !== req.user.id.toString() && !isFinanceDepartment) {
      return sendErrorResponse(
      res,
      403,
      'FORBIDDEN',
      'You do not have permission to delete this draft customer'
    );
  }

    draftCustomer.Status.isActive = false;
    draftCustomer.Status.isSuspended = true;
    draftCustomer.Status.suspensionReason = req?.body?.suspensionReason || 'N/A';
    draftCustomer.isDeleted = true;
    draftCustomer.deletedAt = new Date();
    draftCustomer.deletedBy = req.user.id;
    await draftCustomer.save({ validateBeforeSave: false });

    return sendSuccessResponse(res, 200, null, 'Draft customer moved to recycle bin. Will be permanently deleted after 30 days');

  } catch (error) {
    console.error('Deactivate Draft Customer Error:', error);

    if (error.name === 'CastError') {
      return sendErrorResponse(res, 400, 'INVALID_ID', `Invalid ${error.path} format. Please provide a valid MongoDB ObjectId`);
    }

    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to deactivate draft customer');
  }
};


export const restoreCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const userEmployeeType = req.user?.EmployeeType;
    const userDepartment = userEmployeeType === 'SUPERADMIN' ? 'SUPERADMIN' : req.user?.Department?.name || req.user?.Department;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return sendErrorResponse(res, 400, 'INVALID_ID', 'Invalid customer ID format');
    }

    const isFinanceDepartment = userDepartment === 'FINANCE' || userEmployeeType === 'SUPERADMIN';

    if (!isFinanceDepartment) {
      return sendErrorResponse(res, 403, 'FORBIDDEN', 'You do not have permission to restore customers');
    }

    const user = await Customer.findOne({ _id: customerId, isDeleted: true });
    if (!user) {
      return sendErrorResponse(res, 404, 'USER_NOT_FOUND', 'Customer not found in recycle bin');
    }

    // Check if 30 days have passed
    const daysSinceDeletion = Math.floor((new Date() - new Date(user.deletedAt)) / (1000 * 60 * 60 * 24));
    if (daysSinceDeletion > 30) {
      return sendErrorResponse(res, 400, 'EXPIRED', 'Cannot restore customer. More than 30 days have passed since deletion');
    }

    user.Status.isActive = true;
    user.Status.isSuspended = false;
    user.Status.suspensionReason = null;
    user.isDeleted = false;
    user.deletedAt = null;
    user.deletedBy = null;
    await user.save({ validateBeforeSave: false });

    return sendSuccessResponse(res, 200, null, 'Customer restored successfully');

  } catch (error) {
    console.error('Restore Customer Error:', error);

    if (error.name === 'CastError') {
      return sendErrorResponse(res, 400, 'INVALID_ID', `Invalid ${error.path} format. Please provide a valid MongoDB ObjectId`);
    }

    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to restore customer');
  }
};

export const restoreDraftCustomer = async (req, res) => {
  try {
    const { draftId } = req.params;
    const userEmployeeType = req.user?.EmployeeType;
    const userDepartment = userEmployeeType === 'SUPERADMIN' ? 'SUPERADMIN' : req.user?.Department?.name || req.user?.Department;

    if (!mongoose.Types.ObjectId.isValid(draftId)) {
      return sendErrorResponse(res, 400, 'INVALID_ID', 'Invalid draft customer ID format');
    }

    const isFinanceDepartment = userDepartment === 'FINANCE' || userEmployeeType === 'SUPERADMIN';

    const draftCustomer = await customerDraftSchema.findOne({ _id: draftId, isDeleted: true });
    if (!draftCustomer) {
      return sendErrorResponse(res, 404, 'DRAFT_NOT_FOUND', 'Draft customer not found in recycle bin');
    }

    if (draftCustomer.createdBy.toString() !== req.user.id.toString() && !isFinanceDepartment) {
      return sendErrorResponse(res, 403, 'FORBIDDEN', 'You do not have permission to restore this draft customer');
    }

    // Check if 30 days have passed
    const daysSinceDeletion = Math.floor((new Date() - new Date(draftCustomer.deletedAt)) / (1000 * 60 * 60 * 24));
    if (daysSinceDeletion > 30) {
      return sendErrorResponse(res, 400, 'EXPIRED', 'Cannot restore draft. More than 30 days have passed since deletion');
    }

    draftCustomer.Status.isActive = true;
    draftCustomer.Status.isSuspended = false;
    draftCustomer.Status.suspensionReason = null;
    draftCustomer.isDeleted = false;
    draftCustomer.deletedAt = null;
    draftCustomer.deletedBy = null;
    await draftCustomer.save({ validateBeforeSave: false });

    return sendSuccessResponse(res, 200, null, 'Draft customer restored successfully');

  } catch (error) {
    console.error('Restore Draft Customer Error:', error);

    if (error.name === 'CastError') {
      return sendErrorResponse(res, 400, 'INVALID_ID', `Invalid ${error.path} format. Please provide a valid MongoDB ObjectId`);
    }

    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to restore draft customer');
  }
};

// GET ALL DELETED CUSTOMERS (RECYCLE BIN)
export const getDeletedCustomers = async (req, res) => {
  try {
    const userEmployeeType = req.user?.EmployeeType;
    const userDepartment = userEmployeeType === 'SUPERADMIN' ? 'SUPERADMIN' : req.user?.Department?.name || req.user?.Department;

    const isFinanceDepartment = userDepartment === 'FINANCE' || userEmployeeType === 'SUPERADMIN';

    if (!isFinanceDepartment) {
      return sendErrorResponse(res, 403, 'FORBIDDEN', 'You do not have permission to view deleted customers');
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const query = { isDeleted: true };

    const [deletedCustomers, total] = await Promise.all([
      Customer.find(query)
        .populate('deletedBy', 'employeeName username')
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Customer.countDocuments(query)
    ]);

    const customersWithDaysLeft = deletedCustomers.map(customer => {
      const daysSinceDeletion = Math.floor((new Date() - new Date(customer.deletedAt)) / (1000 * 60 * 60 * 24));
      const daysLeft = 30 - daysSinceDeletion;
      
      return {
        ...customer,
        daysUntilPermanentDeletion: daysLeft > 0 ? daysLeft : 0,
        canRestore: daysLeft > 0
      };
    });

    const totalPages = Math.ceil(total / limit);

    const pagination = {
      currentPage: page,
      totalPages,
      totalCustomers: total,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    return sendSuccessResponse(res, 200, { customers: customersWithDaysLeft, pagination }, 'Deleted customers retrieved successfully');

  } catch (error) {
    console.error('Get Deleted Customers Error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve deleted customers');
  }
};

export const getDeletedDraftCustomers = async (req, res) => {
  try {
    const userEmployeeType = req.user?.EmployeeType;
    const userDepartment = userEmployeeType === 'SUPERADMIN' ? 'SUPERADMIN' : req.user?.Department?.name || req.user?.Department;

    const isFinanceDepartment = userDepartment === 'FINANCE' || userEmployeeType === 'SUPERADMIN';

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    let query = { isDeleted: true };
    if (!isFinanceDepartment) {
      query.createdBy = req.user.id;
    }

    const [deletedDrafts, total] = await Promise.all([
      customerDraftSchema.find(query)
        .populate('deletedBy', 'employeeName username')
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      customerDraftSchema.countDocuments(query)
    ]);

    const draftsWithDaysLeft = deletedDrafts.map(draft => {
      const daysSinceDeletion = Math.floor((new Date() - new Date(draft.deletedAt)) / (1000 * 60 * 60 * 24));
      const daysLeft = 30 - daysSinceDeletion;
      
      return {
        ...draft,
        daysUntilPermanentDeletion: daysLeft > 0 ? daysLeft : 0,
        canRestore: daysLeft > 0
      };
    });

    const totalPages = Math.ceil(total / limit);

    const pagination = {
      currentPage: page,
      totalPages,
      totalDrafts: total,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    return sendSuccessResponse(res, 200, { drafts: draftsWithDaysLeft, pagination }, 'Deleted draft customers retrieved successfully');

  } catch (error) {
    console.error('Get Deleted Draft Customers Error:', error);
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve deleted draft customers');
  }
};
