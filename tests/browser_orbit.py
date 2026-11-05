"""Real browser acceptance of the third Tamagochi mini-game.
Only clicking actual UI controls counts. No direct store awards or mocked notes.
"""
import json
import os
import pathlib
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

BASE=os.environ.get("MORI_BROWSER_BASE","http://127.0.0.1:4173/Tamagochi---Open-Source-Game/")
PROOF=pathlib.Path("artifacts/orbit-beats")
PROOF.mkdir(parents=True,exist_ok=True)
options=Options()
options.add_argument("--headless=new")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--enable-webgl")
options.add_argument("--use-gl=angle")
options.add_argument("--use-angle=swiftshader")
options.add_argument("--enable-unsafe-swiftshader")
options.add_argument("--window-size=1280,850")
options.set_capability("goog:loggingPrefs",{"browser":"ALL"})
browser=webdriver.Chrome(options=options)
wait=WebDriverWait(browser,45)
try:
 browser.get(BASE)
 wait.until(lambda b:b.find_elements(By.CSS_SELECTOR,'[data-arcade-game="orbit-beats"]'))
 # Complete the real first-run tutorial and first companion story once.
 for selector in ['.tutorial-skip','.story-dialog .dialog-close']:
  element=browser.find_elements(By.CSS_SELECTOR,selector)
  if element: browser.execute_script('arguments[0].click()',element[0])
 browser.execute_script('document.querySelector(\'[data-arcade-game="orbit-beats"]\').click()')
 wait.until(lambda b:b.find_elements(By.CSS_SELECTOR,'.orbit-board .game-prompt button'))
 assert "Orbit Beats" == browser.execute_script("return document.querySelector('#game-title')?.textContent?.trim()"), browser.execute_script("return document.querySelector('.game-dialog')?.innerText.slice(0,500)")
 before=browser.execute_script("""return JSON.parse(localStorage.getItem('pocket-worlds-save-v1'))?.state ?? {sparks:0}""")
 browser.save_screenshot(str(PROOF/'01-orbit-start.png'))
 browser.find_element(By.CSS_SELECTOR,'.orbit-board .game-prompt button').click()
 wait.until(lambda b:len(b.find_elements(By.CSS_SELECTOR,'.orbit-hit'))==3)
 assert len(browser.find_elements(By.CSS_SELECTOR,'.orbit-lane'))==3
 # Watch the real CSS note positions and click a real touch-pad button as the
 # approaching note crosses the actual judgment line (no store access).
 hit=browser.execute_async_script("""const done=arguments[0];
  const t0=performance.now();
  const timer=setInterval(()=>{
    const notes=[...document.querySelectorAll('.orbit-note')];
    for(const note of notes){
      const top=parseFloat(note.style.top);
      if(Number.isFinite(top)&&top>=69&&top<=79){
        const parent=note.closest('[data-orbit-lane]');
        const lane=Number(parent?.dataset.orbitLane);
        parent?.querySelector('button.orbit-hit')?.click();
        clearInterval(timer);
        done({lane,top,score:document.querySelector('.game-hud')?.textContent});
        return;
      }
    }
    if(performance.now()-t0>5100){clearInterval(timer);done({error:'no note entered judgment region'})}
  },22);""")
 assert not hit.get('error'),hit
 wait.until(lambda b: b.execute_script("""return [...document.querySelectorAll('.game-hud b')]
   .some(x=>Number.parseInt(x.textContent,10)>0&&x.parentElement?.textContent.includes('SCORE'))"""))
 browser.save_screenshot(str(PROOF/'02-live-rhythm-hits.png'))
 wait.until(lambda b:b.find_elements(By.CSS_SELECTOR,'.orbit-board .game-prompt button'))
 completed=browser.execute_script("""return (()=>({
   result:document.querySelector('.orbit-board .game-prompt')?.textContent,
   save:JSON.parse(localStorage.getItem('pocket-worlds-save-v1')).state
 }))()""")
 assert 'rhythm points' in completed['result'],completed['result']
 assert completed['save']['sparks']>before['sparks'],completed
 assert completed['save']['activityBest']['orbit-beats']>=1,completed
 browser.save_screenshot(str(PROOF/'03-orbit-result.png'))
 browser.find_element(By.CSS_SELECTOR,'.game-dialog header button').click()
 assert 'Best score' in browser.find_element(By.CSS_SELECTOR,'[data-arcade-game="orbit-beats"]').text
 browser.refresh()
 wait.until(lambda b:b.find_elements(By.CSS_SELECTOR,'[data-arcade-game="orbit-beats"]'))
 persisted=browser.execute_script("""return JSON.parse(localStorage.getItem('pocket-worlds-save-v1')).state""")
 assert persisted['activityBest']['orbit-beats']==completed['save']['activityBest']['orbit-beats'],persisted
 assert persisted['sparks']>=completed['save']['sparks'],persisted
 browser.set_window_size(390,844)
 browser.execute_script('document.querySelector(\'[data-arcade-game="orbit-beats"]\').click()')
 wait.until(lambda b:b.find_elements(By.CSS_SELECTOR,'.orbit-board .game-prompt button'))
 browser.find_element(By.CSS_SELECTOR,'.orbit-board .game-prompt button').click()
 mobile=browser.execute_script("""return (()=>({
   width:innerWidth,track:(()=>{const r=document.querySelector('.orbit-track').getBoundingClientRect();
     return {left:r.left,right:r.right,width:r.width}})(),
   laneButtons:document.querySelectorAll('.orbit-hit').length,
   dialog:(()=>{const r=document.querySelector('.game-dialog').getBoundingClientRect();
     return {left:r.left,right:r.right}})()
 }))()""")
 assert mobile['laneButtons']==3,mobile
 assert mobile['track']['left']>=0 and mobile['track']['right']<=mobile['width']+2,mobile
 browser.save_screenshot(str(PROOF/'04-orbit-mobile.png'))
 errors=[x['message'] for x in browser.get_log('browser')
         if x['level']=='SEVERE' and 'favicon' not in x['message']]
 assert not errors,errors
 result={'status':'PASS','click':hit,'result':completed['result'],
   'best':persisted['activityBest']['orbit-beats'],'sparks':persisted['sparks'],
   'mobile':mobile,'consoleErrors':errors}
 (PROOF/'report.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
 print(json.dumps(result,ensure_ascii=False),flush=True)
finally:
 browser.quit()
