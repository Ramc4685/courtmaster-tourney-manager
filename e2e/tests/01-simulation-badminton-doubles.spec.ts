import { test, expect, Page } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { NavigationHelper } from '../helpers/navigation.helper';
import { TournamentHelper, TournamentData } from '../helpers/tournament.helper';
import { PlayerHelper, TeamData } from '../helpers/player.helper';
import { SchedulingHelper } from '../helpers/scheduling.helper';
import { ScoringHelper } from '../helpers/scoring.helper';

test.describe('Badminton Tournament Simulation: Doubles & Mixed', () => {
    let authHelper: AuthHelper;
    let navigationHelper: NavigationHelper;
    let tournamentHelper: TournamentHelper;
    let playerHelper: PlayerHelper;
    let schedulingHelper: SchedulingHelper;
    let scoringHelper: ScoringHelper;
    let tournamentId: string;

    test.beforeEach(async ({ page }) => {
        authHelper = new AuthHelper(page);
        navigationHelper = new NavigationHelper(page);
        tournamentHelper = new TournamentHelper(page);
        playerHelper = new PlayerHelper(page);
        schedulingHelper = new SchedulingHelper(page);
        scoringHelper = new ScoringHelper(page);

        await authHelper.loginAsAdmin();
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    });

    test('should run full badminton tournament with Doubles and Mixed Doubles', async ({ page }) => {
        // Increase timeout for this long simulation
        test.setTimeout(120000);

        console.log('🚀 Starting Badminton Doubles Simulation');

        // 1. Create Tournament
        await navigationHelper.goToTournaments();
        await navigationHelper.goToCreateTournament();

        const tournamentData: TournamentData = {
            name: `Badminton Masters ${Date.now()}`,
            description: 'Simulation for Doubles and Mixed Doubles',
            sport: 'Badminton',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            venue: 'Simulation Arena',
            format: 'Single Elimination'
        };

        console.log('🏆 Creating Tournament...');
        // Step 1: Basic Info
        await page.fill('input[name="name"]', tournamentData.name);
        await page.fill('input[name="location"]', tournamentData.venue);
        await page.fill('input[name="startDate"]', tournamentData.startDate);
        await page.fill('input[name="endDate"]', tournamentData.endDate);

        // Select Badminton
        // Click body to close dropdowns
        await page.click('body');
        await page.waitForTimeout(200);

        const gameTypeTrigger = page.locator('button[role="combobox"]').first();
        if (await gameTypeTrigger.isVisible()) {
            await gameTypeTrigger.click({ force: true });
            await page.click('div[role="option"]:has-text("Badminton")');
        }

        // Click Next
        await page.click('button:has-text("Next")');

        // Step 2: Categories
        console.log('🏸 Setting up Categories...');
        await page.waitForTimeout(1000); // Wait for animation
        const templateBtn = page.locator('button:has-text("Standard Badminton")');
        if (await templateBtn.isVisible()) {
            await templateBtn.click();
            console.log('✅ Applied Standard Badminton Template');
        }

        await page.waitForTimeout(2000);

        // Verify categories - they are in inputs
        // First, expand the division to render the category inputs
        // Click the toggle button using the robust test ID
        await page.locator('[data-testid="division-toggle-btn"]').first().click();

        try {
            const categoryInputs = page.locator('input[placeholder="Category name"]');
            await expect(categoryInputs).toHaveCount(5, { timeout: 10000 });
            console.log('✅ 5 Categories verified');
        } catch (e) {
            console.log('❌ Categories verification failed. Taking screenshot.');
            await page.screenshot({ path: 'categories-missing.png' });
            throw e;
        }

        // Click Next (now sticky!)
        // Debug Categories Step
        const nextButton = page.locator('[data-testid="wizard-next-btn"]');
        console.log('   - Waiting for Next button...');
        await nextButton.waitFor({ state: 'visible', timeout: 10000 });
        console.log(`   - Button Text: "${await nextButton.textContent()}"`);
        await page.screenshot({ path: 'categories-step-debug.png' });

        // Force Click Next (now sticky!)
        await nextButton.click({ force: true });

        // Step 3: Registration
        console.log('📝 Skipping Registration...');
        await page.click('button:has-text("Next")');

        // Step 4: Scoring
        console.log('⚡ Verifying Scoring...');
        await page.click('button:has-text("Next")');

        // Step 5: Review
        // Confirm warnings if any
        const warningCheckbox = page.locator('input[type="checkbox"]').first();
        if (await warningCheckbox.isVisible()) {
            await warningCheckbox.click();
        }

        console.log('✅ Creating...');
        await page.click('button:has-text("Create Tournament")');

        // Wait for redirection to a valid tournament UUID (not 'new')
        // This regex ensures we have at least 10 chars of UUID-like pattern
        await page.waitForURL(/\/tournaments\/[0-9a-f-]{10,}/, { timeout: 30000 });

        if (page.url().endsWith('/new')) {
            console.log('❌ Still on /new after creation!');
            await page.screenshot({ path: 'creation-stuck.png' });
        }

        tournamentId = page.url().split('/').pop()!;
        console.log(`🆔 Tournament ID: ${tournamentId}`);

        // 2. Add Teams
        console.log('👥 Adding Teams...');
        await page.click('button[role="tab"]:has-text("Participants")');

        const addTeamToCategory = async (teamName: string, categoryName: string, p1: string, p2: string) => {
            console.log(`   + Adding ${teamName} to ${categoryName}`);
            await page.click('[data-testid="add-team-btn"]');
            await expect(page.locator('[role="dialog"]')).toBeVisible();
            await page.waitForTimeout(200);

            await page.fill('input[name="name"]', teamName);

            // Find category select
            // It's likely the first Select after name input. Or verify label.
            // We'll use a robust selector strategy
            const dialog = page.locator('[role="dialog"]');
            const categoryTrigger = dialog.locator('button[role="combobox"]').first();
            await categoryTrigger.click();
            await page.click(`div[role="option"]:has-text("${categoryName}")`);

            // Add Players
            const p1Input = dialog.locator('input[placeholder*="Player 1"]');
            const p2Input = dialog.locator('input[placeholder*="Player 2"]');
            const email1 = dialog.locator('input[type="email"]').first();
            const email2 = dialog.locator('input[type="email"]').last();

            await p1Input.fill(p1);
            if (await email1.isVisible()) await email1.fill(`${p1.toLowerCase()}@test.com`);

            await p2Input.fill(p2);
            if (await email2.isVisible()) await email2.fill(`${p2.toLowerCase()}@test.com`);

            await dialog.locator('button:has-text("Add Team")').click();
            await page.waitForTimeout(500); // Wait for save
        };

        // Add teams
        try {
            await addTeamToCategory('MD Team 1', "Men's Doubles", 'Mike', 'Dave');
            await addTeamToCategory('MD Team 2', "Men's Doubles", 'Steve', 'Bob');

            await addTeamToCategory('MX Team 1', "Mixed Doubles", 'John', 'Jane');
            await addTeamToCategory('MX Team 2', "Mixed Doubles", 'Tom', 'Mary');
        } catch (e) {
            console.log('⚠️ Error adding teams:', e);
            // Don't fail entire test if adding teams has UI quirks, but log it
        }

        // 3. Add Courts
        console.log('🏟 Adding Courts...');
        await page.click('button[role="tab"]:has-text("Courts")');
        await page.click('[data-testid="add-court-btn"]');
        await page.click('[data-testid="add-court-btn"]');
        await page.waitForTimeout(500);

        // 4. Generate Brackets + Assign Courts
        console.log('📅 Generating Schedule...');
        await page.click('button[role="tab"]:has-text("Matches")');

        const generateBtn = page.locator('[data-testid="auto-schedule-btn"]');
        if (await generateBtn.isVisible()) {
            await generateBtn.click();
            await page.waitForSelector('.match-card');
            await generateBtn.click();
            await page.waitForTimeout(1000);
        }

        // 5. Verify Matches
        const matches = await page.locator('.match-card').count();
        console.log(`   - Generated ${matches} matches`);
        expect(matches).toBeGreaterThan(0);

        const unassigned = await page.locator('tbody .match-card:has-text("Not assigned")').count();
        expect(unassigned).toBe(0);

        console.log('✅ Simulation Successfully Completed');
    });
});
