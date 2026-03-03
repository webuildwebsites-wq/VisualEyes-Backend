import { sendErrorResponse, sendSuccessResponse } from "../../../../Utils/response/responseHandler.js";
import Employee from "../../../../models/Auth/Employee.js";
import employeeDraftSchema from "../../../../models/Auth/EmployeeDraft.js";
import dotenv from "dotenv";
dotenv.config();

export const updateDraftEmployee = async (req, res) => {
  try {
    const { draftId } = req.params;
    const updateData = req.body;
    const userId = req.user.id;
    const userEmployeeType = req.user?.EmployeeType;

    const draftEmployee = await employeeDraftSchema.findById(draftId);

    if (!draftEmployee) {
      return sendErrorResponse(res, 404, 'NOT_FOUND', 'Draft employee not found');
    }

    const isCreator = draftEmployee.createdBy.toString() === userId;
    const isSuperAdmin = userEmployeeType === 'SUPERADMIN';
    
    if (!isCreator && !isSuperAdmin) {
      return sendErrorResponse(res, 403, 'FORBIDDEN', 'You do not have permission to update this draft');
    }

    // Check if email or username is being changed
    if (updateData.email || updateData.username) {
      const checkQuery = { _id: { $ne: draftId } };
      const orConditions = [];
      
      if (updateData.email && updateData.email.toLowerCase() !== draftEmployee.email) {
        orConditions.push({ email: updateData.email.toLowerCase() });
      }
      
      if (updateData.username && updateData.username !== draftEmployee.username) {
        orConditions.push({ username: updateData.username });
      }

      if (orConditions.length > 0) {
        checkQuery.$or = orConditions;
        
        const [existingEmployee, existingDraft] = await Promise.all([
          Employee.findOne(checkQuery),
          employeeDraftSchema.findOne(checkQuery)
        ]);

        if (existingEmployee || existingDraft) {
          return sendErrorResponse(res, 409, 'DUPLICATE', 'Email or username already exists');
        }
      }
    }

    const updateFields = {};

    if (updateData.employeeName) updateFields.employeeName = updateData.employeeName.trim();
    if (updateData.username) updateFields.username = updateData.username.trim();
    if (updateData.email) updateFields.email = updateData.email.toLowerCase().trim();
    if (updateData.password) updateFields.password = updateData.password;
    if (updateData.phone) updateFields.phone = updateData.phone;
    if (updateData.address) updateFields.address = updateData.address.trim();
    if (updateData.country) updateFields.country = updateData.country.trim();
    if (updateData.pincode) updateFields.pincode = updateData.pincode.trim();
    if (updateData.EmployeeType) updateFields.EmployeeType = updateData.EmployeeType;
    if (updateData.ProfilePicture !== undefined) updateFields.ProfilePicture = updateData.ProfilePicture;
    if (updateData.aadharCard) updateFields.aadharCard = updateData.aadharCard;
    if (updateData.panCard) updateFields.panCard = updateData.panCard;
    if (updateData.aadharCardImg) updateFields.aadharCardImg = updateData.aadharCardImg;
    if (updateData.panCardImg) updateFields.panCardImg = updateData.panCardImg;
    if (updateData.isActive !== undefined) updateFields.isActive = updateData.isActive;

    if (updateData.Department && updateData.DepartmentRefId) {
      updateFields.Department = {
        name: updateData.Department,
        refId: updateData.DepartmentRefId
      };
    }

    if (updateData.subRoles && Array.isArray(updateData.subRoles)) {
      updateFields.subRoles = updateData.subRoles.map(role => ({
        name: role.name,
        refId: role.refId
      }));
    }

    if (updateData.lab && updateData.labRefId) {
      updateFields.lab = {
        name: updateData.lab,
        refId: updateData.labRefId
      };
    }

    if (updateData.zone && updateData.zoneRefId) {
      updateFields.zone = {
        name: updateData.zone,
        refId: updateData.zoneRefId
      };
    }

    if (updateData.supervisor && updateData.supervisorRefId) {
      updateFields.supervisor = {
        name: updateData.supervisor,
        refId: updateData.supervisorRefId
      };
    }

    if (updateData.teamLead && updateData.teamLeadRefId) {
      updateFields.teamLead = {
        name: updateData.teamLead,
        refId: updateData.teamLeadRefId
      };
    }

    if (updateData.dateOfJoining || updateData.dateOfBirth || updateData.emergencyContact) {
      updateFields.profile = {};
      if (updateData.dateOfJoining) updateFields['profile.dateOfJoining'] = updateData.dateOfJoining;
      if (updateData.dateOfBirth) updateFields['profile.dateOfBirth'] = updateData.dateOfBirth;
      if (updateData.emergencyContact) updateFields['profile.emergencyContact'] = updateData.emergencyContact;
    }

    const updatedDraft = await employeeDraftSchema.findByIdAndUpdate(
      draftId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    return sendSuccessResponse(res, 200, { employee: updatedDraft }, 'Draft employee updated successfully');

  } catch (error) {
    console.error('Update draft employee error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', messages.join(', '));
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return sendErrorResponse(res, 409, 'DUPLICATE_FIELD', `${field} already exists`);
    }
    return sendErrorResponse(res, 500, 'INTERNAL_ERROR', 'Failed to update draft employee');
  }
};
