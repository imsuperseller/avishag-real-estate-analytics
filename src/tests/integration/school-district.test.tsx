import { render, screen, within } from '@testing-library/react';
import PropertyAnalysis from '@/components/PropertyAnalysis';
import { mockMLSData } from '@/tests/test-utils';

describe('School District Analysis', () => {
  it('displays school district information correctly', () => {
    render(<PropertyAnalysis data={mockMLSData} />);

    const schoolInfo = screen.getByTestId('school-info');
    const schoolContent = within(schoolInfo);

    const { schoolDistrict } = mockMLSData;
    expect(schoolContent.getByText(schoolDistrict.name)).toBeInTheDocument();
    expect(schoolContent.getByTestId('district-rating')).toHaveTextContent(`${schoolDistrict.rating}/10`);
  });

  it('displays school levels correctly', () => {
    render(<PropertyAnalysis data={mockMLSData} />);

    const schoolLevels = screen.getByTestId('school-levels');
    const levelsContent = within(schoolLevels);

    const { schools } = mockMLSData.schoolDistrict;
    
    // Elementary Schools
    const elementarySection = within(levelsContent.getByTestId('elementary-schools'));
    schools.elementary.forEach(school => {
      expect(elementarySection.getByText(school)).toBeInTheDocument();
    });

    // Middle Schools
    const middleSection = within(levelsContent.getByTestId('middle-schools'));
    schools.middle.forEach(school => {
      expect(middleSection.getByText(school)).toBeInTheDocument();
    });

    // High Schools
    const highSection = within(levelsContent.getByTestId('high-schools'));
    schools.high.forEach(school => {
      expect(highSection.getByText(school)).toBeInTheDocument();
    });
  });

  it('displays school district rating with correct color', () => {
    render(<PropertyAnalysis data={mockMLSData} />);

    const rating = mockMLSData.schoolDistrict.rating;
    const ratingElement = screen.getByTestId('district-rating');

    // Check color based on rating
    if (rating >= 8) {
      expect(ratingElement).toHaveClass('text-green-600');
    } else if (rating >= 6) {
      expect(ratingElement).toHaveClass('text-yellow-600');
    } else {
      expect(ratingElement).toHaveClass('text-red-600');
    }
  });

  it('displays nearby schools correctly', () => {
    render(<PropertyAnalysis data={mockMLSData} />);

    const nearbySchools = screen.getByTestId('nearby-schools');
    const schoolsContent = within(nearbySchools);

    mockMLSData.schoolDistricts.forEach(school => {
      const schoolElement = schoolsContent.getByTestId(`school-${school.type}`);
      expect(schoolElement).toHaveTextContent(school.name);
      expect(schoolElement).toHaveTextContent(`Rating: ${school.rating}/10`);
      expect(schoolElement).toHaveTextContent(`${school.distance} miles`);
      expect(schoolElement).toHaveTextContent(`${school.enrollment} students`);
      expect(schoolElement).toHaveTextContent(`${school.studentTeacherRatio}:1`);
    });
  });

  it('displays school count correctly', () => {
    render(<PropertyAnalysis data={mockMLSData} />);

    const { schools } = mockMLSData.schoolDistrict;
    const totalSchools = schools.elementary.length + schools.middle.length + schools.high.length;

    const schoolCount = screen.getByTestId('school-count');
    expect(schoolCount).toHaveTextContent(`Total Schools: ${totalSchools}`);
  });
}); 