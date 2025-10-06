import React, { useState, useEffect } from 'react';

interface ProfitDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  investors: any[];
  isLoading?: boolean;
  colors: {
    primary: string;
    success: string;
    danger: string;
    text: string;
    lightText: string;
    cardBackground: string;
    border: string;
  };
}

const ProfitDistributionModal: React.FC<ProfitDistributionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  investors,
  isLoading = false,
  colors
}) => {
  const [formData, setFormData] = useState({
    totalProfit: '',
    totalExpenses: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [calculatedDistribution, setCalculatedDistribution] = useState<any[]>([]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        totalProfit: '',
        totalExpenses: ''
      });
      setErrors({});
      setCalculatedDistribution([]);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Calculate distribution when both fields have values
    if (name === 'totalProfit' || name === 'totalExpenses') {
      calculateDistribution(name === 'totalProfit' ? value : formData.totalProfit, 
                           name === 'totalExpenses' ? value : formData.totalExpenses);
    }
  };

  const calculateDistribution = (profit: string, expenses: string) => {
    const totalProfit = parseFloat(profit) || 0;
    const totalExpenses = parseFloat(expenses) || 0;
    
    if (totalProfit > 0 && totalExpenses >= 0) {
      const netProfit = totalProfit - totalExpenses;
      
      if (netProfit > 0) {
        // Calculate total investment
        const totalInvestment = investors.reduce((sum, investor) => 
          sum + (investor.investmentAmount || 0), 0);
        
        if (totalInvestment > 0) {
          // Calculate distribution for each investor
          const distribution = investors.map(investor => {
            const investorInvestment = investor.investmentAmount || 0;
            const ratio = investorInvestment / totalInvestment;
            const investorProfit = netProfit * ratio;
            
            // Apply round-off +1 logic
            const roundedProfit = Math.round(investorProfit) + 1;
            
            return {
              ...investor,
              ratio: ratio,
              profitAmount: roundedProfit,
              formattedProfit: roundedProfit.toLocaleString('en-PK', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })
            };
          });
          
          setCalculatedDistribution(distribution);
        }
      } else {
        setCalculatedDistribution([]);
      }
    } else {
      setCalculatedDistribution([]);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.totalProfit.trim()) {
      newErrors.totalProfit = 'Total profit is required';
    } else if (isNaN(parseFloat(formData.totalProfit)) || parseFloat(formData.totalProfit) <= 0) {
      newErrors.totalProfit = 'Total profit must be a positive number';
    }

    if (!formData.totalExpenses.trim()) {
      newErrors.totalExpenses = 'Total expenses is required';
    } else if (isNaN(parseFloat(formData.totalExpenses)) || parseFloat(formData.totalExpenses) < 0) {
      newErrors.totalExpenses = 'Total expenses must be a non-negative number';
    }

    const totalProfit = parseFloat(formData.totalProfit) || 0;
    const totalExpenses = parseFloat(formData.totalExpenses) || 0;
    
    if (totalProfit <= totalExpenses) {
      newErrors.totalProfit = 'Total profit must be greater than total expenses';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const submitData = {
        totalProfit: parseFloat(formData.totalProfit),
        totalExpenses: parseFloat(formData.totalExpenses),
        netProfit: parseFloat(formData.totalProfit) - parseFloat(formData.totalExpenses),
        distribution: calculatedDistribution
      };
      
      onSubmit(submitData);
    }
  };

  const totalInvestment = investors.reduce((sum, investor) => 
    sum + (investor.investmentAmount || 0), 0);
  
  const netProfit = (parseFloat(formData.totalProfit) || 0) - (parseFloat(formData.totalExpenses) || 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 opacity-100" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all duration-300 scale-100 translate-y-0 overflow-hidden">
        {/* Header */}
        <div className="relative overflow-hidden rounded-t-2xl bg-green-50 flex-shrink-0">
          <div className="relative p-4">
            <div className="flex justify-between items-center">
              <div className="flex-1 text-center">
                <h2 className="text-xl font-bold text-gray-800">Profit Distribution</h2>
                <p className="text-sm text-gray-600 mt-1">Calculate and distribute profits among investors</p>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200 p-2 rounded-full"
                disabled={isLoading}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
            {/* Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Total Profit */}
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Total Profit (Rs.) *
                </label>
                <input
                  type="number"
                  name="totalProfit"
                  value={formData.totalProfit}
                  onChange={handleInputChange}
                  placeholder="Enter total profit amount"
                  min="0"
                  step="0.01"
                  autoComplete="off"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black ${
                    errors.totalProfit ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.totalProfit && (
                  <p className="text-red-500 text-xs mt-1">{errors.totalProfit}</p>
                )}
              </div>

              {/* Total Expenses */}
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Total Expenses (Rs.) *
                </label>
                <input
                  type="number"
                  name="totalExpenses"
                  value={formData.totalExpenses}
                  onChange={handleInputChange}
                  placeholder="Enter total expenses amount"
                  min="0"
                  step="0.01"
                  autoComplete="off"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black ${
                    errors.totalExpenses ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.totalExpenses && (
                  <p className="text-red-500 text-xs mt-1">{errors.totalExpenses}</p>
                )}
              </div>
            </div>

            {/* Summary */}
            {formData.totalProfit && formData.totalExpenses && netProfit > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Distribution Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Investment</p>
                    <p className="font-medium text-gray-800">Rs. {totalInvestment.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Net Profit</p>
                    <p className="font-medium text-green-600">Rs. {(Math.round(netProfit) + 1).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Profit Ratio</p>
                    <p className="font-medium text-blue-600">{((netProfit / totalInvestment) * 100).toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Distribution Preview */}
            {calculatedDistribution.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Profit Distribution Preview</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Investor</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Investment</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Ratio</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Profit Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculatedDistribution.map((investor, index) => (
                        <tr key={investor._id || index} className="border-b">
                          <td className="py-2 px-3 text-gray-800">{investor.name}</td>
                          <td className="py-2 px-3 text-gray-600">Rs. {(investor.investmentAmount || 0).toLocaleString()}</td>
                          <td className="py-2 px-3 text-gray-600">{(investor.ratio * 100).toFixed(2)}%</td>
                          <td className="py-2 px-3 text-green-600 font-medium">Rs. {investor.formattedProfit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || calculatedDistribution.length === 0}
                className="flex-1 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-full font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Distributing...' : 'Distribute Profits'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfitDistributionModal;
