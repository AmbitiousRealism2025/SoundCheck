# SoundCheck Test Suite

This directory contains the comprehensive Playwright test suite for the SoundCheck application.

## Test Structure

### Setup Files
- `setup/auth.fixture.ts` - Authentication mocking fixtures
- `setup/setup.ts` - Global test configuration and utilities

### Test Categories

#### 1. Landing Page Tests (`landing/`)
- `landing.test.ts` - Tests for the landing page and login functionality

#### 2. Home/Navigation Tests (`home/`)
- `navigation.test.ts` - Tests for tab navigation, floating action button, and state management

#### 3. Rehearsal Management Tests (`rehearsals/`)
- `rehearsal-management.test.ts` - Tests for creating, editing, and deleting rehearsals and tasks

#### 4. Gig Management Tests (`gigs/`)
- `gig-management.test.ts` - Tests for creating, editing, and deleting gigs, including directions and contact functionality

#### 5. Earnings Tracker Tests (`earnings/`)
- `earnings-tracker.test.ts` - Tests for earnings calculations, monthly/yearly breakdowns, and currency formatting

#### 6. Calendar Tests (`calendar/`)
- `calendar-functionality.test.ts` - Tests for calendar views, event display, and iCal export

#### 7. Mobile Responsiveness Tests (`responsiveness/`)
- `mobile.test.ts` - Tests for mobile layouts, touch interactions, and responsive behavior

## Running Tests

### Basic Test Execution
```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/landing/landing.test.ts

# Run tests with specific pattern
npm test -- --grep "landing"
```

### Test Execution Options
```bash
# Run tests with UI mode
npm run test:ui

# Run tests in headed mode (visible browser)
npm run test:headed

# Run tests in debug mode
npm run test:debug

# Run mobile-specific tests
npm run test:mobile

# View test report
npm run test:report
```

### Test Configuration
- Tests are configured in `playwright.config.ts`
- Default base URL: `http://localhost:5000`
- Web server automatically starts before tests
- Tests run on multiple browsers (Chrome, Firefox, Safari)
- Mobile testing includes iPhone 12 and Pixel 5 viewports

## Test Features

### Authentication Mocking
All tests use mocked authentication to avoid requiring real login:
- Mock user: `{ id: 1, email: 'test@example.com', name: 'Test User' }`
- All API endpoints are mocked with realistic responses
- Sessions are properly simulated

### Test Data
Tests use predefined test data:
- Rehearsals with and without tasks
- Gigs with various compensation scenarios
- Calendar events across different dates
- Mobile-specific test scenarios

### Mobile Testing
Comprehensive mobile testing includes:
- Multiple device viewports (iPhone 12, Pixel 5, iPad)
- Touch interaction testing
- Responsive layout verification
- Keyboard handling on mobile
- Landscape orientation testing

### Coverage Areas
- ✅ User Interface - All tabs, navigation, and components
- ✅ Data Management - CRUD operations for all entities
- ✅ User Experience - Mobile responsiveness, accessibility
- ✅ Integration - Cross-feature functionality
- ✅ Error Handling - Edge cases and validation

## Best Practices

### Writing New Tests
1. Use the existing test structure and naming conventions
2. Leverage the setup utilities for authentication mocking
3. Follow the pattern: Arrange → Act → Assert
4. Use test IDs for element selection (`data-testid`)
5. Mock all API responses to ensure test isolation

### Test Organization
- Group related tests in `describe` blocks
- Use descriptive test names that explain the scenario
- Keep tests focused on a single behavior
- Use beforeEach for common setup
- Mock data at the appropriate level

### Debugging Tests
- Use `npm run test:debug` for step-by-step debugging
- Use `console.log` for debugging test flow
- Check the HTML report for detailed failure information
- Use browser devtools when running in headed mode

## Adding New Tests

When adding new features:

1. Create test files in the appropriate directory
2. Update the `tests/README.md` if adding new categories
3. Ensure all test IDs are properly implemented
4. Add appropriate mocking for new API endpoints
5. Consider mobile responsiveness for new components
6. Update this documentation as needed

## Known Limitations

- Tests require the development server to be running
- Some calendar features may need more specific implementation details
- Real authentication flow is not tested (mocked for reliability)
- iCal export functionality needs implementation-specific testing

## Future Enhancements

- Add integration tests with real database (test container)
- Implement visual regression testing
- Add performance testing scenarios
- Expand accessibility testing coverage
- Add API contract testing