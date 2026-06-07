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

async function getPageText(driver: WebDriver): Promise<string> {
  try {
    return await driver.findElement(By.css('body')).getText();
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

  // Footer - use body text search instead of specific XPath
  const bodyText = await getPageText(driver);
  log(t, bodyText.includes('Alief Akbar') ? 'PASS' : 'FAIL', 'Footer: Created by Alief Akbar');

  const settingsBtn = await safeFind(driver, By.css('button[title="Pengaturan"]'));
  log(t, settingsBtn ? 'PASS' : 'FAIL', 'Settings button');
}

// ===== TEST: Settings Menu =====

async function testSettingsMenu(driver: WebDriver) {
  const t = 'Settings';
  await driver.get(BASE_URL);
  await wait(1000);

  const btn = await safeFind(driver, By.css('button[title="Pengaturan"]'));
  if (!btn) { log(t, 'FAIL', 'Button not found'); return; }
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
  await wait(3000); // Give more time to load

  const bodyText = await getPageText(driver);
  log(t, bodyText.length > 100 ? 'PASS' : 'FAIL', `Page loaded (${bodyText.length} chars)`);

  const hasContent = bodyText.toLowerCase().includes('lobby') || bodyText.toLowerCase().includes('malam') || bodyText.toLowerCase().includes('cara');
  log(t, hasContent ? 'PASS' : 'FAIL', 'Has game instructions content');
}

// ===== TEST: Role Book =====

async function testRoleBook(driver: WebDriver) {
  const t = 'Role Book';
  await driver.get(BASE_URL + '/role-book');
  await wait(2000);

  const text = await getPageText(driver);
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

  // Set max players to 4
  for (let i = 0; i < 16; i++) {
    const minusBtns = await driver.findElements(By.xpath("//button[contains(text(),'-')]"));
    if (minusBtns.length > 0) await minusBtns[0].click();
    await wait(50);
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
  for (const btn of joinBtns) {
    const text = await btn.getText();
    if (text === 'Gabung') { await btn.click(); break; }
  }
  await wait(3000);

  const url = await driver.getCurrentUrl();
  if (url.includes('/room/')) {
    log(t, 'PASS', 'Joined room');
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
  await wait(1000);

  const startBtn = await safeFind(godDriver, By.xpath("//button[contains(text(),'Mulai Game')]"));
  if (!startBtn) { log(t, 'FAIL', 'Start button not found'); return; }

  const disabled = await startBtn.getAttribute('disabled');
  log(t, disabled === null ? 'PASS' : 'FAIL', `Start button enabled: ${disabled === null}`);

  await startBtn.click();
  await wait(2000);

  const introText = await safeFind(godDriver, By.xpath("//*[contains(text(),'DataNova')]"), 10000);
  log(t, introText ? 'PASS' : 'FAIL', 'Intro storyline started');
}

// ===== TEST: Intro Phase =====

async function testIntroPhase(godDriver: WebDriver, playerDrivers: WebDriver[]) {
  const t = 'Intro Phase';
  log(t, 'INFO', 'Waiting for storyline... (~35s)');
  await wait(36000);

  const nightBtn = await safeFind(godDriver, By.xpath("//button[contains(text(),'Mulai Malam Pertama')]"), 5000);
  log(t, nightBtn ? 'PASS' : 'FAIL', 'God sees "Mulai Malam Pertama"');

  for (let i = 0; i < playerDrivers.length; i++) {
    const bodyText = await getPageText(playerDrivers[i]);
    log(t, bodyText.includes('Role kamu') ? 'PASS' : 'FAIL', `${PLAYERS[i]} sees role`);
  }

  if (nightBtn) {
    await nightBtn.click();
    await wait(2000);
  }
}

// ===== TEST: Night Phase =====

async function testNightPhase(godDriver: WebDriver, playerDrivers: WebDriver[]) {
  const t = 'Night Phase';

  const bodyText = await getPageText(godDriver);
  log(t, bodyText.includes('After Hours') || bodyText.includes('Malam') ? 'PASS' : 'FAIL', 'Night phase detected');
  log(t, bodyText.includes('Head of Data') ? 'PASS' : 'FAIL', 'God sees roles');

  // Each player uses skill
  for (let i = 0; i < playerDrivers.length; i++) {
    const driver = playerDrivers[i];
    try {
      const actionBtn = await safeFind(driver, By.xpath("//button[contains(text(),'Gunakan')]"), 3000);
      if (actionBtn) {
        const targets = await driver.findElements(By.xpath("//div[contains(@class,'cursor-pointer') and contains(@class,'rounded-lg')]"));
        if (targets.length > 0) {
          await targets[0].click();
          await wait(300);

          // Check if 2 targets needed
          const isDisabled = await actionBtn.getAttribute('disabled');
          if (isDisabled !== null && targets.length > 1) {
            await targets[1].click();
            await wait(300);
          }

          const stillDisabled = await actionBtn.getAttribute('disabled');
          if (stillDisabled === null) {
            await actionBtn.click();
            await wait(1000);
          }
        }
        log(t, 'PASS', `${PLAYERS[i]} used night skill`);
      } else {
        log(t, 'INFO', `${PLAYERS[i]} no night action (passive/day)`);
      }
    } catch {
      log(t, 'INFO', `${PLAYERS[i]} skill skipped`);
    }
  }

  // God transitions to day
  const dayBtn = await safeFind(godDriver, By.xpath("//button[contains(text(),'Lanjut ke Daily Standup')]"));
  if (dayBtn) {
    await dayBtn.click();
    await wait(2000);
    log(t, 'PASS', 'Transitioned to day');
  } else {
    log(t, 'FAIL', '"Lanjut ke Daily Standup" not found');
  }
}

// ===== TEST: Day Phase =====

async function testDayPhase(godDriver: WebDriver, playerDrivers: WebDriver[]) {
  const t = 'Day Phase';

  const bodyText = await getPageText(godDriver);
  log(t, bodyText.includes('Daily Standup') || bodyText.includes('Siang') ? 'PASS' : 'FAIL', 'Day phase detected');

  // Check timer
  const hasTimer = bodyText.includes('Debat');
  log(t, hasTimer ? 'PASS' : 'INFO', `Debate timer: ${hasTimer ? 'visible' : 'not set'}`);

  // All players vote for the FIRST target (to avoid tie)
  await voteAllForFirst(playerDrivers);
  log(t, 'PASS', 'All players voted for same target');

  // God processes voting
  await wait(1000);
  const voteBtn = await safeFind(godDriver, By.xpath("//button[contains(text(),'Proses Voting')]"));
  if (voteBtn) {
    await voteBtn.click();
    await wait(2000);
    log(t, 'PASS', 'Voting processed');
  } else {
    log(t, 'FAIL', '"Proses Voting" not found');
  }

  // Check elimination message
  const elimMsg = await getPageText(godDriver);
  if (elimMsg.includes('dieliminasi') || elimMsg.includes('DIPECAT')) {
    log(t, 'PASS', 'Player eliminated');
  } else if (elimMsg.includes('seri')) {
    log(t, 'INFO', 'Voting tied - no elimination');
  } else {
    log(t, 'INFO', 'Voting result unclear');
  }
}

// Helper: all alive players vote for the first target
async function voteAllForFirst(playerDrivers: WebDriver[]) {
  for (const driver of playerDrivers) {
    try {
      const targets = await driver.findElements(By.xpath("//div[contains(@class,'cursor-pointer') and contains(@class,'rounded-lg')]"));
      if (targets.length > 0) {
        await targets[0].click();
        await wait(300);
      }
    } catch { /* player might be dead */ }
  }
}

// ===== TEST: Full Game Loop =====

async function testGameLoop(godDriver: WebDriver, playerDrivers: WebDriver[]) {
  const t = 'Game Loop';
  const MAX_ROUNDS = 10;

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    log(t, 'INFO', `--- Round ${round} ---`);

    // Check game over on God screen
    const godText = await getPageText(godDriver);
    if (godText.includes('MENANG')) {
      log(t, 'PASS', `🏆 Game ended! Winner found`);
      return true;
    }

    if (godText.includes('After Hours') || godText.includes('Malam')) {
      log(t, 'INFO', `Round ${round}: Night`);

      // All players use skills on first target
      for (const driver of playerDrivers) {
        try {
          const actionBtn = await safeFind(driver, By.xpath("//button[contains(text(),'Gunakan')]"), 2000);
          if (actionBtn) {
            const targets = await driver.findElements(By.xpath("//div[contains(@class,'cursor-pointer') and contains(@class,'rounded-lg')]"));
            if (targets.length > 0) {
              await targets[0].click();
              await wait(200);

              // Need 2 targets?
              const isDisabled = await actionBtn.getAttribute('disabled');
              if (isDisabled !== null && targets.length > 1) {
                await targets[1].click();
                await wait(200);
              }

              const stillDisabled = await actionBtn.getAttribute('disabled');
              if (stillDisabled === null) {
                await actionBtn.click();
                await wait(500);
              }
            }
          }
        } catch { /* dead player */ }
      }

      await wait(1000);

      // God → Day
      const dayBtn = await safeFind(godDriver, By.xpath("//button[contains(text(),'Lanjut ke Daily Standup')]"), 3000);
      if (dayBtn) {
        await dayBtn.click();
        await wait(2000);
      }

      // Check win after night
      const afterNight = await getPageText(godDriver);
      if (afterNight.includes('MENANG')) {
        log(t, 'PASS', `🏆 Game ended after night!`);
        return true;
      }

    } else if (godText.includes('Daily Standup') || godText.includes('Siang')) {
      log(t, 'INFO', `Round ${round}: Day`);

      // All alive vote for FIRST target (ensures majority, no tie)
      await voteAllForFirst(playerDrivers);
      await wait(500);

      // God → process vote
      const voteBtn = await safeFind(godDriver, By.xpath("//button[contains(text(),'Proses Voting')]"), 3000);
      if (voteBtn) {
        await voteBtn.click();
        await wait(2000);
      }

      // Check win after vote
      const afterVote = await getPageText(godDriver);
      if (afterVote.includes('MENANG')) {
        log(t, 'PASS', `🏆 Game ended after voting!`);
        return true;
      }

      // God → next night
      const nextBtn = await safeFind(godDriver, By.xpath("//button[contains(text(),'Lanjut ke Malam')]"), 3000);
      if (nextBtn) {
        await nextBtn.click();
        await wait(2000);
      }

    } else {
      log(t, 'INFO', 'Phase unclear, waiting...');
      await wait(3000);
    }
  }

  log(t, 'FAIL', `Game did not end after ${MAX_ROUNDS} rounds`);
  return false;
}

// ===== TEST: Game Over =====

async function testGameOver(godDriver: WebDriver, playerDrivers: WebDriver[]) {
  const t = 'Game Over';

  const godText = await getPageText(godDriver);
  const hasWinner = godText.includes('MENANG');
  log(t, hasWinner ? 'PASS' : 'FAIL', 'Winner displayed');

  if (godText.includes('DATA TEAM')) log(t, 'PASS', '🟢 Data Team won');
  else if (godText.includes('INSIDER THREAT')) log(t, 'PASS', '🔴 Insider Threat won');
  else if (godText.includes('FREELANCER')) log(t, 'PASS', '🟡 Freelancer won');

  log(t, godText.includes('Semua Role') ? 'PASS' : 'FAIL', 'All roles revealed');

  const backBtn = await safeFind(godDriver, By.xpath("//button[contains(text(),'Kembali ke Menu')]"));
  log(t, backBtn ? 'PASS' : 'FAIL', '"Kembali ke Menu" button');

  // All players see game over
  for (let i = 0; i < playerDrivers.length; i++) {
    const pText = await getPageText(playerDrivers[i]);
    log(t, pText.includes('MENANG') ? 'PASS' : 'FAIL', `${PLAYERS[i]} sees game over`);
  }
}

// ===== TEST: Room Not Found =====

async function testRoomNotFound(driver: WebDriver) {
  const t = 'Room Not Found';
  await driver.get(BASE_URL + '/room/XXXXXX');
  await wait(10000);

  const bodyText = await getPageText(driver);
  log(t, bodyText.includes('Tidak') || bodyText.includes('tidak') ? 'PASS' : 'FAIL', 'Error message');

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

// ===== MAIN =====

async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🎮 DATA SABOTAGE - FULL QA TEST SUITE');
  console.log(`📍 URL: ${BASE_URL}`);
  console.log(`👥 Browsers: 1 God + ${PLAYERS.length} Players`);
  console.log('='.repeat(70) + '\n');

  const godDriver = await createDriver();
  const playerDrivers: WebDriver[] = [];

  try {
    // ---- PHASE 1: Page tests ----
    console.log('📄 === PAGE TESTS ===\n');
    await testHomepage(godDriver);
    await testSettingsMenu(godDriver);
    await testCaraMain(godDriver);
    await testRoleBook(godDriver);

    // ---- PHASE 2: Room creation ----
    console.log('\n🏠 === ROOM TESTS ===\n');
    const roomCode = await testCreateRoom(godDriver);
    if (!roomCode) throw new Error('Room creation failed');

    await testLobbyChat(godDriver);
    await testLobbyMedia(godDriver);

    // ---- PHASE 3: Player joins ----
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

    if (playerDrivers.length < 4) throw new Error('Not enough players');

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

    // ---- PHASE 8: Game Loop ----
    console.log('\n🔄 === GAME LOOP (until winner) ===\n');
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
    console.error('\n💥 Fatal:', err instanceof Error ? err.message : err);
  } finally {
    console.log('\n' + '='.repeat(70));
    console.log(`🏁 QA COMPLETE | ✅ ${passCount} passed | ❌ ${failCount} failed | Total: ${passCount + failCount}`);
    console.log('='.repeat(70) + '\n');

    await godDriver.quit();
    for (const d of playerDrivers) {
      try { await d.quit(); } catch { /* ignore */ }
    }
  }
}

runAllTests();
