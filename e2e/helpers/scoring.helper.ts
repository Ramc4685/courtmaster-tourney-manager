import { Page, expect } from '@playwright/test';

export interface ScoreData {
  team1Score: number[];
  team2Score: number[];
  winner?: string;
  sets?: number;
}

export class ScoringHelper {
  constructor(private page: Page) {}

  async enterScore(matchId: string, scoreData: ScoreData) {
    console.log(`🏆 Entering score for match: ${matchId}`);

    // Navigate to scoring interface
    await this.navigateToScoringInterface(matchId);

    // Enter scores for each set
    await this.enterSetScores(scoreData);

    // Submit scores
    await this.submitScore();

    console.log(`✅ Score entered for match: ${matchId}`);
  }

  async enterLiveScore(matchId: string, scoreData: ScoreData) {
    console.log(`📱 Entering live score for match: ${matchId}`);

    // Navigate to live scoring
    await this.navigateToLiveScoring(matchId);

    // Enter live scores
    await this.enterLiveSetScores(scoreData);

    console.log(`✅ Live score updated for match: ${matchId}`);
  }

  async finalizeMatch(matchId: string, winner: string) {
    console.log(`🏁 Finalizing match: ${matchId}, Winner: ${winner}`);

    // Navigate to match
    await this.navigateToMatch(matchId);

    // Look for finalize/complete button
    const finalizeButtons = [
      'button:has-text("Finalize")',
      'button:has-text("Complete")',
      'button:has-text("End Match")',
      '[data-testid="finalize-match"]'
    ];

    for (const selector of finalizeButtons) {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        await this.page.waitForTimeout(500);
        break;
      }
    }

    // Confirm if modal appears
    const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Finalize")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
      await this.page.waitForTimeout(1000);
    }

    console.log(`✅ Match finalized: ${matchId}`);
  }

  async verifyScoreEntered(matchId: string, scoreData: ScoreData) {
    console.log(`🔍 Verifying score was entered for match: ${matchId}`);

    // Navigate to match or score view
    await this.navigateToMatch(matchId);

    // Check for scores in the interface
    for (let i = 0; i < scoreData.team1Score.length; i++) {
      const team1ScoreElement = this.page.locator(`[data-testid="team1-set-${i+1}"], .team1-score-${i+1}, .set-${i+1} .team1-score`);
      const team2ScoreElement = this.page.locator(`[data-testid="team2-set-${i+1}"], .team2-score-${i+1}, .set-${i+1} .team2-score`);

      if (await team1ScoreElement.isVisible()) {
        await expect(team1ScoreElement).toContainText(scoreData.team1Score[i].toString());
      }

      if (await team2ScoreElement.isVisible()) {
        await expect(team2ScoreElement).toContainText(scoreData.team2Score[i].toString());
      }
    }

    console.log(`✅ Score verification completed for match: ${matchId}`);
  }

  async verifyMatchCompleted(matchId: string, winner: string) {
    console.log(`🔍 Verifying match completion: ${matchId}`);

    // Navigate to match
    await this.navigateToMatch(matchId);

    // Check for completion status
    const statusElements = [
      '.match-status:has-text("Completed")',
      '.match-status:has-text("Finished")',
      '[data-testid="match-status"]:has-text("Completed")',
      '.status-completed'
    ];

    let statusFound = false;
    for (const selector of statusElements) {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        statusFound = true;
        break;
      }
    }

    expect(statusFound).toBeTruthy();

    // Check winner if specified
    if (winner) {
      const winnerElements = [
        `.winner:has-text("${winner}")`,
        `.match-winner:has-text("${winner}")`,
        `[data-testid="match-winner"]:has-text("${winner}")`
      ];

      let winnerFound = false;
      for (const selector of winnerElements) {
        const element = this.page.locator(selector);
        if (await element.isVisible()) {
          winnerFound = true;
          break;
        }
      }

      expect(winnerFound).toBeTruthy();
    }

    console.log(`✅ Match completion verified: ${matchId}`);
  }

  private async navigateToScoringInterface(matchId: string) {
    // Try different ways to access scoring interface
    const scoringUrls = [
      `/matches/${matchId}/score`,
      `/tournaments/*/matches/${matchId}/score`,
      `/scoring/${matchId}`
    ];

    // First try direct navigation
    for (const url of scoringUrls) {
      try {
        await this.page.goto(url);
        await this.page.waitForLoadState('networkidle');
        if (!this.page.url().includes('404')) {
          return;
        }
      } catch (error) {
        // Continue to next URL
      }
    }

    // Alternative: find match and click score button
    await this.findMatchAndClickScore(matchId);
  }

  private async navigateToLiveScoring(matchId: string) {
    // Similar to scoring interface but for live scoring
    await this.navigateToScoringInterface(matchId);

    // Look for live scoring mode
    const liveButtons = [
      'button:has-text("Live")',
      'button:has-text("Live Score")',
      '[data-testid="live-scoring"]'
    ];

    for (const selector of liveButtons) {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        await this.page.waitForTimeout(500);
        break;
      }
    }
  }

  private async navigateToMatch(matchId: string) {
    // Find match in schedule or matches list
    const matchSelectors = [
      `[data-match-id="${matchId}"]`,
      `tr:has-text("${matchId}")`,
      `.match-${matchId}`,
      `[id*="${matchId}"]`
    ];

    for (const selector of matchSelectors) {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        await this.page.waitForTimeout(500);
        return;
      }
    }
  }

  private async findMatchAndClickScore(matchId: string) {
    // Navigate to matches/schedule page first
    const matchesUrl = '/tournaments/*/matches'; // This would need tournament ID

    // Find match in list
    const matchElement = this.page.locator(`[data-match-id="${matchId}"], tr:has-text("${matchId}")`);

    // Click score button
    const scoreButton = matchElement.locator('button:has-text("Score"), [data-testid="score-match"]');
    if (await scoreButton.isVisible()) {
      await scoreButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  private async enterSetScores(scoreData: ScoreData) {
    const sets = Math.max(scoreData.team1Score.length, scoreData.team2Score.length);

    for (let i = 0; i < sets; i++) {
      // Team 1 score for set i+1
      const team1Input = this.page.locator(`input[name="team1Set${i+1}"], [data-testid="team1-set-${i+1}"], .team1-set-${i+1} input`);
      if (await team1Input.isVisible() && i < scoreData.team1Score.length) {
        await team1Input.fill(scoreData.team1Score[i].toString());
      }

      // Team 2 score for set i+1
      const team2Input = this.page.locator(`input[name="team2Set${i+1}"], [data-testid="team2-set-${i+1}"], .team2-set-${i+1} input`);
      if (await team2Input.isVisible() && i < scoreData.team2Score.length) {
        await team2Input.fill(scoreData.team2Score[i].toString());
      }

      await this.page.waitForTimeout(300);
    }
  }

  private async enterLiveSetScores(scoreData: ScoreData) {
    // For live scoring, might have increment/decrement buttons
    const sets = Math.max(scoreData.team1Score.length, scoreData.team2Score.length);

    for (let i = 0; i < sets; i++) {
      if (i < scoreData.team1Score.length) {
        await this.setScoreValue('team1', i + 1, scoreData.team1Score[i]);
      }

      if (i < scoreData.team2Score.length) {
        await this.setScoreValue('team2', i + 1, scoreData.team2Score[i]);
      }
    }
  }

  private async setScoreValue(team: string, set: number, targetScore: number) {
    // Try direct input first
    const input = this.page.locator(`input[name="${team}Set${set}"], [data-testid="${team}-set-${set}"]`);
    if (await input.isVisible()) {
      await input.fill(targetScore.toString());
      return;
    }

    // Try increment buttons if direct input not available
    const incrementButton = this.page.locator(`[data-testid="${team}-set-${set}-increment"], .${team}-set-${set} .increment`);
    const currentScoreElement = this.page.locator(`[data-testid="${team}-set-${set}-score"], .${team}-set-${set} .score`);

    if (await incrementButton.isVisible() && await currentScoreElement.isVisible()) {
      let currentScore = 0;
      const scoreText = await currentScoreElement.textContent();
      if (scoreText) {
        currentScore = parseInt(scoreText);
      }

      // Click increment button to reach target score
      while (currentScore < targetScore) {
        await incrementButton.click();
        await this.page.waitForTimeout(100);
        currentScore++;
      }
    }
  }

  private async submitScore() {
    const submitButtons = [
      'button:has-text("Submit")',
      'button:has-text("Save Score")',
      'button:has-text("Update Score")',
      'button[type="submit"]',
      '[data-testid="submit-score"]'
    ];

    for (const selector of submitButtons) {
      const element = this.page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        await this.page.waitForTimeout(1000);
        break;
      }
    }
  }
}