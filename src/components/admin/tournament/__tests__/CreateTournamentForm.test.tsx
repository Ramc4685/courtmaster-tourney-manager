
import React from 'react';
import { render, screen } from '@testing-library/react';
import CreateTournamentForm from '../CreateTournamentForm';

describe('CreateTournamentForm', () => {
  it('renders the form correctly', () => {
    render(<CreateTournamentForm onSubmit={jest.fn()} />);
    expect(screen.getByText('Tournament Format')).toBeInTheDocument();
  });

  // Add more tests as needed
});
