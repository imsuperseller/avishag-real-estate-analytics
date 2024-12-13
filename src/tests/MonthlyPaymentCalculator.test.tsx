/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MonthlyPaymentCalculator from '@/components/MonthlyPaymentCalculator';

describe('MonthlyPaymentCalculator', () => {
  const mockOnClose = jest.fn();
  const defaultProps = {
    listPrice: 500000,
    isOpen: true,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders calculator with default values', () => {
    render(<MonthlyPaymentCalculator {...defaultProps} />);

    // Check initial values
    expect(screen.getByLabelText(/Down Payment/i)).toHaveValue(30);
    expect(screen.getByLabelText(/Interest Rate/i)).toHaveValue(7);
    expect(screen.getByLabelText(/Loan Term/i)).toHaveValue('30');
    expect(screen.getByLabelText(/Property Tax Rate/i)).toHaveValue(1.72);
    expect(screen.getByLabelText(/Insurance Rate/i)).toHaveValue(1);
  });

  it('calculates monthly payment correctly with default values', () => {
    render(<MonthlyPaymentCalculator {...defaultProps} />);
    
    // Default values: 30% down, 7% interest, 30 years
    const downPayment = defaultProps.listPrice * 0.3;
    const loanAmount = defaultProps.listPrice - downPayment;
    const monthlyRate = 0.07 / 12;
    const numberOfPayments = 30 * 12;
    const expectedPayment = (
      loanAmount *
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
    ).toFixed(2);

    expect(screen.getByTestId('monthly-payment-amount')).toHaveTextContent(
      `$${expectedPayment}`
    );
  });

  it('updates monthly payment when down payment changes', () => {
    render(<MonthlyPaymentCalculator {...defaultProps} />);
    
    const downPaymentInput = screen.getByRole('slider');
    fireEvent.change(downPaymentInput, { target: { value: '20' } });

    const downPayment = defaultProps.listPrice * 0.2;
    const loanAmount = defaultProps.listPrice - downPayment;
    const monthlyRate = 0.07 / 12;
    const numberOfPayments = 30 * 12;
    const expectedPayment = (
      loanAmount *
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
    ).toFixed(2);

    expect(screen.getByTestId('monthly-payment-amount')).toHaveTextContent(
      `$${expectedPayment}`
    );
  });

  it('updates monthly payment when interest rate changes', () => {
    render(<MonthlyPaymentCalculator {...defaultProps} />);
    
    const interestInput = screen.getByRole('spinbutton');
    fireEvent.change(interestInput, { target: { value: '5' } });

    const downPayment = defaultProps.listPrice * 0.3;
    const loanAmount = defaultProps.listPrice - downPayment;
    const monthlyRate = 0.05 / 12;
    const numberOfPayments = 30 * 12;
    const expectedPayment = (
      loanAmount *
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
    ).toFixed(2);

    expect(screen.getByTestId('monthly-payment-amount')).toHaveTextContent(
      `$${expectedPayment}`
    );
  });

  it('updates monthly payment when loan term changes', () => {
    render(<MonthlyPaymentCalculator {...defaultProps} />);
    
    const termSelect = screen.getByRole('combobox');
    fireEvent.change(termSelect, { target: { value: '15' } });

    const downPayment = defaultProps.listPrice * 0.3;
    const loanAmount = defaultProps.listPrice - downPayment;
    const monthlyRate = 0.07 / 12;
    const numberOfPayments = 15 * 12;
    const expectedPayment = (
      loanAmount *
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
    ).toFixed(2);

    expect(screen.getByTestId('monthly-payment-amount')).toHaveTextContent(
      `$${expectedPayment}`
    );
  });

  it('closes calculator when close button is clicked', () => {
    render(<MonthlyPaymentCalculator {...defaultProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close calculator/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('does not render when isOpen is false', () => {
    render(<MonthlyPaymentCalculator {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText(/monthly payment calculator/i)).not.toBeInTheDocument();
  });

  it('formats currency values correctly', () => {
    render(<MonthlyPaymentCalculator {...defaultProps} />);
    
    expect(screen.getByText(/\$500,000/)).toBeInTheDocument();
    expect(screen.getByText(/\$150,000 \(30%\)/)).toBeInTheDocument();
  });

  it('displays loan details breakdown', async () => {
    render(<MonthlyPaymentCalculator {...defaultProps} />);

    // Check loan details section
    expect(screen.getByText(/List Price:/i)).toBeInTheDocument();
    expect(screen.getByText(/Down Payment:/i)).toBeInTheDocument();
    expect(screen.getByText(/Loan Amount:/i)).toBeInTheDocument();
    expect(screen.getByText(/Principal & Interest:/i)).toBeInTheDocument();
    expect(screen.getByText(/Property Taxes:/i)).toBeInTheDocument();
    expect(screen.getByText(/Insurance:/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Monthly:/i)).toBeInTheDocument();

    // Wait for calculations
    await waitFor(() => {
      expect(screen.getByText(/\$500,000/)).toBeInTheDocument(); // List Price
      expect(screen.getByText(/\$150,000/)).toBeInTheDocument(); // Down Payment (30%)
      expect(screen.getByText(/\$350,000/)).toBeInTheDocument(); // Loan Amount
    });
  });

  it('handles keyboard navigation', () => {
    render(<MonthlyPaymentCalculator {...defaultProps} />);

    const inputs = screen.getAllByRole('spinbutton');
    const select = screen.getByRole('combobox');
    
    // Test tab navigation between inputs
    inputs[0].focus();
    fireEvent.keyDown(inputs[0], { key: 'Tab' });
    expect(document.activeElement).toBe(inputs[1]);

    fireEvent.keyDown(inputs[1], { key: 'Tab' });
    expect(document.activeElement).toBe(select);
  });

  it('maintains input focus during calculations', async () => {
    render(<MonthlyPaymentCalculator {...defaultProps} />);

    const interestRateInput = screen.getByLabelText(/Interest Rate/i);
    interestRateInput.focus();
    fireEvent.change(interestRateInput, { target: { value: '5.75' } });

    await waitFor(() => {
      expect(document.activeElement).toBe(interestRateInput);
    });
  });

  it('handles non-numeric input gracefully', () => {
    render(<MonthlyPaymentCalculator {...defaultProps} />);

    const downPaymentInput = screen.getByLabelText(/Down Payment/i);
    fireEvent.change(downPaymentInput, { target: { value: 'abc' } });

    expect(downPaymentInput).toHaveValue(null);
  });
}); 