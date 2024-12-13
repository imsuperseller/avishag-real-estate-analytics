import React, { useState, useEffect } from 'react';

interface MonthlyPaymentCalculatorProps {
  listPrice: number;
  isOpen: boolean;
  onClose: () => void;
}

interface PaymentDetails {
  principal: number;
  monthlyPayment: number;
  monthlyTaxes: number;
  monthlyInsurance: number;
  totalMonthly: number;
}

export default function MonthlyPaymentCalculator({ listPrice, isOpen, onClose }: MonthlyPaymentCalculatorProps) {
  const [downPaymentPercent, setDownPaymentPercent] = useState(30);
  const [interestRate, setInterestRate] = useState(7);
  const [loanTerm, setLoanTerm] = useState(30);

  if (!isOpen) return null;

  const downPayment = (listPrice * downPaymentPercent) / 100;
  const loanAmount = listPrice - downPayment;
  const monthlyInterestRate = interestRate / 1200; // Convert annual rate to monthly decimal
  const numberOfPayments = loanTerm * 12;

  const monthlyPayment = (
    loanAmount *
    (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
    (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1)
  ).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Monthly Payment Calculator</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close calculator"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              List Price
            </label>
            <div className="mt-1 text-lg font-semibold">
              ${listPrice.toLocaleString()}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Down Payment (%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={downPaymentPercent}
              onChange={(e) => setDownPaymentPercent(parseInt(e.target.value))}
              className="w-full mt-1"
            />
            <div className="text-sm text-gray-500">
              ${downPayment.toLocaleString()} ({downPaymentPercent}%)
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Interest Rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="20"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(parseFloat(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Loan Term (years)
            </label>
            <select
              value={loanTerm}
              onChange={(e) => setLoanTerm(parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value={15}>15 years</option>
              <option value={20}>20 years</option>
              <option value={30}>30 years</option>
            </select>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Estimated Monthly Payment</div>
            <div className="text-2xl font-bold text-blue-600" data-testid="monthly-payment-amount">
              ${monthlyPayment}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              *Not including taxes, insurance, or HOA fees
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 