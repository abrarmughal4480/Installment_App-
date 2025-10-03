import Installment from '../models/Installment.js';

// Get all installments (admin) or customer installments
export const getInstallments = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status } = req.query;
    
    let query = {};
    
    // Always filter by the logged-in user's created installments
    query.createdBy = req.user.userId;
    
    // If customerId is provided, also filter by that customer
    if (customerId) {
      query.customerId = customerId;
    }
    
    const installmentPlans = await Installment.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Map status values to match frontend expectations
    const mapStatus = (status) => {
      switch (status) {
        case 'paid': return 'completed';
        case 'pending': return 'active';
        case 'overdue': return 'overdue';
        default: return status;
      }
    };

    // Process each installment plan to show only next unpaid installment
    const installments = [];
    
    for (const plan of installmentPlans) {
      // Find the next unpaid installment
      const nextUnpaidInstallment = plan.installments.find(inst => 
        inst.status === 'pending' || inst.status === 'overdue'
      );
      
      if (nextUnpaidInstallment) {
        // Apply status filter if provided
        if (status) {
          const mappedStatus = mapStatus(nextUnpaidInstallment.status);
          if (mappedStatus !== status) {
            continue;
          }
        }
        
        // Calculate remaining installment information for edit purposes
        const totalPaidInstallments = plan.installments.filter(inst => inst.status === 'paid').length;
        const totalUnpaidInstallments = plan.installments.filter(inst => inst.status !== 'paid').length;
        
        // Calculate remaining amount (total - advance - paid installments)
        const paidFromInstallments = plan.installments.reduce((sum, inst) => {
          return sum + (inst.actualPaidAmount || 0);
        }, 0);
        const remainingAmount = plan.totalAmount - plan.advanceAmount - paidFromInstallments;
        
        
        // Calculate new monthly installment for remaining installments
        const newMonthlyInstallment = totalUnpaidInstallments > 0 ? Math.ceil(remainingAmount / totalUnpaidInstallments) : 0;

        const installmentData = {
          id: plan._id,
          installmentNumber: nextUnpaidInstallment.installmentNumber,
          customerId: plan.customerId,
          customerName: plan.customerName,
          customerEmail: plan.customerEmail,
          customerPhone: plan.customerPhone,
          customerAddress: plan.customerAddress,
          productName: plan.productName,
          productDescription: plan.productDescription,
          totalAmount: plan.totalAmount,
          advanceAmount: plan.advanceAmount,
          installmentCount: plan.installmentCount,
          installmentUnit: plan.installmentUnit,
          monthlyInstallment: plan.monthlyInstallment,
          amount: nextUnpaidInstallment.amount,
          dueDate: nextUnpaidInstallment.dueDate,
          paidDate: nextUnpaidInstallment.paidDate,
          status: mapStatus(nextUnpaidInstallment.status),
          paymentMethod: nextUnpaidInstallment.paymentMethod,
          notes: nextUnpaidInstallment.notes,
          createdAt: plan.createdAt,
          updatedAt: plan.updatedAt,
          // Additional info about the plan
          totalPaidInstallments: totalPaidInstallments,
          totalUnpaidInstallments: totalUnpaidInstallments,
          // Include full installments array for accurate calculations
          installments: plan.installments,
          // Edit-specific calculations
          remainingAmount: remainingAmount,
          remainingInstallmentCount: totalUnpaidInstallments,
          newMonthlyInstallment: newMonthlyInstallment,
          dueDay: plan.dueDay
        };


        installments.push(installmentData);
      }
    }

    res.json({
      success: true,
      installments: installments
    });
  } catch (error) {
    console.error('Error fetching installments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch installments'
    });
  }
};

// Get single installment
export const getInstallment = async (req, res) => {
  try {
    const { installmentId } = req.params;
    
    const installment = await Installment.findById(installmentId)
      .populate('createdBy', 'name email');

    if (!installment) {
      return res.status(404).json({
        success: false,
        message: 'Installment not found'
      });
    }

    // Populate paidBy for individual installments if they exist
    const populatedInstallments = await Promise.all(
      installment.installments.map(async (inst) => {
        if (inst.paidBy) {
          const User = (await import('../models/User.js')).default;
          const paidByUser = await User.findById(inst.paidBy).select('name email');
          return {
            ...inst.toObject(),
            paidBy: paidByUser ? {
              id: paidByUser._id,
              name: paidByUser.name,
              email: paidByUser.email
            } : inst.paidBy
          };
        }
        return inst.toObject();
      })
    );

    res.json({
      success: true,
      installment: {
        id: installment._id,
        customerId: installment.customerId,
        customerName: installment.customerName,
        customerEmail: installment.customerEmail,
        customerPhone: installment.customerPhone,
        customerAddress: installment.customerAddress,
        productName: installment.productName,
        productDescription: installment.productDescription,
        totalAmount: installment.totalAmount,
        advanceAmount: installment.advanceAmount,
        installmentCount: installment.installmentCount,
        installmentUnit: installment.installmentUnit,
        monthlyInstallment: installment.monthlyInstallment,
        startDate: installment.startDate,
        dueDay: installment.dueDay,
        installments: populatedInstallments, // Include all individual installments with populated paidBy
        createdBy: installment.createdBy,
        createdAt: installment.createdAt,
        updatedAt: installment.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching installment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch installment'
    });
  }
};

// Create or update installments
export const createInstallments = async (req, res) => {
  try {
    const { 
      installmentId, // For update mode
      customerId, 
      name,
      email,
      phone,
      address,
      productName,
      productDescription,
      totalAmount,
      advanceAmount,
      installmentCount, 
      installmentUnit, 
      monthlyInstallment, 
      startDate, 
      dueDate,
      managerId // Manager ObjectId
    } = req.body;

    // Check if this is an update operation
    const isUpdate = installmentId && installmentId !== 'undefined' && installmentId !== 'null';
    
    
    // Create installment array
    const installmentsArray = [];
    const start = new Date(startDate);
    
    // Calculate the first due date - start from next month
    let firstDueDate = new Date(start);
    firstDueDate.setMonth(firstDueDate.getMonth() + 1);
    firstDueDate.setDate(parseInt(dueDate));
    
    for (let i = 1; i <= installmentCount; i++) {
      const dueDateObj = new Date(firstDueDate);
      
      // Calculate due date based on installment unit
      if (installmentUnit === 'days') {
        dueDateObj.setDate(dueDateObj.getDate() + (i - 1));
      } else if (installmentUnit === 'weeks') {
        dueDateObj.setDate(dueDateObj.getDate() + ((i - 1) * 7));
      } else { // months
        dueDateObj.setMonth(dueDateObj.getMonth() + (i - 1));
        dueDateObj.setDate(parseInt(dueDate));
      }
      
      installmentsArray.push({
        installmentNumber: i,
        amount: monthlyInstallment,
        dueDate: dueDateObj,
        status: 'pending'
      });
    }
    
    let installment;
    
    if (isUpdate) {
      // Update existing installment
      
      // Find existing installment
      installment = await Installment.findById(installmentId);
      if (!installment) {
        return res.status(404).json({
          success: false,
          message: 'Installment not found'
        });
      }

      // Get existing paid installments to preserve them
      const existingPaidInstallments = installment.installments.filter(inst => inst.status === 'paid');
      
      // Create new installments array with existing paid ones + new remaining ones
      const newInstallmentsArray = [...existingPaidInstallments];
      
      // Add new remaining installments
      for (let i = 1; i <= installmentCount; i++) {
        const dueDateObj = new Date(firstDueDate);
        
        // Calculate due date based on installment unit
        if (installmentUnit === 'days') {
          dueDateObj.setDate(dueDateObj.getDate() + (i - 1));
        } else if (installmentUnit === 'weeks') {
          dueDateObj.setDate(dueDateObj.getDate() + ((i - 1) * 7));
        } else { // months
          dueDateObj.setMonth(dueDateObj.getMonth() + (i - 1));
          dueDateObj.setDate(parseInt(dueDate));
        }
        
        newInstallmentsArray.push({
          installmentNumber: existingPaidInstallments.length + i,
          amount: monthlyInstallment,
          dueDate: dueDateObj,
          status: 'pending'
        });
      }

      // Update the installment
      installment.customerName = name;
      installment.customerEmail = email;
      installment.customerPhone = phone;
      installment.customerAddress = address || '';
      installment.productName = productName;
      installment.productDescription = productDescription || '';
      installment.totalAmount = totalAmount;
      installment.advanceAmount = advanceAmount || 0;
      installment.installmentCount = existingPaidInstallments.length + installmentCount;
      installment.installmentUnit = installmentUnit;
      installment.monthlyInstallment = monthlyInstallment;
      installment.startDate = start;
      installment.dueDay = parseInt(dueDate);
      installment.installments = newInstallmentsArray;
      installment.managerId = managerId; // Save manager ObjectId

      await installment.save();

      res.status(200).json({
        success: true,
        message: 'Installments updated successfully',
        installment: {
          id: installment._id,
          customerName: installment.customerName,
          productName: installment.productName,
          totalAmount: installment.totalAmount,
          installmentCount: installment.installmentCount,
          installments: installment.installments.map(inst => ({
            installmentNumber: inst.installmentNumber,
            amount: inst.amount,
            dueDate: inst.dueDate,
            status: inst.status
          }))
        }
      });
    } else {
      // Create new installment
      installment = new Installment({
        customerId: customerId,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        customerAddress: address || '',
        productName: productName,
        productDescription: productDescription || '',
        totalAmount: totalAmount,
        advanceAmount: advanceAmount || 0,
        installmentCount: installmentCount,
        installmentUnit: installmentUnit,
        monthlyInstallment: monthlyInstallment,
        startDate: start,
        dueDay: parseInt(dueDate),
        installments: installmentsArray,
        createdBy: req.user.userId,
        managerId: managerId // Save manager ObjectId
      });

      await installment.save();

      // Log successful creation
      console.log(`✅ Installment Successfully Created!`);
      console.log(`📋 Customer: ${installment.customerName} (ID: ${installment.customerId})`);
      console.log(`📦 Product: ${installment.productName}`);
      console.log(`💰 Total Amount: Rs. ${installment.totalAmount.toLocaleString()}`);
      console.log(`📅 Installments: ${installment.installmentCount} payments`);
      console.log(`👤 Created By: ${req.user?.userId}`);
      console.log(`🆔 Installment ID: ${installment._id}`);
      console.log(`⏰ Created At: ${new Date().toISOString()}`);

      res.status(201).json({
        success: true,
        message: 'Installments created successfully',
        installment: {
          id: installment._id,
          customerName: installment.customerName,
          productName: installment.productName,
          totalAmount: installment.totalAmount,
          installmentCount: installment.installmentCount,
          installments: installment.installments.map(inst => ({
            installmentNumber: inst.installmentNumber,
            amount: inst.amount,
            dueDate: inst.dueDate,
            status: inst.status
          }))
        }
      });
    }
  } catch (error) {
    console.error('Error creating installments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create installments'
    });
  }
};

// Mark installment as paid
export const payInstallment = async (req, res) => {
  try {
    const { installmentId } = req.params;
    const { 
      installmentNumber, 
      paymentMethod = 'cash', 
      notes = '',
      customAmount = null // Allow custom payment amount
    } = req.body;
    
    const installmentPlan = await Installment.findById(installmentId);

    if (!installmentPlan) {
      return res.status(404).json({
        success: false,
        message: 'Installment plan not found'
      });
    }

    // Find the specific installment in the array
    const installment = installmentPlan.installments.find(inst => 
      inst.installmentNumber === parseInt(installmentNumber)
    );

    if (!installment) {
      return res.status(404).json({
        success: false,
        message: 'Installment not found'
      });
    }

    if (installment.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Installment already paid'
      });
    }

    // Validate custom amount if provided
    if (customAmount !== null) {
      const amount = parseFloat(customAmount);
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment amount'
        });
      }
    }

    // Update the specific installment in the array
    installment.paidDate = new Date();
    installment.status = 'paid';
    installment.paymentMethod = paymentMethod;
    installment.notes = notes;
    installment.paidBy = req.user.userId;
    
    // Store the actual paid amount (custom or original)
    const actualPaidAmount = customAmount !== null ? parseFloat(customAmount) : installment.amount;
    installment.actualPaidAmount = actualPaidAmount;
    
    // Calculate difference between paid amount and required amount
    const difference = actualPaidAmount - installment.amount;
    
    // If there's a difference, distribute it among remaining unpaid installments
    if (difference !== 0) {
      const remainingInstallments = installmentPlan.installments.filter(inst => 
        inst.status === 'pending' && inst.installmentNumber > installment.installmentNumber
      );
      
      if (remainingInstallments.length > 0) {
        const amountPerInstallment = difference / remainingInstallments.length;
        // Round up to nearest 1 (always increase, never decrease)
        const roundedAmountPerInstallment = Math.ceil(Math.abs(amountPerInstallment));
        
        // Update remaining installments
        remainingInstallments.forEach(remainingInst => {
          const newAmount = remainingInst.amount - (amountPerInstallment > 0 ? roundedAmountPerInstallment : -roundedAmountPerInstallment);
          // Ensure amount doesn't go below 0
          remainingInst.amount = Math.max(0, newAmount);
        });
      }
    }
    
    await installmentPlan.save();

    // Calculate distribution info for response
    const remainingInstallments = installmentPlan.installments.filter(inst => 
      inst.status === 'pending' && inst.installmentNumber > installment.installmentNumber
    );
    
    const distributionInfo = difference !== 0 && remainingInstallments.length > 0 ? {
      difference: difference,
      distributedTo: remainingInstallments.length,
      amountPerInstallment: Math.ceil(Math.abs(difference / remainingInstallments.length)),
      message: difference > 0 
        ? `Excess payment of Rs. ${Math.abs(difference).toLocaleString()} distributed across ${remainingInstallments.length} remaining installments (Rs. ${Math.ceil(Math.abs(difference / remainingInstallments.length)).toLocaleString()} each)`
        : `Shortfall of Rs. ${Math.abs(difference).toLocaleString()} distributed across ${remainingInstallments.length} remaining installments (Rs. ${Math.ceil(Math.abs(difference / remainingInstallments.length)).toLocaleString()} each)`
    } : null;

    res.json({
      success: true,
      message: 'Installment marked as paid',
      installment: {
        id: installmentPlan._id,
        installmentNumber: installment.installmentNumber,
        originalAmount: installment.amount,
        actualPaidAmount: installment.actualPaidAmount,
        paidDate: installment.paidDate,
        status: installment.status,
        paymentMethod: installment.paymentMethod,
        notes: installment.notes
      },
      distribution: distributionInfo
    });
  } catch (error) {
    console.error('Error paying installment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark installment as paid'
    });
  }
};

// Update existing payment details
export const updatePayment = async (req, res) => {
  try {
    const { installmentId } = req.params;
    const { 
      installmentNumber, 
      paymentMethod = 'cash', 
      notes = '',
      customAmount = null // Allow custom payment amount
    } = req.body;
    
    const installmentPlan = await Installment.findById(installmentId);

    if (!installmentPlan) {
      return res.status(404).json({
        success: false,
        message: 'Installment plan not found'
      });
    }

    // Find the specific installment in the array
    const installment = installmentPlan.installments.find(inst => 
      inst.installmentNumber === parseInt(installmentNumber)
    );

    if (!installment) {
      return res.status(404).json({
        success: false,
        message: 'Installment not found'
      });
    }

    if (installment.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Can only update paid installments'
      });
    }

    // Validate custom amount if provided
    if (customAmount !== null) {
      const amount = parseFloat(customAmount);
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment amount'
        });
      }
    }

    // Store the old amount for calculation
    const oldPaidAmount = installment.actualPaidAmount || installment.amount;
    
    // Update payment details
    installment.paymentMethod = paymentMethod;
    installment.notes = notes;
    installment.paidBy = req.user.userId;
    
    // Store the new actual paid amount (custom or original)
    const newPaidAmount = customAmount !== null ? parseFloat(customAmount) : installment.amount;
    installment.actualPaidAmount = newPaidAmount;
    
    // Calculate difference between old and new paid amount
    const amountDifference = newPaidAmount - oldPaidAmount;
    
    // If there's a difference, redistribute it among remaining unpaid installments
    if (amountDifference !== 0) {
      const remainingInstallments = installmentPlan.installments.filter(inst => 
        inst.status === 'pending' && inst.installmentNumber > installment.installmentNumber
      );
      
      if (remainingInstallments.length > 0) {
        const amountPerInstallment = amountDifference / remainingInstallments.length;
        // Round up to nearest 1 (always increase, never decrease)
        const roundedAmountPerInstallment = Math.ceil(Math.abs(amountPerInstallment));
        
        // Update remaining installments
        remainingInstallments.forEach(remainingInst => {
          const newAmount = remainingInst.amount - (amountPerInstallment > 0 ? roundedAmountPerInstallment : -roundedAmountPerInstallment);
          // Ensure amount doesn't go below 0
          remainingInst.amount = Math.max(0, newAmount);
        });
      }
    }
    
    await installmentPlan.save();

    // Calculate distribution info for response
    const remainingInstallments = installmentPlan.installments.filter(inst => 
      inst.status === 'pending' && inst.installmentNumber > installment.installmentNumber
    );
    
    const distributionInfo = amountDifference !== 0 && remainingInstallments.length > 0 ? {
      difference: amountDifference,
      distributedTo: remainingInstallments.length,
      amountPerInstallment: Math.ceil(Math.abs(amountDifference / remainingInstallments.length)),
      message: amountDifference > 0 
        ? `Excess payment of Rs. ${Math.abs(amountDifference).toLocaleString()} distributed across ${remainingInstallments.length} remaining installments (Rs. ${Math.ceil(Math.abs(amountDifference / remainingInstallments.length)).toLocaleString()} each)`
        : `Shortfall of Rs. ${Math.abs(amountDifference).toLocaleString()} distributed across ${remainingInstallments.length} remaining installments (Rs. ${Math.ceil(Math.abs(amountDifference / remainingInstallments.length)).toLocaleString()} each)`
    } : null;

    res.json({
      success: true,
      message: 'Payment updated successfully',
      installment: {
        id: installmentPlan._id,
        installmentNumber: installment.installmentNumber,
        originalAmount: installment.amount,
        actualPaidAmount: installment.actualPaidAmount,
        paidDate: installment.paidDate,
        status: installment.status,
        paymentMethod: installment.paymentMethod,
        notes: installment.notes
      },
      distribution: distributionInfo
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment'
    });
  }
};

// Mark paid installment as unpaid (reverse payment)
export const markInstallmentUnpaid = async (req, res) => {
  try {
    const { installmentId } = req.params;
    const { installmentNumber } = req.body;
    
    const installmentPlan = await Installment.findById(installmentId);

    if (!installmentPlan) {
      return res.status(404).json({
        success: false,
        message: 'Installment plan not found'
      });
    }

    // Find the specific installment in the array
    const installment = installmentPlan.installments.find(inst => 
      inst.installmentNumber === parseInt(installmentNumber)
    );

    if (!installment) {
      return res.status(404).json({
        success: false,
        message: 'Installment not found'
      });
    }

    if (installment.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Can only mark paid installments as unpaid'
      });
    }

    // Store the paid amount for reverse distribution calculation
    const paidAmount = installment.actualPaidAmount || installment.amount;
    
    // Mark installment as unpaid
    installment.status = 'pending';
    installment.paidDate = undefined;
    installment.paymentMethod = undefined;
    installment.notes = undefined;
    installment.paidBy = undefined;
    installment.actualPaidAmount = undefined;
    
    // Calculate reverse distribution - redistribute the paid amount among remaining installments
    const remainingInstallments = installmentPlan.installments.filter(inst => 
      inst.status === 'pending' && inst.installmentNumber > installment.installmentNumber
    );
    
    if (remainingInstallments.length > 0) {
      const amountPerInstallment = paidAmount / remainingInstallments.length;
      // Round up to nearest 1
      const roundedAmountPerInstallment = Math.ceil(amountPerInstallment);
      
      // Add the amount back to remaining installments
      remainingInstallments.forEach(remainingInst => {
        remainingInst.amount = remainingInst.amount + roundedAmountPerInstallment;
      });
    }
    
    await installmentPlan.save();

    // Calculate reverse distribution info for response
    const distributionInfo = remainingInstallments.length > 0 ? {
      originalPaidAmount: paidAmount,
      distributedTo: remainingInstallments.length,
      amountPerInstallment: Math.ceil(paidAmount / remainingInstallments.length),
      message: `Previously paid amount of Rs. ${paidAmount.toLocaleString()} redistributed across ${remainingInstallments.length} remaining installments (Rs. ${Math.ceil(paidAmount / remainingInstallments.length).toLocaleString()} each)`
    } : null;

    res.json({
      success: true,
      message: 'Installment marked as unpaid successfully',
      installment: {
        id: installmentPlan._id,
        installmentNumber: installment.installmentNumber,
        amount: installment.amount,
        status: installment.status,
        dueDate: installment.dueDate
      },
      distribution: distributionInfo
    });
  } catch (error) {
    console.error('Error marking installment as unpaid:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark installment as unpaid'
    });
  }
};

// Update installment
export const updateInstallment = async (req, res) => {
  try {
    const { installmentId } = req.params;
    const updateData = req.body;
    
    const installment = await Installment.findByIdAndUpdate(
      installmentId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!installment) {
      return res.status(404).json({
        success: false,
        message: 'Installment not found'
      });
    }

    res.json({
      success: true,
      message: 'Installment updated successfully',
      installment: {
        id: installment._id,
        installmentNumber: installment.installmentNumber,
        amount: installment.amount,
        dueDate: installment.dueDate,
        paidDate: installment.paidDate,
        status: installment.status,
        paymentMethod: installment.paymentMethod,
        notes: installment.notes
      }
    });
  } catch (error) {
    console.error('Error updating installment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update installment'
    });
  }
};

// Delete installment
export const deleteInstallment = async (req, res) => {
  try {
    const { installmentId } = req.params;
    
    // Validate ObjectId format
    if (!installmentId || installmentId.length !== 24) {
      return res.status(400).json({
        success: false,
        message: 'Invalid installment ID format'
      });
    }
    
    const installment = await Installment.findById(installmentId);

    if (!installment) {
      return res.status(404).json({
        success: false,
        message: 'Installment not found'
      });
    }

    if (installment.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete paid installment'
      });
    }

    await Installment.findByIdAndDelete(installmentId);

    res.json({
      success: true,
      message: 'Installment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting installment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete installment'
    });
  }
};

// Get customer information and their installments
export const getCustomerInstallments = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your customer ID to view your installments'
      });
    }
    
    // Find all installments for this customer
    const installments = await Installment.find({ customerId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    if (installments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sorry, we couldn\'t find any installments for this customer ID. Please check your customer ID or contact support.'
      });
    }
    
    // Get customer information from the first installment
    const customerInfo = {
      customerId: installments[0].customerId,
      customerName: installments[0].customerName,
      customerEmail: installments[0].customerEmail,
      customerPhone: installments[0].customerPhone,
      customerAddress: installments[0].customerAddress
    };
    
    // Process installments to show summary information
    const processedInstallments = installments.map(plan => {
      // Find next unpaid installment
      const nextUnpaid = plan.installments.find(inst => inst.status === 'pending');
      
      // Calculate totals
      const totalPaidInstallments = plan.installments.filter(inst => inst.status === 'paid').length;
      const totalUnpaidInstallments = plan.installments.filter(inst => inst.status === 'pending').length;
      const totalOverdueInstallments = plan.installments.filter(inst => inst.status === 'overdue').length;
      
      // Calculate total paid amount
      const totalPaidAmount = (plan.advanceAmount || 0) + 
        plan.installments
          .filter(inst => inst.status === 'paid')
          .reduce((sum, inst) => sum + (inst.actualPaidAmount || inst.amount), 0);
      
      return {
        id: plan._id,
        productName: plan.productName,
        productDescription: plan.productDescription,
        totalAmount: plan.totalAmount,
        advanceAmount: plan.advanceAmount,
        monthlyInstallment: plan.monthlyInstallment,
        installmentCount: plan.installmentCount,
        startDate: plan.startDate,
        dueDay: plan.dueDay,
        totalPaidInstallments,
        totalUnpaidInstallments,
        totalOverdueInstallments,
        totalPaidAmount,
        nextUnpaid: nextUnpaid ? {
          installmentNumber: nextUnpaid.installmentNumber,
          amount: nextUnpaid.amount,
          dueDate: nextUnpaid.dueDate,
          status: nextUnpaid.status
        } : null,
        createdAt: plan.createdAt
      };
    });
    
    res.json({
      success: true,
      customer: customerInfo,
      installments: processedInstallments,
      totalInstallments: installments.length
    });
  } catch (error) {
    console.error('Error fetching customer installments:', error);
    res.status(500).json({
      success: false,
      message: 'We\'re having trouble loading your installments. Please try again in a moment.'
    });
  }
};
