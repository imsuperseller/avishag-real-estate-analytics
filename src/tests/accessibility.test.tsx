import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import PropertyAnalysis from '@/components/PropertyAnalysis';
import ChatInterface from '@/components/ChatInterface';
import PDFUpload from '@/components/PDFUpload';
import { mockMLSData } from '@/tests/test-utils';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  describe('PropertyAnalysis Component', () => {
    it('has no axe violations', async () => {
      const { container } = render(
        <PropertyAnalysis
          data={mockMLSData}
          onPriceSelect={jest.fn()}
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports keyboard navigation for price points', async () => {
      render(
        <PropertyAnalysis
          data={mockMLSData}
          onPriceSelect={jest.fn()}
        />
      );

      const pricePoints = screen.getAllByRole('tab');
      expect(pricePoints[0]).toHaveFocus();

      // Navigate right
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      expect(pricePoints[1]).toHaveFocus();

      // Navigate left
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      expect(pricePoints[0]).toHaveFocus();

      // Select with Enter
      const onPriceSelect = jest.fn();
      render(
        <PropertyAnalysis
          data={mockMLSData}
          onPriceSelect={onPriceSelect}
        />
      );

      fireEvent.keyDown(document, { key: 'Enter' });
      expect(onPriceSelect).toHaveBeenCalledWith(mockMLSData.marketTrends.priceHistory[0].price);
    });

    it('announces price point selections', async () => {
      render(
        <PropertyAnalysis
          data={mockMLSData}
          onPriceSelect={jest.fn()}
        />
      );

      const firstPoint = screen.getAllByRole('tab')[0];
      await userEvent.click(firstPoint);

      const announcement = screen.getByRole('status');
      expect(announcement).toHaveTextContent(
        `Selected price point: $${mockMLSData.marketTrends.priceHistory[0].price.toLocaleString()} from ${mockMLSData.marketTrends.priceHistory[0].date}`
      );
    });

    it('supports keyboard navigation in comparison mode', async () => {
      render(
        <PropertyAnalysis
          data={mockMLSData}
          onPriceSelect={jest.fn()}
        />
      );

      // Enter comparison mode
      const compareButton = screen.getByRole('button', { name: /enter comparison mode/i });
      await userEvent.click(compareButton);

      // Select points
      const points = screen.getAllByRole('tab');
      await userEvent.click(points[0]);
      await userEvent.click(points[1]);

      // Verify announcement
      const announcement = screen.getByRole('status');
      expect(announcement).toHaveTextContent(/comparing prices/i);

      // Exit with Escape
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(announcement).toHaveTextContent('Exited comparison mode');
    });

    it('maintains focus management in print view modal', async () => {
      render(
        <PropertyAnalysis
          data={mockMLSData}
          onPriceSelect={jest.fn()}
        />
      );

      // Open print view
      const printButton = screen.getByRole('button', { name: /open print view/i });
      await userEvent.click(printButton);

      // Verify modal is focused
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Verify close button is focused
      const closeButton = screen.getByRole('button', { name: /close print view/i });
      expect(closeButton).toHaveFocus();

      // Close with Escape
      fireEvent.keyDown(dialog, { key: 'Escape' });
      expect(dialog).not.toBeInTheDocument();
      expect(printButton).toHaveFocus(); // Focus returns to trigger
    });
  });

  describe('ChatInterface Component', () => {
    it('has no axe violations', async () => {
      const { container } = render(
        <ChatInterface
          mlsData={mockMLSData}
          onCalculatePayment={jest.fn()}
          onUpload={jest.fn()}
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('maintains chat message focus for screen readers', async () => {
      render(
        <ChatInterface
          mlsData={mockMLSData}
          onCalculatePayment={jest.fn()}
          onUpload={jest.fn()}
        />
      );

      // Send a message
      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'Test message');
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      await userEvent.click(sendButton);

      // Verify message appears in chat history
      const messages = screen.getAllByRole('article');
      const lastMessage = messages[messages.length - 1];
      expect(lastMessage).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('PDFUpload Component', () => {
    it('has no axe violations', async () => {
      const { container } = render(
        <PDFUpload
          onUpload={jest.fn()}
          onError={jest.fn()}
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('announces upload status changes', async () => {
      const onUpload = jest.fn();
      const onError = jest.fn();
      
      const { rerender } = render(
        <PDFUpload
          onUpload={onUpload}
          onError={onError}
        />
      );

      // Create a file and trigger upload
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText(/upload pdf file/i);
      await userEvent.upload(input, file);

      // Verify processing state
      const status = screen.getByRole('status');
      expect(status).toHaveTextContent(/processing/i);

      // Simulate error
      onError('Upload failed');
      rerender(
        <PDFUpload
          onUpload={onUpload}
          onError={onError}
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(/upload failed/i);
    });
  });

  describe('Keyboard Navigation Flow', () => {
    it('supports complete keyboard navigation flow', async () => {
      render(
        <>
          <PDFUpload
            onUpload={jest.fn()}
            onError={jest.fn()}
          />
          <PropertyAnalysis
            data={mockMLSData}
            onPriceSelect={jest.fn()}
          />
          <ChatInterface
            mlsData={mockMLSData}
            onCalculatePayment={jest.fn()}
            onUpload={jest.fn()}
          />
        </>
      );

      // Tab through main elements
      const focusableElements = screen.getAllByRole('button');
      for (const element of focusableElements) {
        await userEvent.tab();
        expect(element).toHaveFocus();
      }

      // Navigate price points
      const pricePoints = screen.getAllByRole('tab');
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      expect(pricePoints[1]).toHaveFocus();

      // Open print view
      const printButton = screen.getByRole('button', { name: /open print view/i });
      await userEvent.click(printButton);

      // Navigate modal
      const closeButton = screen.getByRole('button', { name: /close print view/i });
      expect(closeButton).toHaveFocus();

      // Close modal
      fireEvent.keyDown(closeButton, { key: 'Escape' });
      expect(printButton).toHaveFocus();
    });
  });
}); 