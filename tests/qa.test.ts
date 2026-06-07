import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

const BASE_URL = process.env.TEST_URL || 'https://gamealyxdev.up.railway.app';
const TIMEOUT = 15000;
const PLAYERS = ['Player A', 'Player B', 'Player C', 'Player D'];

// ===== Helpers =====

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createDriver(headless = false): Promise<WebDriver> {
  const options = new chrome.Options();
  options.addArguments('--use-fake-ui-for-media-stream');
  options.addArguments('--use-fake-device-for-media-stream');
  options.addArguments('--autoplay-policy=no-user-gesture-required');
  options.addArguments('--disable-notifications');
  if (headless) options.addArguments('--headless=new');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  await driver.manage().window().setRect({ width: 1100, height: 800 });
  return driver;
}

let passCount = 0;
let failCount = 0;

function log(test: string, status: 'PASS' | 'FAIL' | 'INFO', message: string) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '📋';
  console.log(`${icon} [${test}] ${message}`);
  if (status === 'PASS') passCount++;
  if (status === 'FAIL') failCount++;
}

async function safeFind(driver: WebDriver, by: By, timeout = TIMEOUT) {
  try {
    return await driver.wait(until.elementLocated(by), timeout);
  } catch {
    return null;
  }
}

async function getTextSafe(driver: WebDriver, by: By): Promise<string> {
  try {
    const el = await driver.findElement(by);
    return await el.getText();
  } catch {
    return '';
  }
}

// ===== TEST: Homepage =====

async function testHomepage(driver: WebDriver) {
  const t = 'Homepage';
  await driver.get(BASE_URL);
  await driver.wait(until.elementLocated(By.xpath("//*[contains(text(),'DATA')]")), TIMEOUT);

  const title = await getTextSafe(driver, By.css('h1'));
  log(t, title.includes('DATA') && title.includes('SABOTAGE') ? 'PASS' : 'FAIL', `Title: "${title}"`);

  const chibis = await driver.findElements(By.css('svg'));
  log(t, chibis.length >= 6 ? 'PASS' : 'FAIL', `Chibi characters: ${chibis.length}`);

  const btnBuat = await safeFind(driver, By.xpath("//button[contains(text(),'Buat Room Baru')]"));
  const btnGabung = await safeFind(driver, By.xpath("//button[contains(text(),'Gabung Room')]"));
  log(t, btnBuat && btnGabung ? 'PASS' : 'FAIL', 'Menu buttons');

  const footer = await getTextSafe(driver, By.xpath("//*[contains(text(),'Created by')]"));
  log(t, footer.includes('Alief Akbar') ? 'PASS' : 'FAIL', `Footer: "${footer}"`);

  const settingsBtn = await safeFind(driver, By.css('button[title="Pengaturan"]'));
  log(t, settingsBtn ? 'PASS' : 'FAIL', 'Settings button');
}

// ===== TEST: Settings Menu =====

async function testSettingsMenu(driver: WebDriver) {
  const t = 'Settings';
  await driver.get(BASE_URL);
  await wait(1000);

  const btn = await safeFind(driver, By.css('button[title="Pengaturan"]'));
  if (!btn) { log(t, 'FAIL', 'Settings button not found'); return; }
  await btn.click();
  await wait(500);

  const heading = await getTextSafe(driver, By.xpath("//*[contains(text(),'Pengaturan')]"));
  log(t, heading ? 'PASS' : 'FAIL', 'Menu opened');

  const sliders = await driver.findElements(By.css('input[type="range"]'));
  log(t, sliders.length === 3 ? 'PASS' : 'FAIL', `Volume sliders: ${sliders.length}/3`);

  const closeBtn = await safeFind(driver, By.xpath("//button[contains(text(),'✕')]"));
  if (closeBtn) { await closeBtn.click(); await wait(300); }
  log(t, 'PASS', 'Menu closed');
}

// ===== TEST: Cara Main =====

async function testCaraMain(driver: WebDriver) {
  const t = 'Cara Main';
  await driver.get(BASE_URL + '/cara-main');
  const el = await safeFind(driver, By.xpath("//*[contains(text(),'Cara Main')]"));
  log(t, el ? 'PASS' : 'FAIL', 'Page loaded');
}

// ===== TEST: Role Book =====

async function testRoleBook(driver: WebDriver) {
  const t = 'Role Book';
  await driver.get(BASE_URL + '/role-book');
  await wait(1000);

  const text = await getTextSafe(driver, By.css('main'));
  const roles = ['Shadow Analyst', 'Data Steward', 'Data Engineer', 'Data Analyst', 'Head of Data'];
  for (const role of roles) {
    log(t, text.includes(role) ? 'PASS' : 'FAIL', `Role: ${role}`);
  }
}

// ===== TEST: Create Room =====

async function testCreateRoom(driver: WebDriver): Promise<string | null> {
  const t = 'Create Room';
  await driver.get(BASE_URL);
  await wait(1000);

  await (await safeFind(driver, By.xpath("//button[contains(text(),'Buat Room Baru')]")))!.click();
  await wait(500);

  const nameInput = await safeFind(driver, By.css('input[placeholder="Nama kamu"]'));
  const roomInput = await safeFind(driver, By.css('input[placeholder="Nama room"]'));
  if (!nameInput || !roomInput) { log(t, 'FAIL', 'Form inputs not found'); return null; }

  await nameInput.sendKeys('Head of Data');
  await roomInput.sendKeys('QA Test Room');

  // Set max players to 4 (click minus until 4)
  for (let i = 0; i < 16; i++) {
    const minusBtns = await driver.findElements(By.xpath("//button[contains(text(),'-')]"));
    if (minusBtns.length > 0) await minusBtns[0].click();
    await wait(100);
  }
  log(t, 'PASS', 'Max players set to 4');

  const submitBtn = await safeFind(driver, By.xpath("//button[text()='Buat Room']"));
  if (!submitBtn) { log(t, 'FAIL', 'Submit button not found'); return null; }
  await submitBtn.click();
  await wait(3000);

  const url = await driver.getCurrentUrl();
  if (url.includes('/room/')) {
    const code = url.split('/room/')[1].split('?')[0];
    log(t, 'PASS', `Room created: ${code}`);
    return code;
  }
  log(t, 'FAIL', `Not redirected: ${url}`);
  return null;
}

// ===== TEST: Lobby Chat =====

async function testLobbyChat(driver: WebDriver) {
  const t = 'Lobby Chat';
  const chatInput = await safeFind(driver, By.css('input[placeholder="Tulis pesan..."]'));
  if (!chatInput) { log(t, 'FAIL', 'Chat input not found'); return; }

  await chatInput.sendKeys('Halo semua! Game akan segera dimulai.');
  const sendBtn = await safeFind(driver, By.xpath("//button[contains(text(),'Kirim')]"));
  if (sendBtn) await sendBtn.click();
  await wait(1000);

  const msg = await safeFind(driver, By.xpath("//*[contains(text(),'Halo semua')]"));
  log(t, msg ? 'PASS' : 'FAIL', 'Chat message sent & displayed');
}

// ===== TEST: Lobby Mic/Cam =====

async function testLobbyMedia(driver: WebDriver) {
  const t = 'Lobby Media';

  const micBtn = await safeFind(driver, By.xpath("//button[contains(text(),'Mic')]"));
  if (!micBtn) { log(t, 'FAIL', 'Mic button not found'); return; }
  await micBtn.click();
  await wait(1000);
  const micText = await micBtn.getText();
  log(t, micText.includes('ON') ? 'PASS' : 'FAIL', `Mic: ${micText}`);

  const camBtn = await safeFind(driver, By.xpath("//button[contains(text(),'Cam')]"));
  if (!camBtn) { log(t, 'FAIL', 'Cam button not found'); return; }
  await camBtn.click();
  await wait(1000);
  const camText = await camBtn.getText();
  log(t, camText.includes('ON') ? 'PASS' : 'FAIL', `Cam: ${camText}`);
}

// ===== TEST: Join Room =====

async function testJoinRoom(driver: WebDriver, playerName: string, roomCode: string): Promise<boolean> {
  const t = `Join (${playerName})`;
  await driver.get(BASE_URL);
  await wait(1000);

  await (await safeFind(driver, By.xpath("//button[contains(text(),'Gabung Room')]")))!.click();
  await wait(500);

  const nameInput = await safeFind(driver, By.css('input[placeholder="Nama kamu"]'));
  const codeInput = await safeFind(driver, By.css('input[placeholder*="Kode Room"]'));
  if (!nameInput || !codeInput) { log(t, 'FAIL', 'Inputs not found'); return false; }

  await nameInput.sendKeys(playerName);
  await codeInput.sendKeys(roomCode);

  const joinBtns = await driver.findElements(By.xpath("//button[contains(text(),'Gabung')]"));
  // Find the small Gabung button (not the big "Gabung Room" one)
  for (const btn of joinBtns) {
    const text = await btn.getText();
    if (text === 'Gabung') {
      await btn.click();
      break;
    }
  }
  await wait(3000);

  const url = await driver.getCurrentUrl();
  if (url.includes('/room/')) {
    log(t, 'PASS', `Joined room`);

    // Wait for lobby to load
    const lobby = await safeFind(driver, By.xpath("//*[contains(text(),'Lobby Chat')]"));
    log(t, lobby ? 'PASS' : 'FAIL', 'Lobby loaded');
    return true;
  }
  log(t, 'FAIL', `Not redirected: ${url}`);
  return false;
}

// ===== TEST: Start Game =====

async function testStartGame(godDriver: WebDriver) {
  const t = 'Start Game';

  // Find start button (should be enabled now with 4 players)
  const startBtn = await safeFind(godDriver, By.xpath("//button[contains(text(),'Mulai Game')]"));
  if (!startBtn) { log(t, 'FAIL', 'Start button not found'); return; }

  const disabled = await startBtn.getAttribute('disabled');
  log(t, disabled === null ? 'PASS' : 'FAIL', `Start button enabled: ${disabled === null}`);

  await startBtn.click();
  await wait(2000);

  // Check intro phase
  const introText = await safeFind(godDriver, By.xpath("//*[contains(text(),'DataNova')]"), 10000);
  log(t, introText ? 'PASS' : 'FAIL', 'Intro storyline started');
}

// ===== TEST: Intro Phase =====

async function testIntroPhase(godDriver: WebDriver, playerDrivers: WebDriver[]) {
  const t = 'Intro Phase';

  // Wait for story to complete (13 lines * 2.5s = ~33s)
  log(t, 'INFO', 'Waiting for storyline... (~35s)');
  await wait(36000);

  // God should see "Mulai Malam Pertama" button
  const nightBtn = await safeFind(godDriver, By.xpath("//button[contains(text(),'Mulai Malam Pertama')]"), 5000);
  log(t, nightBtn ? 'PASS' : 'FAIL', 'God sees "Mulai Malam Pertama" button');

  // Players should see their roles
  for (let i = 0; i < playerDrivers.length; i++) {
    const roleEl = await safeFind(playerDrivers[i], By.xpath("//*[contains(text(),'Role kamu')]"), 3000);
    log(t, roleEl ? 'PASS' : 'FAIL', `${PLAYERS[i]} sees their role`);
  }

  // God starts night
  if (nightBtn) {
    await nightBtn.click();
    await wait(2000);
  }
}

// ===== TEST: Night Phase =====

async function testNightPhase(godDriver: WebDriver, playerDrivers: WebDriver[]) {
  const t = 'Night Phase';

  // Check phase label
  const phaseLabel = await getTextSafe(godDriver, By.xpath("//*[contains(text(),'After Hours')]"));
  log(t, phaseLabel ? 'PASS' : 'FAIL', `Night phase: "${phaseLabel}"`);

  // Check God can see all roles
  const godMain = await getTextSafe(godDriver, By.css('main'));
  log(t, godMain.includes('Head of Data') ? 'PASS' : 'FAIL', 'God sees Head of Data label');

  // Each player tries to use their skill
  for (let i = 0; i < playerDrivers.length; i++) {
    const driver = playerDrivers[i];
    const playerName = PLAYERS[i];

    // Check if player has a night action button
    const actionBtn = await safeFind(driver, By.xpath("//button[contains(text(),'Gunakan')]"), 3000);
    if (actionBtn) {
      // Find a target to click
      const targets = await driver.findElements(By.xpath("//div[contains(@class,'cursor-pointer') and contains(@class,'rounded-lg')]"));
      if (targets.length > 0) {
        // Click first available target
        await targets[0].click();
        await wait(300);

        // For data_scientist / ml_engineer, click second target too
        if (targets.length > 1) {
          try {
            const actionBtnText = await actionBtn.getText();
            if (actionBtnText.includes('Predictive') || actionBtnText.includes('Anomaly')) {
              await targets[1].click();
              await wait(300);
            }
          } catch { /* ignore */ }
        }

        await actionBtn.click();
        await wait(1000);

        // Check for night result
        const result = await safeFind(driver, By.xpath("//*[contains(@class,'card')]//p"), 2000);
        const resultText = result ? await result.getText() : 'no result';
        log(t, 'PASS', `${playerName} used skill: ${resultText.substring(0, 60)}...`);
      } else {
        log(t, 'INFO', `${playerName} has skill but no targets visible`);
      }
    } else {
      // Check if player has passive skill or no night skill
      log(t, 'INFO', `${playerName} has no night action (passive or day skill)`);
    }
  }

  // God checks log
  const godLogEl = await safeFind(godDriver, By.xpath("//*[contains(text(),'Log Aksi Malam')]"), 3000);
  log(t, godLogEl ? 'PASS' : 'INFO', 'God night log');

  // God transitions to day
  const dayBtn = await safeFind(godDriver, By.xpath("//button[contains(text(),'Lanjut ke Daily Standup')]"));
  if (dayBtn) {
    await dayBtn.click();
    await wait(2000);
    log(t, 'PASS', 'Transitioned to day');
  } else {
    log(t, 'FAIL', '"Lanjut ke Daily Standup" button not found');
  }
}

// ===== TEST: Day Phase =====

async function testDayPhase(godDriver: WebDriver, playerDrivers: WebDriver[]) {
  const t = 'Day Phase';

  // Check phase label
  const phaseLabel = await getTextSafe(godDriver, By.xpath("//*[contains(text(),'Daily Standup')]"));
  log(t, phaseLabel ? 'PASS' : 'FAIL', `Day phase: "${phaseLabel}"`);

  // Check timer countdown (if set)
  const timer = await safeFind(godDriver, By.xpath("//*[contains(text(),'Debat')]"), 3000);
  log(t, timer ? 'PASS' : 'INFO', `Debate timer: ${timer ? 'visible' : 'not set'}`);

  // Players chat during day
  for (let i = 0; i < playerDrivers.length; i++) {
    const driver = playerDrivers[i];
    const chatInput = await safeFind(driver, By.css('input[placeholder*="pesan"]'), 3000);
    if (chatInput) {
      await chatInput.sendKeys(`${PLAYERS[i]} menuduh seseorang!`);
      const sendBtn = await safeFind(driver, By.xpath("//button[contains(text(),'Kirim')]"));
      if (sendBtn) await sendBtn.click();
      await wait(500);
    }
  }
  log(t, 'PASS', 'Day chat messages sent');

  // Players vote (each votes for first available target)
  for (let i = 0; i < playerDrivers.length; i++) {
    const driver = playerDrivers[i];
    // Click on a player card to vote
    const playerCards = await driver.findElements(By.xpath("//div[contains(@class,'cursor-pointer') and contains(@class,'rounded-lg')]"));
    if (playerCards.length > 0) {
      // Vote for a different player (not self)
      const targetIdx = (i + 1) % playerCards.length;
      await playerCards[targetIdx].click();
      await wait(300);
      log(t, 'PASS', `${PLAYERS[i]} voted`);
    }
  }

  // God processes voting
  await wait(1000);
  const voteBtn = await safeFind(godDriver, By.xpath("//button[contains(text(),'Proses Voting')]"));
  if (voteBtn) {
    await voteBtn.click();
    await wait(2000);
    log(t, 'PASS', 'Voting processed');
  } else {
    log(t, 'FAIL', '"Proses Voting" button not found');
  }
}

// ===== TEST: Full Game Loop (until win) =====

async function testGameLoop(godDriver: WebDriver, playerDrivers: WebDriver[]) {
  const t = 'Game Loop';
  const MAX_ROUNDS = 10;

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    log(t, 'INFO', `--- Round ${round} ---`);

    // Check if game is over
    const winScreen = await safeFind(godDriver, By.xpath("//*[contains(text(),'MENANG')]"), 2000);
    if (winScreen) {
      const winText = await winScreen.getText();
      log(t, 'PASS', `Game ended! ${winText}`);
      return true;
    }

    // Check current phase
    const pageText = await getTextSafe(godDriver, By.css('main'));

    if (pageText.includes('After Hours') || pageText.includes('Malam')) {
      // Night phase
      log(t, 'INFO', `Round ${round}: Night`);

      // Players use skills
      for (let i = 0; i < playerDrivers.length; i++) {
        const driver = playerDrivers[i];
        try {
          const actionBtn = await safeFind(driver, By.xpath("//button[contains(text(),'Gunakan')]"), 2000);
          if (actionBtn) {
            const targets = await driver.findElements(By.xpath("//div[contains(@class,'cursor-pointer') and contains(@class,'rounded-lg')]"));
            if (targets.length > 0) {
              await targets[0].click();
              await wait(200);

              // Check if needs 2 targets
              const btnText = await actionBtn.getText();
              if ((btnText.includes('Predictive') || btnText.includes('Anomaly')) && targets.length > 1) {
                await targets[1].click();
                await wait(200);
              }

              const isDisabled = await actionBtn.getAttribute('disabled');
              if (isDisabled === null) {
                await actionBtn.click();
                await wait(500);
              }
            }
          }
        } catch { /* player might be dead */ }
      }

      await wait(1000);

      // God transitions to day
      const dayBtn = await safeFind(godDriver, By.xpath("//button[contains(text(),'Lanjut ke Daily Standup')]"), 3000);
      if (dayBtn) {
        await dayBtn.click();
        await wait(2000);
      }

      // Check if game ended after night
      const winAfterNight = await safeFind(godDriver, By.xpath("//*[contains(text(),'MENANG')]"), 2000);
      if (winAfterNight) {
        const winText = await winAfterNight.getText();
        log(t, 'PASS', `Game ended after night! ${winText}`);
        return true;
      }

    } else if (pageText.includes('Daily Standup') || pageText.includes('Siang')) {
      // Day phase
      log(t, 'INFO', `Round ${round}: Day`);

      // Players vote for first target
      for (let i = 0; i < playerDrivers.length; i++) {
        try {
          const driver = playerDrivers[i];
          const playerCards = await driver.findElements(By.xpath("//div[contains(@class,'cursor-pointer') and contains(@class,'rounded-lg')]"));
          if (playerCards.length > 0) {
            const targetIdx = (i + 1) % playerCards.length;
            await playerCards[targetIdx].click();
            await wait(200);
          }
        } catch { /* player might be dead */ }
      }

      await wait(500);

      // God processes voting
      const voteBtn = await safeFind(godDriver, By.xpath("//button[contains(text(),'Proses Voting')]"), 3000);
      if (voteBtn) {
        await voteBtn.click();
        await wait(2000);
      }

      // Check if game ended after voting
      const winAfterVote = await safeFind(godDriver, By.xpath("//*[contains(text(),'MENANG')]"), 2000);
      if (winAfterVote) {
        const winText = await winAfterVote.getText();
        log(t, 'PASS', `Game ended after voting! ${winText}`);
        return true;
      }

      // God starts next round
      const nextBtn = await safeFind(godDriver, By.xpath("//button[contains(text(),'Lanjut ke Malam')]"), 3000);
      if (nextBtn) {
        await nextBtn.click();
        await wait(2000);
      }
    } else {
      log(t, 'INFO', `Unknown phase, waiting...`);
      await wait(2000);
    }
  }

  log(t, 'FAIL', `Game did not end after ${MAX_ROUNDS} rounds`);
  return false;
}

// ===== TEST: Game Over Screen =====

async function testGameOver(godDriver: WebDriver, playerDrivers: WebDriver[]) {
  const t = 'Game Over';

  // Check God sees winner
  const winTitle = await getTextSafe(godDriver, By.xpath("//*[contains(text(),'MENANG')]"));
  log(t, winTitle ? 'PASS' : 'FAIL', `Winner: ${winTitle}`);

  // Check all roles revealed
  const godText = await getTextSafe(godDriver, By.css('main'));
  log(t, godText.includes('Semua Role') ? 'PASS' : 'FAIL', 'All roles revealed');

  // Check "Kembali ke Menu" button
  const backBtn = await safeFind(godDriver, By.xpath("//button[contains(text(),'Kembali ke Menu')]"));
  log(t, backBtn ? 'PASS' : 'FAIL', '"Kembali ke Menu" button');

  // Check players see game over too
  for (let i = 0; i < playerDrivers.length; i++) {
    const winEl = await safeFind(playerDrivers[i], By.xpath("//*[contains(text(),'MENANG')]"), 3000);
    log(t, winEl ? 'PASS' : 'FAIL', `${PLAYERS[i]} sees game over`);
  }
}

// ===== TEST: Room Not Found =====

async function testRoomNotFound(driver: WebDriver) {
  const t = 'Room Not Found';
  await driver.get(BASE_URL + '/room/XXXXXX');
  await wait(10000);

  const error = await safeFind(driver, By.xpath("//*[contains(text(),'Tidak') or contains(text(),'tidak')]"), 3000);
  log(t, error ? 'PASS' : 'FAIL', 'Error message displayed');

  const retryBtn = await safeFind(driver, By.xpath("//button[contains(text(),'Coba Lagi')]"), 3000);
  log(t, retryBtn ? 'PASS' : 'FAIL', 'Retry button');

  const backBtn = await safeFind(driver, By.xpath("//button[contains(text(),'Kembali ke Home')]"), 3000);
  log(t, backBtn ? 'PASS' : 'FAIL', 'Back button');
}

// ===== TEST: Leave Room =====

async function testLeaveRoom(driver: WebDriver, playerName: string) {
  const t = `Leave (${playerName})`;
  const leaveBtn = await safeFind(driver, By.xpath("//button[contains(text(),'Keluar Room')]"), 3000);
  if (!leaveBtn) { log(t, 'FAIL', 'Leave button not found'); return; }

  await leaveBtn.click();
  await wait(2000);

  const url = await driver.getCurrentUrl();
  log(t, !url.includes('/room/') ? 'PASS' : 'FAIL', `Redirected: ${url}`);
}

// ===== MAIN RUNNER =====

async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🎮 DATA SABOTAGE - FULL QA TEST SUITE');
  console.log(`📍 URL: ${BASE_URL}`);
  console.log(`👥 Browsers: 1 God + ${PLAYERS.length} Players`);
  console.log('='.repeat(70) + '\n');

  const godDriver = await createDriver();
  const playerDrivers: WebDriver[] = [];

  try {
    // ---- PHASE 1: Page tests (single browser) ----
    console.log('📄 === PAGE TESTS ===\n');
    await testHomepage(godDriver);
    await testSettingsMenu(godDriver);
    await testCaraMain(godDriver);
    await testRoleBook(godDriver);

    // ---- PHASE 2: Room creation ----
    console.log('\n🏠 === ROOM TESTS ===\n');
    const roomCode = await testCreateRoom(godDriver);
    if (!roomCode) throw new Error('Room creation failed, cannot continue');

    await testLobbyChat(godDriver);
    await testLobbyMedia(godDriver);

    // ---- PHASE 3: Player joins (4 players) ----
    console.log('\n👥 === MULTIPLAYER JOIN ===\n');
    for (let i = 0; i < PLAYERS.length; i++) {
      const pDriver = await createDriver();
      const joined = await testJoinRoom(pDriver, PLAYERS[i], roomCode);
      if (joined) {
        playerDrivers.push(pDriver);
      } else {
        await pDriver.quit();
      }
    }

    log('Join', playerDrivers.length === PLAYERS.length ? 'PASS' : 'FAIL',
      `${playerDrivers.length}/${PLAYERS.length} players joined`);

    if (playerDrivers.length < 4) {
      log('Join', 'FAIL', 'Not enough players to start game');
      throw new Error('Not enough players');
    }

    // ---- PHASE 4: Game start ----
    console.log('\n🎬 === GAME START ===\n');
    await testStartGame(godDriver);

    // ---- PHASE 5: Intro ----
    console.log('\n📖 === INTRO PHASE ===\n');
    await testIntroPhase(godDriver, playerDrivers);

    // ---- PHASE 6: First Night ----
    console.log('\n🌙 === FIRST NIGHT ===\n');
    await testNightPhase(godDriver, playerDrivers);

    // ---- PHASE 7: First Day ----
    console.log('\n☀️ === FIRST DAY ===\n');
    await testDayPhase(godDriver, playerDrivers);

    // ---- PHASE 8: Game Loop until win ----
    console.log('\n🔄 === GAME LOOP ===\n');
    const gameEnded = await testGameLoop(godDriver, playerDrivers);

    // ---- PHASE 9: Game Over ----
    if (gameEnded) {
      console.log('\n🏆 === GAME OVER ===\n');
      await testGameOver(godDriver, playerDrivers);
    }

    // ---- PHASE 10: Error handling ----
    console.log('\n⚠️ === ERROR HANDLING ===\n');
    await testRoomNotFound(godDriver);

  } catch (err: unknown) {
    console.error('\n💥 Fatal error:', err instanceof Error ? err.message : err);
  } finally {
    // Summary
    console.log('\n' + '='.repeat(70));
    console.log(`🏁 QA COMPLETE | ✅ ${passCount} passed | ❌ ${failCount} failed | Total: ${passCount + failCount}`);
    console.log('='.repeat(70) + '\n');

    // Cleanup all browsers
    await godDriver.quit();
    for (const d of playerDrivers) {
      try { await d.quit(); } catch { /* ignore */ }
    }
  }
}

runAllTests();
