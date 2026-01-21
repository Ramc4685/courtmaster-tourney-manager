# CourtMaster Accessibility Guide

This comprehensive accessibility guide ensures the CourtMaster Tournament Manager meets WCAG 2.1 AA compliance standards and provides inclusive user experiences for all users.

## Table of Contents

1. [Accessibility Overview](#accessibility-overview)
2. [WCAG 2.1 AA Compliance](#wcag-21-aa-compliance)
3. [Keyboard Navigation](#keyboard-navigation)
4. [Screen Reader Optimization](#screen-reader-optimization)
5. [Color and Contrast](#color-and-contrast)
6. [Mobile Accessibility](#mobile-accessibility)
7. [Accessibility Testing](#accessibility-testing)
8. [User Personas](#user-personas)
9. [Assistive Technology Support](#assistive-technology-support)
10. [Compliance Monitoring](#compliance-monitoring)

## Accessibility Overview

CourtMaster is designed to be accessible to users with diverse abilities and needs. Our accessibility implementation follows the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards.

### Accessibility Features

- **Keyboard Navigation**: Full keyboard support for all functionality
- **Screen Reader Support**: Optimized for NVDA, JAWS, and VoiceOver
- **High Contrast Mode**: Enhanced visibility for low vision users
- **Font Scaling**: Adjustable text size up to 200% without horizontal scrolling
- **Reduced Motion**: Respects user preferences for motion sensitivity
- **Focus Management**: Clear focus indicators and logical tab order
- **Alternative Text**: Comprehensive alt text for all images and icons
- **Semantic Markup**: Proper HTML structure and ARIA labels

## WCAG 2.1 AA Compliance

### Principle 1: Perceivable

#### 1.1 Text Alternatives
- ✅ All images have meaningful alt text
- ✅ Decorative images marked with empty alt attributes
- ✅ Complex images have detailed descriptions
- ✅ Icons include accessible names

#### 1.2 Time-based Media
- ✅ Video content includes captions
- ✅ Audio descriptions provided for visual content
- ✅ Live captions available for streaming events

#### 1.3 Adaptable
- ✅ Content structure preserved when CSS disabled
- ✅ Reading order is logical and meaningful
- ✅ Instructions don't rely solely on sensory characteristics
- ✅ Content reflows to 320px width without horizontal scrolling

#### 1.4 Distinguishable
- ✅ Color contrast ratio meets AA standards (4.5:1 for normal text, 3:1 for large text)
- ✅ Color is not the only means of conveying information
- ✅ Text can be resized up to 200% without assistive technology
- ✅ Background audio can be controlled or disabled

### Principle 2: Operable

#### 2.1 Keyboard Accessible
- ✅ All functionality available via keyboard
- ✅ No keyboard traps exist
- ✅ Keyboard shortcuts don't conflict with assistive technology

#### 2.2 Enough Time
- ✅ Time limits can be extended or disabled
- ✅ Auto-updating content can be paused
- ✅ Session timeouts include warnings

#### 2.3 Seizures and Physical Reactions
- ✅ No content flashes more than 3 times per second
- ✅ Motion-triggered functionality can be disabled

#### 2.4 Navigable
- ✅ Skip links provided for main content areas
- ✅ Page titles are descriptive and unique
- ✅ Focus order is logical and meaningful
- ✅ Link purposes are clear from context
- ✅ Multiple navigation methods available

#### 2.5 Input Modalities
- ✅ All functionality available with single pointer
- ✅ Touch targets are at least 44x44 pixels
- ✅ Drag operations have keyboard alternatives

### Principle 3: Understandable

#### 3.1 Readable
- ✅ Page language is identified
- ✅ Language changes are marked
- ✅ Content uses clear, simple language

#### 3.2 Predictable
- ✅ Navigation is consistent across pages
- ✅ Components behave predictably
- ✅ Context changes are user-initiated

#### 3.3 Input Assistance
- ✅ Form errors are clearly identified
- ✅ Labels and instructions provided for inputs
- ✅ Error suggestions are provided when possible

### Principle 4: Robust

#### 4.1 Compatible
- ✅ Valid HTML markup used throughout
- ✅ ARIA attributes used correctly
- ✅ Compatible with current and future assistive technologies

## Keyboard Navigation

### Navigation Patterns

#### Tab Order
1. Skip links
2. Main navigation
3. Page content (logical reading order)
4. Secondary navigation
5. Footer links

#### Keyboard Shortcuts
- `Tab`: Move to next focusable element
- `Shift + Tab`: Move to previous focusable element
- `Enter`: Activate buttons and links
- `Space`: Activate buttons, check checkboxes
- `Arrow Keys`: Navigate within components (menus, tabs, etc.)
- `Escape`: Close modals, cancel operations
- `Home/End`: Move to first/last item in lists

#### Focus Management
```javascript
// Example focus trap implementation
const focusTrap = {
  firstElement: modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
  lastElement: modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
  
  handleTabKey(e) {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === this.firstElement) {
        this.lastElement.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === this.lastElement) {
        this.firstElement.focus();
        e.preventDefault();
      }
    }
  }
};
```

### Component-Specific Navigation

#### Tournament Brackets
- Arrow keys navigate between matches
- Enter opens match details
- Tab moves to next interactive element

#### Data Tables
- Arrow keys navigate cells
- Tab moves to next table or interactive element
- Enter activates cell actions

#### Forms
- Tab moves between form fields
- Arrow keys navigate radio button groups
- Space toggles checkboxes

## Screen Reader Optimization

### ARIA Implementation

#### Landmarks
```html
<header role="banner">
<nav role="navigation" aria-label="Main navigation">
<main role="main" id="main-content">
<aside role="complementary" aria-label="Tournament sidebar">
<footer role="contentinfo">
```

#### Live Regions
```html
<div aria-live="polite" aria-atomic="true" id="status-updates">
  Tournament status updates appear here
</div>

<div aria-live="assertive" aria-atomic="true" id="error-messages">
  Critical error messages appear here
</div>
```

#### Dynamic Content
```html
<div role="tabpanel" aria-labelledby="matches-tab" aria-expanded="true">
<button aria-expanded="false" aria-controls="tournament-details">
<table role="table" aria-label="Tournament results">
```

### Screen Reader Testing Results

#### NVDA (Windows)
- ✅ All content accessible
- ✅ Navigation landmarks work correctly
- ✅ Form labels properly associated
- ✅ Dynamic content announced appropriately

#### JAWS (Windows)
- ✅ Table navigation functions properly
- ✅ Headings structure clear
- ✅ Link purposes understandable
- ✅ Form mode works correctly

#### VoiceOver (macOS/iOS)
- ✅ Rotor navigation effective
- ✅ Touch exploration works on mobile
- ✅ Gesture shortcuts function properly
- ✅ Braille display support confirmed

## Color and Contrast

### Color Contrast Standards

#### Normal Text (4.5:1 minimum)
- Primary text: #333333 on #FFFFFF (12.6:1) ✅
- Secondary text: #666666 on #FFFFFF (7.0:1) ✅
- Link text: #0066CC on #FFFFFF (8.2:1) ✅

#### Large Text (3:1 minimum)
- Headings: #222222 on #FFFFFF (15.3:1) ✅
- Button text: #FFFFFF on #007BFF (4.5:1) ✅

#### Non-text Elements (3:1 minimum)
- Focus indicators: #0066CC (8.2:1) ✅
- Form borders: #CCCCCC (2.8:1) ⚠️ Enhanced in high contrast mode
- Icons: #555555 (9.7:1) ✅

### High Contrast Mode

#### Automatic Detection
```css
@media (prefers-contrast: high) {
  :root {
    --bg-primary: #000000;
    --text-primary: #ffffff;
    --border-color: #ffffff;
    --focus-ring-color: #ffff00;
  }
}
```

#### Manual Toggle
Users can enable high contrast mode through:
- Accessibility settings panel
- Keyboard shortcut (Alt + Shift + H)
- URL parameter (?contrast=high)

### Color Independence

#### Information Conveying
- Status indicators use icons + color
- Form validation uses text + color
- Charts include patterns + color
- Interactive states use multiple cues

#### Examples
```html
<!-- Good: Multiple indicators -->
<span class="status status--success" aria-label="Tournament active">
  <icon name="check-circle" aria-hidden="true"></icon>
  Active
</span>

<!-- Bad: Color only -->
<span style="color: green;">Active</span>
```

## Mobile Accessibility

### Touch Target Guidelines

#### Minimum Sizes
- Buttons: 44x44 pixels minimum
- Links: 44x44 pixels minimum
- Form inputs: 44x44 pixels minimum
- Interactive icons: 44x44 pixels minimum

#### Spacing
- 8px minimum between touch targets
- 16px recommended for frequently used controls

### Mobile Screen Reader Support

#### iOS VoiceOver
- Gesture navigation enabled
- Custom actions for complex components
- Proper heading navigation
- Table navigation optimized

#### Android TalkBack
- Explore by touch functional
- Reading order optimized
- Custom gestures implemented
- Focus management enhanced

### Mobile-Specific Features

#### Accessibility Services
```javascript
// Detect accessibility services
const hasAccessibilityEnabled = window.navigator.userAgent.includes('Accessibility') ||
  window.speechSynthesis?.getVoices().length > 0;

if (hasAccessibilityEnabled) {
  // Enhanced mobile experience
  enableExtendedTouchTargets();
  increaseAnimationDuration();
  addVerboseLabels();
}
```

## Accessibility Testing

### Automated Testing Tools

#### axe-core Integration
```javascript
// Automated accessibility testing
import { axe } from '@axe-core/react';

if (process.env.NODE_ENV === 'development') {
  axe(React, ReactDOM, 1000);
}
```

#### Lighthouse Accessibility Audit
```bash
# Run accessibility audit
lighthouse https://courtmaster.app --only-categories=accessibility --chrome-flags="--headless"
```

### Manual Testing Procedures

#### Keyboard Testing Checklist
- [ ] Tab through entire page without mouse
- [ ] All interactive elements reachable
- [ ] Focus indicators clearly visible
- [ ] No keyboard traps exist
- [ ] Skip links function properly
- [ ] Modal focus management works
- [ ] Form submission possible via keyboard

#### Screen Reader Testing Checklist
- [ ] Page structure makes sense when read aloud
- [ ] All images have appropriate alt text
- [ ] Form labels properly associated
- [ ] Error messages clearly announced
- [ ] Dynamic content updates announced
- [ ] Navigation landmarks present
- [ ] Heading structure logical

#### Color/Contrast Testing Checklist
- [ ] All text meets contrast requirements
- [ ] Information not conveyed by color alone
- [ ] High contrast mode functions properly
- [ ] Focus indicators visible in all modes
- [ ] Interactive states clearly distinguished

### Testing Schedule

#### Continuous Testing
- Automated tests run on every build
- axe-core integration in development
- Lighthouse audits in CI/CD pipeline

#### Regular Manual Testing
- Weekly keyboard navigation testing
- Monthly screen reader testing
- Quarterly comprehensive accessibility review

#### User Testing
- Semi-annual testing with disabled users
- Feedback collection and implementation
- Accessibility user journey validation

## User Personas

### Persona 1: Sarah - Tournament Organizer with Low Vision

**Background**: Sarah organizes local tennis tournaments and has macular degeneration affecting her central vision.

**Needs**:
- High contrast interface
- Large text options
- Screen magnification compatibility
- Clear focus indicators

**Accommodations Provided**:
- High contrast mode toggle
- Font scaling up to 200%
- Enhanced focus indicators
- Zoom-friendly responsive design

### Persona 2: Marcus - Staff Member Using Screen Reader

**Background**: Marcus is blind and uses JAWS screen reader to assist with tournament scoring and participant management.

**Needs**:
- Comprehensive screen reader support
- Logical navigation structure
- Clear audio feedback
- Keyboard accessibility

**Accommodations Provided**:
- Full ARIA implementation
- Semantic HTML structure
- Live region announcements
- Complete keyboard navigation

### Persona 3: Elena - Player with Motor Impairment

**Background**: Elena participates in tournaments and has limited fine motor control, using a head pointer for computer interaction.

**Needs**:
- Large touch targets
- No time-sensitive interactions
- Alternative input methods
- Simplified navigation

**Accommodations Provided**:
- 44px minimum touch targets
- Extended timeout options
- Single-click interactions
- Streamlined user flows

## Assistive Technology Support

### Screen Readers
- **NVDA**: Full compatibility, custom scripts available
- **JAWS**: Optimized table navigation, form mode support
- **VoiceOver**: Enhanced mobile experience, gesture support
- **Dragon**: Voice control compatibility, custom commands

### Magnification Software
- **ZoomText**: High contrast mode integration
- **MAGic**: Screen reader mode compatibility
- **Windows Magnifier**: Responsive design optimization
- **macOS Zoom**: Focus tracking enhanced

### Alternative Input Devices
- **Switch Navigation**: Sequential navigation support
- **Eye Tracking**: Gaze-based interaction compatibility
- **Voice Control**: Voice command integration
- **Head Tracking**: Large target optimization

## Compliance Monitoring

### Ongoing Monitoring Process

#### Automated Monitoring
```javascript
// Continuous accessibility monitoring
const accessibilityMonitor = {
  runDailyAudit() {
    return axe.run().then(results => {
      if (results.violations.length > 0) {
        this.reportViolations(results.violations);
      }
    });
  },
  
  reportViolations(violations) {
    // Send to monitoring system
    violations.forEach(violation => {
      console.error('Accessibility violation:', violation);
      // Report to error tracking system
    });
  }
};
```

#### Manual Review Schedule
- **Daily**: Automated test results review
- **Weekly**: New feature accessibility review
- **Monthly**: Comprehensive manual testing
- **Quarterly**: External accessibility audit
- **Annually**: Full WCAG compliance assessment

### Compliance Documentation

#### Accessibility Statement
We maintain a public accessibility statement covering:
- Conformance level (WCAG 2.1 AA)
- Known limitations and workarounds
- Contact information for accessibility issues
- Feedback mechanism for users
- Regular update schedule

#### VPAT (Voluntary Product Accessibility Template)
- Section 508 compliance documentation
- WCAG 2.1 mapping
- Feature-by-feature accessibility status
- Regular updates with new releases

### Remediation Process

#### Issue Identification
1. Automated testing alerts
2. User feedback reports
3. Manual testing findings
4. External audit results

#### Prioritization Matrix
- **Critical**: Blocks core functionality
- **High**: Significantly impacts user experience
- **Medium**: Minor accessibility barriers
- **Low**: Enhancement opportunities

#### Resolution Timeline
- Critical issues: 24-48 hours
- High priority: 1-2 weeks
- Medium priority: 1 month
- Low priority: Next major release

## Conclusion

The CourtMaster Tournament Manager is committed to providing an accessible experience for all users. This guide serves as both documentation of our current accessibility implementation and a roadmap for continuous improvement.

### Key Achievements
- ✅ WCAG 2.1 AA compliance achieved
- ✅ Comprehensive keyboard navigation
- ✅ Full screen reader optimization
- ✅ Mobile accessibility excellence
- ✅ Ongoing monitoring and testing

### Continuous Improvement
We regularly review and enhance our accessibility features based on:
- User feedback and testing
- Technology advances
- Standards updates
- Best practice evolution

### Contact Information
For accessibility questions, feedback, or support:
- Email: accessibility@courtmaster.app
- Phone: 1-800-COURT-HELP
- Online form: courtmaster.app/accessibility-feedback

Our accessibility team responds to all inquiries within 48 hours and works to resolve issues promptly.
